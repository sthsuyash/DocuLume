"""E2E tests for complete chat workflow."""

import pytest
import io
from httpx import AsyncClient
from app.config import settings


pytestmark = pytest.mark.asyncio


class TestCompleteChatWorkflow:
    """Test complete chat lifecycle."""

    async def test_complete_chat_workflow(self, client: AsyncClient, auth_headers):
        """Test: Upload document → Ask question → Get answer → Export conversation."""
        
        # 1. Upload a document first
        file_content = b"The capital of France is Paris. Paris is known for the Eiffel Tower."
        files = {
            "file": ("france.txt", io.BytesIO(file_content), "text/plain")
        }
        upload_resp = await client.post(
            f"{settings.api_v1_prefix}/documents/upload",
            files=files,
            headers=auth_headers
        )
        assert upload_resp.status_code == 201
        doc_id = upload_resp.json()["id"]

        # 2. Ask question with RAG
        chat_request = {
            "question": "What is the capital of France?",
            "use_rag": True,
            "top_k": 5
        }
        chat_resp = await client.post(
            f"{settings.api_v1_prefix}/chat/ask",
            json=chat_request,
            headers=auth_headers
        )
        assert chat_resp.status_code == 200
        chat_data = chat_resp.json()
        assert "answer" in chat_data
        assert "conversation_id" in chat_data
        assert "message_id" in chat_data
        conversation_id = chat_data["conversation_id"]

        # 3. Continue conversation
        followup_request = {
            "question": "What is it known for?",
            "conversation_id": conversation_id,
            "use_rag": True
        }
        followup_resp = await client.post(
            f"{settings.api_v1_prefix}/chat/ask",
            json=followup_request,
            headers=auth_headers
        )
        assert followup_resp.status_code == 200
        assert followup_resp.json()["conversation_id"] == conversation_id

        # 4. List conversations
        conv_list_resp = await client.get(
            f"{settings.api_v1_prefix}/chat/conversations",
            headers=auth_headers
        )
        assert conv_list_resp.status_code == 200
        convs = conv_list_resp.json()
        assert convs["total"] >= 1
        assert any(c["id"] == conversation_id for c in convs["items"])

        # 5. Get conversation messages
        messages_resp = await client.get(
            f"{settings.api_v1_prefix}/chat/conversations/{conversation_id}/messages",
            headers=auth_headers
        )
        assert messages_resp.status_code == 200
        messages = messages_resp.json()
        assert len(messages) >= 4  # 2 questions + 2 answers

        # 6. Export conversation (JSON)
        export_resp = await client.get(
            f"{settings.api_v1_prefix}/chat/conversations/{conversation_id}/export?format=json",
            headers=auth_headers
        )
        assert export_resp.status_code == 200
        assert export_resp.headers["content-type"] == "application/json"

        # 7. Export conversation (Markdown)
        export_md_resp = await client.get(
            f"{settings.api_v1_prefix}/chat/conversations/{conversation_id}/export?format=markdown",
            headers=auth_headers
        )
        assert export_md_resp.status_code == 200
        assert "text/markdown" in export_md_resp.headers["content-type"]

        # 8. Cleanup - delete document
        await client.delete(
            f"{settings.api_v1_prefix}/documents/{doc_id}",
            headers=auth_headers
        )

    async def test_chat_without_rag(self, client: AsyncClient, auth_headers):
        """Test chat without RAG (direct LLM)."""
        
        chat_request = {
            "question": "What is 2 + 2?",
            "use_rag": False
        }
        
        resp = await client.post(
            f"{settings.api_v1_prefix}/chat/ask",
            json=chat_request,
            headers=auth_headers
        )
        
        assert resp.status_code == 200
        data = resp.json()
        assert "answer" in data
        assert "conversation_id" in data

    async def test_streaming_chat(self, client: AsyncClient, auth_headers):
        """Test streaming chat endpoint."""
        
        chat_request = {
            "question": "Tell me a short story.",
            "use_rag": False
        }
        
        async with client.stream(
            "POST",
            f"{settings.api_v1_prefix}/chat/ask/stream",
            json=chat_request,
            headers=auth_headers
        ) as resp:
            assert resp.status_code == 200
            assert "text/event-stream" in resp.headers["content-type"]
            
            # Read at least one chunk
            chunks = []
            async for chunk in resp.aiter_text():
                chunks.append(chunk)
                if len(chunks) >= 5:  # Read first 5 chunks
                    break
            
            assert len(chunks) > 0

    async def test_conversation_isolation(self, client: AsyncClient, auth_headers):
        """Test that conversations are isolated between users."""
        
        # User 1 creates conversation
        chat_request = {
            "question": "Hello from user 1",
            "use_rag": False
        }
        resp1 = await client.post(
            f"{settings.api_v1_prefix}/chat/ask",
            json=chat_request,
            headers=auth_headers
        )
        conv_id_1 = resp1.json()["conversation_id"]

        # Register second user
        register_data = {
            "email": "user2_chat@example.com",
            "username": "user2_chat",
            "password": "Password123!",
        }
        await client.post(f"{settings.api_v1_prefix}/auth/register", json=register_data)
        
        # Login as user 2
        login_resp = await client.post(
            f"{settings.api_v1_prefix}/auth/login",
            json={"email": register_data["email"], "password": register_data["password"]}
        )
        user2_token = login_resp.json()["access_token"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}

        # User 2 tries to access user 1's conversation
        forbidden_resp = await client.get(
            f"{settings.api_v1_prefix}/chat/conversations/{conv_id_1}/messages",
            headers=user2_headers
        )
        assert forbidden_resp.status_code in [403, 404]  # Forbidden or Not Found

    async def test_invalid_export_format(self, client: AsyncClient, auth_headers):
        """Test that invalid export formats are rejected."""
        
        # Create conversation first
        resp = await client.post(
            f"{settings.api_v1_prefix}/chat/ask",
            json={"question": "Test", "use_rag": False},
            headers=auth_headers
        )
        conv_id = resp.json()["conversation_id"]

        # Try invalid format
        invalid_resp = await client.get(
            f"{settings.api_v1_prefix}/chat/conversations/{conv_id}/export?format=invalid",
            headers=auth_headers
        )
        
        assert invalid_resp.status_code == 422  # Validation error

    async def test_empty_question_rejected(self, client: AsyncClient, auth_headers):
        """Test that empty questions are rejected."""
        
        chat_request = {
            "question": "",
            "use_rag": False
        }
        
        resp = await client.post(
            f"{settings.api_v1_prefix}/chat/ask",
            json=chat_request,
            headers=auth_headers
        )
        
        assert resp.status_code == 422  # Validation error

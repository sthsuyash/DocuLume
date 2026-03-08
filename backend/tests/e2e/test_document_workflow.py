"""E2E tests for complete document workflow."""

import pytest
import io
from httpx import AsyncClient
from app.config import settings


pytestmark = pytest.mark.asyncio


class TestCompleteDocumentWorkflow:
    """Test complete document lifecycle from registration to deletion."""

    async def test_complete_document_workflow(self, client: AsyncClient):
        """Test: Register → Login → Upload → List → Chat → Delete."""
        
        # 1. Register user
        register_data = {
            "email": "e2e_test@example.com",
            "username": "e2e_user",
            "password": "SecurePass123!",
            "full_name": "E2E Test User"
        }
        register_resp = await client.post(
            f"{settings.api_v1_prefix}/auth/register",
            json=register_data
        )
        assert register_resp.status_code == 201
        user_data = register_resp.json()
        assert user_data["email"] == register_data["email"]

        # 2. Login
        login_resp = await client.post(
            f"{settings.api_v1_prefix}/auth/login",
            json={
                "email": register_data["email"],
                "password": register_data["password"]
            }
        )
        assert login_resp.status_code == 200
        tokens = login_resp.json()
        access_token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 3. Upload document
        file_content = b"This is a test document for E2E testing. It contains important information."
        files = {
            "file": ("test_document.txt", io.BytesIO(file_content), "text/plain")
        }
        upload_resp = await client.post(
            f"{settings.api_v1_prefix}/documents/upload",
            files=files,
            headers=headers
        )
        assert upload_resp.status_code == 201
        document = upload_resp.json()
        doc_id = document["id"]
        assert document["original_filename"] == "test_document.txt"
        assert document["status"] in ["processing", "completed"]

        # 4. List documents (should include uploaded document)
        list_resp = await client.get(
            f"{settings.api_v1_prefix}/documents/",
            headers=headers
        )
        assert list_resp.status_code == 200
        docs_data = list_resp.json()
        assert docs_data["total"] >= 1
        assert any(d["id"] == doc_id for d in docs_data["items"])

        # 5. Search documents
        search_resp = await client.get(
            f"{settings.api_v1_prefix}/documents/?search=test_document",
            headers=headers
        )
        assert search_resp.status_code == 200
        search_data = search_resp.json()
        assert search_data["total"] >= 1

        # 6. Delete document
        delete_resp = await client.delete(
            f"{settings.api_v1_prefix}/documents/{doc_id}",
            headers=headers
        )
        assert delete_resp.status_code == 204

        # 7. Verify deletion
        list_after_delete = await client.get(
            f"{settings.api_v1_prefix}/documents/",
            headers=headers
        )
        assert list_after_delete.status_code == 200
        docs_after = list_after_delete.json()
        assert not any(d["id"] == doc_id for d in docs_after["items"])

    async def test_bulk_upload_workflow(self, client: AsyncClient, auth_headers):
        """Test bulk upload and bulk delete workflow."""
        
        # 1. Bulk upload multiple documents
        files = [
            ("files", ("doc1.txt", io.BytesIO(b"Document 1 content"), "text/plain")),
            ("files", ("doc2.txt", io.BytesIO(b"Document 2 content"), "text/plain")),
            ("files", ("doc3.txt", io.BytesIO(b"Document 3 content"), "text/plain")),
        ]
        
        bulk_upload_resp = await client.post(
            f"{settings.api_v1_prefix}/documents/bulk-upload",
            files=files,
            headers=auth_headers
        )
        assert bulk_upload_resp.status_code == 201
        bulk_result = bulk_upload_resp.json()
        assert bulk_result["total"] == 3
        assert bulk_result["successful"] >= 0
        
        # Collect document IDs
        doc_ids = [
            result["document"]["id"] 
            for result in bulk_result["results"] 
            if result["success"]
        ]
        
        # 2. Bulk delete
        if doc_ids:
            bulk_delete_resp = await client.post(
                f"{settings.api_v1_prefix}/documents/bulk-delete",
                json={"document_ids": doc_ids},
                headers=auth_headers
            )
            assert bulk_delete_resp.status_code == 204

    async def test_unauthorized_access_rejected(self, client: AsyncClient):
        """Test that unauthorized access is properly rejected."""
        
        # Try to access protected endpoints without auth
        endpoints = [
            ("GET", "/documents/"),
            ("POST", "/documents/upload"),
            ("DELETE", "/documents/1"),
        ]
        
        for method, path in endpoints:
            if method == "GET":
                resp = await client.get(f"{settings.api_v1_prefix}{path}")
            elif method == "POST":
                resp = await client.post(f"{settings.api_v1_prefix}{path}")
            elif method == "DELETE":
                resp = await client.delete(f"{settings.api_v1_prefix}{path}")
            
            assert resp.status_code == 401  # Unauthorized

    async def test_invalid_file_type_rejected(self, client: AsyncClient, auth_headers):
        """Test that invalid file types are rejected."""
        
        # Try to upload executable file
        files = {
            "file": ("malicious.exe", io.BytesIO(b"MZ\x90\x00"), "application/x-msdownload")
        }
        
        resp = await client.post(
            f"{settings.api_v1_prefix}/documents/upload",
            files=files,
            headers=auth_headers
        )
        
        assert resp.status_code == 400
        assert "not allowed" in resp.json()["detail"].lower()

    async def test_file_size_limit_enforced(self, client: AsyncClient, auth_headers):
        """Test that file size limits are enforced."""
        
        # Create file larger than max size
        max_size = settings.max_file_size_mb * 1024 * 1024
        large_content = b"x" * (max_size + 1024)
        
        files = {
            "file": ("large.txt", io.BytesIO(large_content), "text/plain")
        }
        
        resp = await client.post(
            f"{settings.api_v1_prefix}/documents/upload",
            files=files,
            headers=auth_headers
        )
        
        assert resp.status_code == 400
        assert "size" in resp.json()["detail"].lower()

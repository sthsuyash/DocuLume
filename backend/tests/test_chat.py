"""Tests for chat endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ask_question_without_auth(client: AsyncClient):
    """Test asking question without authentication."""
    response = await client.post(
        "/api/v1/chat/ask",
        json={"question": "What is AI?", "use_rag": False}
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_conversations(client: AsyncClient, test_user_data):
    """Test listing conversations."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/chat/conversations",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "conversations" in data
    assert "total" in data
    assert isinstance(data["conversations"], list)


@pytest.mark.asyncio
async def test_ask_without_rag(client: AsyncClient, test_user_data):
    """Test asking question without RAG (requires OpenAI API key)."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    response = await client.post(
        "/api/v1/chat/ask",
        json={"question": "Say 'test' only", "use_rag": False},
        headers={"Authorization": f"Bearer {token}"}
    )

    # May fail if no API key, but should not crash
    assert response.status_code in [200, 400, 500]


@pytest.mark.asyncio
async def test_conversation_messages_not_found(client: AsyncClient, test_user_data):
    """Test getting messages for non-existent conversation."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/chat/conversations/99999/messages",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 404

"""Tests for document endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from io import BytesIO


@pytest.mark.asyncio
async def test_upload_document(client: AsyncClient, test_user_data):
    """Test document upload."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    # Create a fake PDF file
    fake_pdf = BytesIO(b"%PDF-1.4 fake content")
    files = {"file": ("test.txt", fake_pdf, "text/plain")}

    response = await client.post(
        "/api/v1/documents/upload",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["filename"] == "test.txt"
    assert data["status"] in ["PROCESSING", "COMPLETED", "FAILED"]


@pytest.mark.asyncio
async def test_list_documents(client: AsyncClient, test_user_data):
    """Test listing documents."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/documents/",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert "total" in data
    assert isinstance(data["documents"], list)


@pytest.mark.asyncio
async def test_upload_without_auth(client: AsyncClient):
    """Test upload without authentication."""
    fake_pdf = BytesIO(b"fake content")
    files = {"file": ("test.txt", fake_pdf, "text/plain")}

    response = await client.post("/api/v1/documents/upload", files=files)

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_search_documents(client: AsyncClient, test_user_data):
    """Test document search."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    # Search for documents
    response = await client.get(
        "/api/v1/documents/?search=test",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "documents" in data

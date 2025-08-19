"""Tests for document endpoints."""

import pytest
from httpx import AsyncClient
from io import BytesIO


async def _login(client: AsyncClient, test_user_data: dict) -> None:
    """Register and login, populating the client cookie jar."""
    await client.post("/api/v1/auth/register", json=test_user_data)
    await client.post("/api/v1/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"],
    })


@pytest.mark.asyncio
async def test_upload_document(client: AsyncClient, test_user_data):
    """Test document upload."""
    await _login(client, test_user_data)

    # Real PDF magic bytes so MIME validation passes
    pdf_bytes = b"%PDF-1.4 fake content"
    files = {"file": ("test.pdf", BytesIO(pdf_bytes), "application/pdf")}

    response = await client.post("/api/v1/documents/upload", files=files)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] in ["PROCESSING", "COMPLETED", "FAILED"]


@pytest.mark.asyncio
async def test_list_documents(client: AsyncClient, test_user_data):
    """Test listing documents returns paginated response."""
    await _login(client, test_user_data)

    response = await client.get("/api/v1/documents/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_upload_without_auth(client: AsyncClient):
    """Test upload without authentication returns 401 or 403."""
    files = {"file": ("test.pdf", BytesIO(b"%PDF-1.4"), "application/pdf")}
    response = await client.post("/api/v1/documents/upload", files=files)
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_search_documents(client: AsyncClient, test_user_data):
    """Test document search."""
    await _login(client, test_user_data)

    response = await client.get("/api/v1/documents/?search=test")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data

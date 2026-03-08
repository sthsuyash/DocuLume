"""API security tests."""
import pytest

@pytest.mark.asyncio
async def test_auth_required(client):
    """Test endpoints require authentication."""
    response = await client.get("/api/v1/documents/")
    assert response.status_code in [401, 403]

@pytest.mark.asyncio
async def test_xss_prevention(client):
    """Test XSS payload is rejected."""
    payload = {"email": "<script>alert('xss')</script>@test.com"}
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422

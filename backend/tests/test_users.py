"""Tests for user endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, test_user_data):
    """Test getting current user info."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user_data["email"]
    assert data["username"] == test_user_data["username"]
    assert data["full_name"] == test_user_data["full_name"]


@pytest.mark.asyncio
async def test_update_user_profile(client: AsyncClient, test_user_data):
    """Test updating user profile."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    # Update profile
    update_data = {
        "full_name": "Updated Name",
        "openai_api_key": "sk-test123"
    }

    response = await client.patch(
        "/api/v1/users/me",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_update_user_without_auth(client: AsyncClient):
    """Test updating user without authentication."""
    response = await client.patch(
        "/api/v1/users/me",
        json={"full_name": "Test"}
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_api_keys(client: AsyncClient, test_user_data):
    """Test updating API keys."""
    # Register and login
    await client.post("/api/v1/auth/register", json=test_user_data)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]}
    )
    token = login_response.json()["access_token"]

    # Update API keys
    update_data = {
        "openai_api_key": "sk-openai-test",
        "anthropic_api_key": "sk-ant-test",
        "google_api_key": "AIza-test"
    }

    response = await client.patch(
        "/api/v1/users/me",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200

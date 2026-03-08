"""Tests for health check endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_basic_health_check(client: AsyncClient):
    """Test basic health check."""
    response = await client.get("/api/v1/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "app_name" in data["data"]


@pytest.mark.asyncio
async def test_detailed_health_check(client: AsyncClient):
    """Test detailed health check."""
    response = await client.get("/api/v1/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert "database" in data["checks"]
    assert "redis" in data["checks"]


@pytest.mark.asyncio
async def test_liveness_check(client: AsyncClient):
    """Test liveness probe."""
    response = await client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"

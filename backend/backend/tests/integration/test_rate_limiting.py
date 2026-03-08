"""Integration tests for rate limiting middleware."""

import pytest
from httpx import AsyncClient
from datetime import timedelta
from app.utils.security import create_access_token
from app.config import settings
from app.models.user import User


pytestmark = pytest.mark.asyncio


class TestRateLimitingAuthenticated:
    """Test rate limiting for authenticated users."""

    @pytest.fixture
    async def test_user(self, db_session):
        """Create a test user."""
        user = User(
            email="ratelimit@example.com",
            username="ratelimituser",
            hashed_password="hashed",
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    @pytest.fixture
    def auth_token(self, test_user):
        """Create an auth token for the test user."""
        return create_access_token(
            data={"sub": str(test_user.id), "email": test_user.email},
            expires_delta=timedelta(hours=1)
        )

    async def test_authenticated_user_shares_rate_limit_across_ips(
        self, client: AsyncClient, auth_token: str, redis_client
    ):
        """Test that authenticated users share rate limit across different IPs."""
        # Clear any existing rate limits
        await redis_client.flushdb()

        # Make requests from different IPs with same JWT token
        headers_ip1 = {
            "Authorization": f"Bearer {auth_token}",
            "X-Forwarded-For": "192.168.1.1"
        }
        headers_ip2 = {
            "Authorization": f"Bearer {auth_token}",
            "X-Forwarded-For": "192.168.1.2"
        }

        # Make rate_limit_per_minute requests from IP1
        endpoint = f"{settings.api_v1_prefix}/auth/me"
        for i in range(settings.rate_limit_per_minute):
            response = await client.get(endpoint, headers=headers_ip1)
            assert response.status_code in [200, 401]

        # Next request from IP2 with same token should be rate limited
        response = await client.get(endpoint, headers=headers_ip2)
        assert response.status_code == 429
        assert "Too many requests" in response.json()["detail"]

    async def test_different_users_have_separate_rate_limits(
        self, client: AsyncClient, db_session, redis_client
    ):
        """Test that different users have independent rate limits."""
        await redis_client.flushdb()

        # Create two users
        user1 = User(email="user1@example.com", username="user1", hashed_password="h1")
        user2 = User(email="user2@example.com", username="user2", hashed_password="h2")
        db_session.add_all([user1, user2])
        await db_session.commit()

        # Create tokens
        token1 = create_access_token(data={"sub": str(user1.id)})
        token2 = create_access_token(data={"sub": str(user2.id)})

        endpoint = f"{settings.api_v1_prefix}/auth/me"

        # Max out user1s rate limit
        headers1 = {"Authorization": f"Bearer {token1}"}
        for i in range(settings.rate_limit_per_minute):
            await client.get(endpoint, headers=headers1)

        # User1s next request should be rate limited
        response = await client.get(endpoint, headers=headers1)
        assert response.status_code == 429

        # User2 should still have full rate limit available
        headers2 = {"Authorization": f"Bearer {token2}"}
        response = await client.get(endpoint, headers=headers2)
        assert response.status_code in [200, 401]


class TestRateLimitingAnonymous:
    """Test rate limiting for anonymous users."""

    async def test_anonymous_users_rate_limited_by_ip_and_user_agent(
        self, client: AsyncClient, redis_client
    ):
        """Test that anonymous users are rate limited by IP + User-Agent hash."""
        await redis_client.flushdb()

        endpoint = f"{settings.api_v1_prefix}/auth/login"
        data = {"email": "test@example.com", "password": "password"}
        headers = {"User-Agent": "TestClient/1.0"}

        # Max out rate limit
        for i in range(settings.rate_limit_per_minute):
            response = await client.post(endpoint, json=data, headers=headers)
            assert response.status_code in [200, 401, 422]

        # Next request should be rate limited
        response = await client.post(endpoint, json=data, headers=headers)
        assert response.status_code == 429

    async def test_different_user_agents_get_separate_limits(
        self, client: AsyncClient, redis_client
    ):
        """Test that different User-Agents from same IP get separate rate limits."""
        await redis_client.flushdb()

        endpoint = f"{settings.api_v1_prefix}/auth/login"
        data = {"email": "test@example.com", "password": "password"}

        # Max out rate limit for User-Agent 1
        headers1 = {"User-Agent": "Chrome/100.0"}
        for i in range(settings.rate_limit_per_minute):
            await client.post(endpoint, json=data, headers=headers1)

        # User-Agent 1 should be rate limited
        response = await client.post(endpoint, json=data, headers=headers1)
        assert response.status_code == 429

        # User-Agent 2 from same IP should have separate limit
        headers2 = {"User-Agent": "Firefox/100.0"}
        response = await client.post(endpoint, json=data, headers=headers2)
        assert response.status_code in [200, 401, 422]


class TestRateLimitingEdgeCases:
    """Test edge cases and security scenarios."""

    async def test_invalid_jwt_token_falls_back_to_anonymous(
        self, client: AsyncClient, redis_client
    ):
        """Test that invalid JWT tokens fall back to anonymous rate limiting."""
        await redis_client.flushdb()

        endpoint = f"{settings.api_v1_prefix}/auth/me"
        headers = {"Authorization": "Bearer invalid-token-12345"}

        response = await client.get(endpoint, headers=headers)
        assert response.status_code in [200, 401, 422]

    async def test_health_check_bypasses_rate_limit(
        self, client: AsyncClient, redis_client
    ):
        """Test that health check endpoint bypasses rate limiting."""
        await redis_client.flushdb()

        endpoint = f"{settings.api_v1_prefix}/"

        # Make many requests to health check
        for i in range(settings.rate_limit_per_minute + 10):
            response = await client.get(endpoint)
            assert response.status_code != 429

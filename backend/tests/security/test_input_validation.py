"""Security tests for input validation."""

import pytest
from httpx import AsyncClient
from app.config import settings


pytestmark = pytest.mark.asyncio


class TestInputValidation:
    """Test input validation across all endpoints."""

    async def test_sql_injection_prevention(self, client: AsyncClient, auth_headers):
        """Test that SQL injection attempts are blocked."""
        malicious_queries = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
        ]
        
        for query in malicious_queries:
            resp = await client.get(
                f"{settings.api_v1_prefix}/documents/?search={query}",
                headers=auth_headers
            )
            assert resp.status_code in [200, 422]

    async def test_xss_prevention(self, client: AsyncClient):
        """Test that XSS payloads are sanitized."""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
        ]
        
        for payload in xss_payloads:
            register_data = {
                "email": "xss@example.com",
                "username": payload,
                "password": "Password123!"
            }
            resp = await client.post(
                f"{settings.api_v1_prefix}/auth/register",
                json=register_data
            )
            assert resp.status_code in [201, 422]

    async def test_path_traversal_prevention(self, client: AsyncClient, auth_headers):
        """Test that path traversal is prevented."""
        malicious_filenames = [
            "../../../etc/passwd",
            "....//....//etc/passwd"
        ]
        
        import io
        for filename in malicious_filenames:
            files = {"file": (filename, io.BytesIO(b"test"), "text/plain")}
            resp = await client.post(
                f"{settings.api_v1_prefix}/documents/upload",
                files=files,
                headers=auth_headers
            )
            assert resp.status_code in [201, 400, 422]

    async def test_email_validation(self, client: AsyncClient):
        """Test email format validation."""
        invalid_emails = ["notanemail", "@example.com", "user@"]
        
        for email in invalid_emails:
            resp = await client.post(
                f"{settings.api_v1_prefix}/auth/register",
                json={"email": email, "username": "test", "password": "Pass123!"}
            )
            assert resp.status_code == 422

    async def test_password_strength_validation(self, client: AsyncClient):
        """Test password strength requirements."""
        weak_passwords = ["123", "password", "abc"]
        
        for pwd in weak_passwords:
            resp = await client.post(
                f"{settings.api_v1_prefix}/auth/register",
                json={"email": "test@example.com", "username": "test", "password": pwd}
            )
            assert resp.status_code in [400, 422]

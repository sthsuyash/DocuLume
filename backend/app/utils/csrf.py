"""CSRF protection utilities for cookie-based authentication."""

import secrets
import hmac
import hashlib
from typing import Optional
from datetime import datetime, timedelta
from app.config import settings


def generate_csrf_token() -> str:
    """Generate a secure random CSRF token."""
    return secrets.token_urlsafe(32)


def create_csrf_signature(token: str, user_id: int) -> str:
    """Create HMAC signature for CSRF token to bind it to user session."""
    message = f"{token}:{user_id}".encode()
    signature = hmac.new(
        settings.jwt_secret_key.encode(),
        message,
        hashlib.sha256
    ).hexdigest()
    return signature


def verify_csrf_token(token: str, signature: str, user_id: int) -> bool:
    """Verify CSRF token signature matches expected value for user."""
    expected_signature = create_csrf_signature(token, user_id)
    return hmac.compare_digest(signature, expected_signature)


def create_csrf_token_with_signature(user_id: int) -> tuple[str, str]:
    """Generate CSRF token and its signature for a user.

    Returns:
        tuple[str, str]: (csrf_token, csrf_signature)
    """
    csrf_token = generate_csrf_token()
    csrf_signature = create_csrf_signature(csrf_token, user_id)
    return csrf_token, csrf_signature

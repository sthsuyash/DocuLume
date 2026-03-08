"""CSRF protection middleware."""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.csrf import verify_csrf_token
from app.utils.security import verify_token
from typing import Optional


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware to validate CSRF tokens for state-changing requests."""

    # Methods that require CSRF protection
    PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    # Endpoints that don't require CSRF (authentication endpoints)
    EXEMPT_PATHS = {
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
        "/api/v1/auth/oauth",
        "/api/v1/",  # Health check
        "/docs",
        "/redoc",
        "/openapi.json",
    }

    async def dispatch(self, request: Request, call_next):
        """Validate CSRF token for protected requests."""

        # Skip CSRF check for exempt paths
        if any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS):
            return await call_next(request)

        # Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
        if request.method not in self.PROTECTED_METHODS:
            return await call_next(request)

        # Get CSRF token from header
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing"
            )

        # Get CSRF signature from cookie
        csrf_signature = request.cookies.get("csrf_signature")
        if not csrf_signature:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF signature missing"
            )

        # Get user ID from access token cookie
        access_token = request.cookies.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )

        # Verify access token to get user ID
        payload = verify_token(access_token, token_type="access")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token"
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        # Verify CSRF token
        if not verify_csrf_token(csrf_token, csrf_signature, int(user_id)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token"
            )

        # CSRF validation passed
        response = await call_next(request)
        return response

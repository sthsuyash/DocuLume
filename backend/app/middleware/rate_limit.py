"""Rate limiting middleware."""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from redis.asyncio import Redis
from app.database import get_redis
from app.config import settings
from app.utils.logger import logger
from app.utils.security import verify_token
import hashlib
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis."""

    def _get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting.

        Extracts user ID from JWT token if present, otherwise uses IP + User-Agent hash.
        This allows authenticated users to share rate limits across different IPs/devices.

        Args:
            request: The HTTP request

        Returns:
            String identifier for rate limiting (e.g., "user:123" or "anon:192.168.1.1:abc123")
        """
        # Try to extract user from JWT token (before auth middleware runs)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            payload = verify_token(token, token_type="access")
            if payload and payload.get("sub"):
                # User authenticated - use user ID for rate limiting
                return f"user:{payload['sub']}"

        # Fallback: IP + User-Agent hash for anonymous users
        # This prevents simple IP changes from bypassing rate limits
        ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("User-Agent", "unknown")[:100]
        ua_hash = hashlib.md5(user_agent.encode()).hexdigest()[:8]
        return f"anon:{ip}:{ua_hash}"

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        # Skip rate limiting for health check
        if request.url.path == f"{settings.api_v1_prefix}/":
            return await call_next(request)

        # Get client identifier (extract from JWT directly, not from request.state)
        client_id = self._get_client_identifier(request)

        # Check rate limit
        redis: Redis = await get_redis()
        key = f"rate_limit:{client_id}"

        try:
            # Get current count
            current = await redis.get(key)

            if current is None:
                # First request in window
                await redis.setex(key, 60, 1)
            else:
                count = int(current)
                if count >= settings.rate_limit_per_minute:
                    logger.warning(f"Rate limit exceeded for {client_id}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests. Please try again later."
                    )

                # Increment counter
                await redis.incr(key)

        except HTTPException:
            raise
        except Exception as e:
            # If Redis fails, allow request but log error
            logger.error(f"Rate limit check failed: {str(e)}")

        response = await call_next(request)
        return response

"""Request body size limit middleware."""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests whose Content-Length exceeds the configured file size limit.

    Uses Content-Length header for a fast early-reject before reading the body.
    The limit is set to max_file_size_mb + 1 MB of overhead for JSON/form fields.
    """

    def __init__(self, app, max_bytes: int | None = None):
        super().__init__(app)
        overhead_mb = 1
        self._max_bytes = max_bytes or (settings.max_file_size_mb + overhead_mb) * 1024 * 1024

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self._max_bytes:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": f"Request body too large. Maximum allowed size is {self._max_bytes // (1024 * 1024)} MB."},
            )
        return await call_next(request)

"""Metrics middleware for tracking HTTP requests."""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.utils.prometheus import (
    http_requests_total,
    http_request_duration_seconds
)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to track HTTP request metrics."""

    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Extract endpoint info
        method = request.method
        path = request.url.path
        status = response.status_code

        # Update metrics
        http_requests_total.labels(
            method=method,
            endpoint=path,
            status=status
        ).inc()

        http_request_duration_seconds.labels(
            method=method,
            endpoint=path
        ).observe(duration)

        return response

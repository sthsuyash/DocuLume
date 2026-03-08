"""Main application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import init_db, close_db
from app.api.v1 import api_router
from app.middleware import handle_errors
from app.utils.logger import logger
from app.utils.cache import cache_manager

# Import tracing if enabled
if settings.otel_enabled:
    from app.middleware.tracing import setup_tracing


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting application...")
    await init_db()
    logger.info("Database initialized")
    await cache_manager.connect()
    logger.info("Cache initialized")
    yield
    logger.info("Shutting down...")
    await cache_manager.disconnect()
    logger.info("Cache closed")
    await close_db()
    logger.info("Database closed")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Setup OpenTelemetry tracing
if settings.otel_enabled:
    setup_tracing(app)
    logger.info("OpenTelemetry tracing enabled")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CSRF protection middleware (must be before auth checks)
from app.middleware.csrf import CSRFMiddleware
app.add_middleware(CSRFMiddleware)

# Rate limiting middleware
from app.middleware.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware)

# Security headers middleware
from app.middleware.security import SecurityHeadersMiddleware
app.add_middleware(SecurityHeadersMiddleware)

# Request logging middleware
from app.middleware.logging import RequestLoggingMiddleware
app.add_middleware(RequestLoggingMiddleware)

# Metrics middleware
from app.middleware.metrics import MetricsMiddleware
app.add_middleware(MetricsMiddleware)

# Store settings in app state
app.state.settings = settings

# Include API router
app.include_router(api_router, prefix=settings.api_v1_prefix)

# Include WebSocket router
from app.api.websocket.context import router as ws_router
app.include_router(ws_router, prefix=settings.api_v1_prefix, tags=["websocket"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return await handle_errors(request, exc)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )

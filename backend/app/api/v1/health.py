"""Health check routes."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.config import settings
from app.database import get_db, get_redis
from app.utils.logger import logger

router = APIRouter(tags=["Health"])


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "success",
        "data": {
            "app_name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment
        }
    }


@router.get("/health/detailed")
async def detailed_health_check(
    db: AsyncSession = Depends(get_db),
):
    """Detailed health check with dependency status."""
    health_status = {
        "status": "healthy",
        "checks": {
            "api": "healthy",
            "database": "unknown",
            "redis": "unknown",
            "vector_store": "unknown"
        }
    }

    # Check database
    try:
        await db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        health_status["checks"]["database"] = "unhealthy"
        health_status["status"] = "degraded"

    # Check Redis
    try:
        redis = await get_redis()
        await redis.ping()
        health_status["checks"]["redis"] = "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
        health_status["checks"]["redis"] = "unhealthy"
        health_status["status"] = "degraded"

    # Check vector store (ChromaDB)
    try:
        import os
        if os.path.exists(settings.chroma_persist_directory):
            health_status["checks"]["vector_store"] = "healthy"
        else:
            health_status["checks"]["vector_store"] = "not_initialized"
    except Exception as e:
        logger.error(f"Vector store health check failed: {str(e)}")
        health_status["checks"]["vector_store"] = "unhealthy"

    return health_status


@router.get("/health/ready")
async def readiness_check(
    db: AsyncSession = Depends(get_db),
):
    """Kubernetes readiness probe."""
    try:
        await db.execute(text("SELECT 1"))
        redis = await get_redis()
        await redis.ping()
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return {"status": "not_ready", "error": str(e)}


@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe."""
    return {"status": "alive"}

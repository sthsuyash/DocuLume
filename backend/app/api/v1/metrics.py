"""Metrics endpoints for monitoring."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.utils.metrics import metrics_collector
from app.utils.logger import logger
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from app.utils.prometheus import update_system_metrics

router = APIRouter(tags=["Metrics"])


@router.get("/metrics")
async def get_prometheus_metrics():
    """Get Prometheus metrics in exposition format."""
    # Update system metrics before export
    update_system_metrics()

    # Generate Prometheus metrics
    metrics_data = generate_latest()
    return Response(content=metrics_data, media_type=CONTENT_TYPE_LATEST)


@router.get("/metrics/json")
async def get_metrics_json():
    """Get application metrics in JSON format."""
    metrics = metrics_collector.get_all_metrics()
    return metrics


@router.get("/metrics/system")
async def get_system_metrics():
    """Get system metrics."""
    return metrics_collector.get_system_metrics()


@router.get("/metrics/process")
async def get_process_metrics():
    """Get process metrics."""
    return metrics_collector.get_process_metrics()


@router.get("/metrics/database")
async def get_database_metrics(db: AsyncSession = Depends(get_db)):
    """Get database metrics."""
    try:
        # Get database size
        result = await db.execute(text("""
            SELECT
                pg_size_pretty(pg_database_size(current_database())) as db_size,
                (SELECT count(*) FROM pg_stat_activity) as connections,
                (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
        """))
        row = result.fetchone()

        # Get table sizes
        tables_result = await db.execute(text("""
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
            FROM pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 10
        """))
        tables = [
            {"schema": r[0], "table": r[1], "size": r[2]}
            for r in tables_result.fetchall()
        ]

        return {
            "database_size": row[0],
            "total_connections": row[1],
            "active_connections": row[2],
            "top_tables": tables,
        }
    except Exception as e:
        logger.error(f"Failed to get database metrics: {str(e)}")
        return {
            "error": "Failed to retrieve database metrics",
            "details": str(e)
        }

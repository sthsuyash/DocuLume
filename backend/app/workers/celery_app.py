"""Celery application configuration."""

from celery import Celery
from app.config import settings

celery_app = Celery(
    "chat_pdf",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"]
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    beat_schedule={
        "cleanup-old-documents-daily": {
            "task": "cleanup_old_documents",
            "schedule": 86400,  # once per day
        },
        "expire-documents-hourly": {
            "task": "expire_documents",
            "schedule": 3600,  # once per hour
        },
    },
)

"""Sentry error tracking integration."""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from app.config import settings


def init_sentry():
    """Initialize Sentry error tracking."""
    if settings.environment == "production":
        sentry_dsn = getattr(settings, "sentry_dsn", None)

        if sentry_dsn:
            sentry_sdk.init(
                dsn=sentry_dsn,
                environment=settings.environment,
                integrations=[
                    FastApiIntegration(),
                    SqlalchemyIntegration(),
                ],
                traces_sample_rate=0.1,  # 10% of transactions
                profiles_sample_rate=0.1,  # 10% of profiling
                enable_tracing=True,
            )

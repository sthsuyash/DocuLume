"""API v1 routes."""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.documents import router as documents_router
from app.api.v1.chat import router as chat_router
from app.api.v1.health import router as health_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.admin import router as admin_v1_router
from app.api.v1.help import router as help_router
from app.api.v1.settings import router as settings_router
from app.api.v1.collections import router as collections_router
from app.api.v1.share import router as share_router
from app.api.v1.api_tokens import router as api_tokens_router
from app.api.v1.templates import router as templates_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.two_factor import router as two_factor_router
from app.api.v1.collection_shares import router as collection_shares_router
from app.api.v1.audit import router as audit_router
from app.admin import admin_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(metrics_router)
api_router.include_router(auth_router)
api_router.include_router(two_factor_router)
api_router.include_router(users_router)
api_router.include_router(documents_router)
api_router.include_router(chat_router)
api_router.include_router(templates_router)
api_router.include_router(collections_router)
api_router.include_router(collection_shares_router)
api_router.include_router(share_router)
api_router.include_router(api_tokens_router)
api_router.include_router(notifications_router)
api_router.include_router(sessions_router)
api_router.include_router(audit_router)
api_router.include_router(admin_router)
api_router.include_router(admin_v1_router)
api_router.include_router(help_router)
api_router.include_router(settings_router)

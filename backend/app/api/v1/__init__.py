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
from app.admin import admin_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(metrics_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(documents_router)
api_router.include_router(chat_router)
api_router.include_router(admin_router)
api_router.include_router(admin_v1_router)  # New admin management routes
api_router.include_router(help_router)  # DocuBot help chatbot
api_router.include_router(settings_router)  # User settings (LLM config, etc.)

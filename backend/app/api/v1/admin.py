"""Admin routes — aggregates user, document, and analytics sub-routers."""

from fastapi import APIRouter

from app.api.v1.admin_users import router as users_router
from app.api.v1.admin_documents import router as documents_router
from app.api.v1.admin_analytics import router as analytics_router

router = APIRouter()
router.include_router(users_router)
router.include_router(documents_router)
router.include_router(analytics_router)

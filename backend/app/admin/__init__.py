"""Admin panel routes."""
from fastapi import APIRouter

admin_router = APIRouter(prefix="/admin", tags=["admin"])

from . import users, documents, analytics, feature_flags

# Register all sub-routers
admin_router.include_router(users.router)
admin_router.include_router(documents.router)
admin_router.include_router(analytics.router)
admin_router.include_router(feature_flags.router)

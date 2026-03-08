"""Admin feature flags management."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.utils.feature_flags import feature_flags, FeatureFlag

router = APIRouter()


class FeatureFlagUpdate(BaseModel):
    enabled: bool
    rollout: int = 100


@router.get("/feature-flags")
async def get_feature_flags(current_user: User = Depends(get_current_user)):
    """Get all feature flags (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    return feature_flags.get_all_flags()


@router.put("/feature-flags/{flag_name}")
async def update_feature_flag(
    flag_name: str,
    update: FeatureFlagUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a feature flag (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    try:
        flag = FeatureFlag(flag_name)
    except ValueError:
        raise HTTPException(404, f"Feature flag '{flag_name}' not found")

    feature_flags.set_flag(flag, update.enabled, update.rollout)

    return {
        "flag": flag_name,
        "enabled": update.enabled,
        "rollout": update.rollout
    }


@router.get("/feature-flags/user/{user_id}")
async def get_user_flags(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get enabled flags for a specific user (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    return {
        "user_id": user_id,
        "enabled_flags": feature_flags.get_enabled_flags(user_id)
    }

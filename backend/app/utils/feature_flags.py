"""Feature flags system for gradual rollout and A/B testing."""
from typing import Dict, Any, Optional
from enum import Enum
import random


class FeatureFlag(str, Enum):
    """Available feature flags."""
    NEW_UI = "new_ui"
    STREAMING_RESPONSES = "streaming_responses"
    ADVANCED_RAG = "advanced_rag"
    MULTI_LLM = "multi_llm"
    VOICE_INPUT = "voice_input"
    COLLABORATIVE_CHAT = "collaborative_chat"


class FeatureFlagManager:
    """Manage feature flags with percentage rollout."""

    def __init__(self):
        self._flags: Dict[str, Dict[str, Any]] = {
            FeatureFlag.NEW_UI: {"enabled": False, "rollout": 0},
            FeatureFlag.STREAMING_RESPONSES: {"enabled": True, "rollout": 100},
            FeatureFlag.ADVANCED_RAG: {"enabled": True, "rollout": 100},
            FeatureFlag.MULTI_LLM: {"enabled": True, "rollout": 100},
            FeatureFlag.VOICE_INPUT: {"enabled": False, "rollout": 0},
            FeatureFlag.COLLABORATIVE_CHAT: {"enabled": False, "rollout": 10},
        }

    def is_enabled(self, flag: FeatureFlag, user_id: Optional[int] = None) -> bool:
        """Check if a feature flag is enabled for a user."""
        if flag not in self._flags:
            return False

        config = self._flags[flag]

        # If globally disabled, return False
        if not config["enabled"]:
            return False

        # If 100% rollout, return True
        if config["rollout"] >= 100:
            return True

        # If 0% rollout, return False
        if config["rollout"] <= 0:
            return False

        # Percentage-based rollout using user_id for consistency
        if user_id is not None:
            # Use modulo to ensure same user gets same result
            return (user_id % 100) < config["rollout"]

        # Random rollout if no user_id
        return random.randint(0, 99) < config["rollout"]

    def set_flag(self, flag: FeatureFlag, enabled: bool, rollout: int = 100):
        """Set a feature flag (admin only)."""
        self._flags[flag] = {
            "enabled": enabled,
            "rollout": max(0, min(100, rollout))  # Clamp between 0-100
        }

    def get_all_flags(self) -> Dict[str, Dict[str, Any]]:
        """Get all feature flags configuration."""
        return self._flags.copy()

    def get_enabled_flags(self, user_id: Optional[int] = None) -> list:
        """Get list of enabled flags for a user."""
        return [
            flag for flag in FeatureFlag
            if self.is_enabled(flag, user_id)
        ]


# Global instance
feature_flags = FeatureFlagManager()


# Helper decorator
def requires_feature(flag: FeatureFlag):
    """Decorator to require a feature flag."""
    def decorator(func):
        from functools import wraps
        from fastapi import HTTPException

        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Try to get user_id from kwargs
            user_id = kwargs.get('user_id')
            if hasattr(kwargs.get('current_user'), 'id'):
                user_id = kwargs['current_user'].id

            if not feature_flags.is_enabled(flag, user_id):
                raise HTTPException(
                    status_code=403,
                    detail=f"Feature '{flag}' is not enabled"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator

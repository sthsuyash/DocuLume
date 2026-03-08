"""
Settings API endpoints for user configuration.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, validator

from app.database import get_db
from app.models.user import User
from app.services.llm_router import LLMRouter
from app.utils.encryption import FieldEncryption
from app.middleware.auth import get_current_user


router = APIRouter(prefix="/settings", tags=["settings"])


# ==================== Schemas ====================

class LLMProviderConfig(BaseModel):
    """LLM provider configuration schema."""

    type: str = Field(..., description="Provider type (openai, anthropic, google, ollama, lmstudio, vllm, custom)")
    base_url: Optional[str] = Field(None, description="Base URL for custom/local providers")
    api_key: Optional[str] = Field(None, description="API key (will be encrypted)")
    model: str = Field(..., description="Model identifier")
    timeout: int = Field(60, ge=10, le=300, description="Request timeout in seconds")
    max_retries: int = Field(2, ge=0, le=5, description="Number of retry attempts")

    @validator('base_url')
    def validate_base_url(cls, v, values):
        """Validate base_url is provided for custom providers."""
        provider_type = values.get('type')
        if provider_type in ['ollama', 'lmstudio', 'vllm', 'custom'] and not v:
            raise ValueError(f"base_url is required for {provider_type} provider")
        return v

    @validator('api_key')
    def validate_api_key(cls, v, values):
        """Validate api_key is provided for cloud providers."""
        provider_type = values.get('type')
        if provider_type in ['openai', 'anthropic', 'google'] and not v:
            raise ValueError(f"api_key is required for {provider_type} provider")
        return v


class AddProviderRequest(BaseModel):
    """Request to add/update LLM provider."""

    provider_name: str = Field(..., min_length=1, max_length=50, description="Unique provider name")
    config: LLMProviderConfig


class UpdateDefaultProviderRequest(BaseModel):
    """Request to update default provider."""

    default_provider: str = Field(..., description="Provider name to set as default")


class UpdateFallbackOrderRequest(BaseModel):
    """Request to update fallback provider order."""

    fallback_order: list[str] = Field(..., description="Ordered list of provider names for fallback")


class LLMConfigResponse(BaseModel):
    """User LLM configuration response."""

    default_provider: Optional[str] = None
    providers: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    fallback_order: list[str] = Field(default_factory=list)
    cost_limits: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class TestConnectionRequest(BaseModel):
    """Request to test provider connection."""

    provider_name: str
    config: LLMProviderConfig


# ==================== Endpoints ====================

@router.get("/llm", response_model=LLMConfigResponse)
async def get_llm_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's LLM configuration.

    Returns all configured providers (with API keys hidden), default provider,
    and fallback order.
    """
    llm_config = current_user.llm_config or {}

    # Hide API keys in response
    providers = llm_config.get("providers", {})
    safe_providers = {}

    for name, config in providers.items():
        safe_config = config.copy()
        if "api_key" in safe_config:
            # Show only first/last 4 chars of API key
            safe_config["api_key"] = "sk-...****"
        safe_providers[name] = safe_config

    return LLMConfigResponse(
        default_provider=llm_config.get("default_provider"),
        providers=safe_providers,
        fallback_order=llm_config.get("fallback_order", []),
        cost_limits=llm_config.get("cost_limits", {})
    )


@router.post("/llm/provider", status_code=status.HTTP_201_CREATED)
async def add_llm_provider(
    request: AddProviderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add or update LLM provider configuration.

    If provider_name already exists, it will be updated.
    API keys are automatically encrypted before storage.
    """
    llm_config = current_user.llm_config or {}

    # Initialize providers dict if not exists
    if "providers" not in llm_config:
        llm_config["providers"] = {}

    # Prepare config
    config_dict = request.config.model_dump()

    # Encrypt API key if present
    if config_dict.get("api_key"):
        config_dict["api_key"] = FieldEncryption.encrypt(config_dict["api_key"])

    # Store provider config
    llm_config["providers"][request.provider_name] = config_dict

    # Set as default if no default exists
    if not llm_config.get("default_provider"):
        llm_config["default_provider"] = request.provider_name

    # Update user
    current_user.llm_config = llm_config
    await db.commit()

    return {
        "message": f"Provider '{request.provider_name}' added successfully",
        "provider_name": request.provider_name
    }


@router.delete("/llm/provider/{provider_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_llm_provider(
    provider_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete LLM provider configuration.

    Cannot delete the default provider (must set a new default first).
    """
    llm_config = current_user.llm_config or {}
    providers = llm_config.get("providers", {})

    if provider_name not in providers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_name}' not found"
        )

    # Prevent deleting default provider
    if llm_config.get("default_provider") == provider_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default provider. Set a new default first."
        )

    # Delete provider
    del providers[provider_name]
    llm_config["providers"] = providers

    # Remove from fallback order if present
    fallback_order = llm_config.get("fallback_order", [])
    if provider_name in fallback_order:
        fallback_order.remove(provider_name)
        llm_config["fallback_order"] = fallback_order

    # Update user
    current_user.llm_config = llm_config
    await db.commit()


@router.patch("/llm/default")
async def update_default_provider(
    request: UpdateDefaultProviderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update default LLM provider.

    The specified provider must already be configured.
    """
    llm_config = current_user.llm_config or {}
    providers = llm_config.get("providers", {})

    if request.default_provider not in providers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{request.default_provider}' not configured"
        )

    llm_config["default_provider"] = request.default_provider

    # Update user
    current_user.llm_config = llm_config
    await db.commit()

    return {
        "message": f"Default provider updated to '{request.default_provider}'",
        "default_provider": request.default_provider
    }


@router.patch("/llm/fallback")
async def update_fallback_order(
    request: UpdateFallbackOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update fallback provider order.

    All providers in the list must be configured.
    """
    llm_config = current_user.llm_config or {}
    providers = llm_config.get("providers", {})

    # Validate all providers exist
    for provider_name in request.fallback_order:
        if provider_name not in providers:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider '{provider_name}' not configured"
            )

    llm_config["fallback_order"] = request.fallback_order

    # Update user
    current_user.llm_config = llm_config
    await db.commit()

    return {
        "message": "Fallback order updated successfully",
        "fallback_order": request.fallback_order
    }


@router.post("/llm/test")
async def test_llm_connection(
    request: TestConnectionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Test connection to LLM provider without saving configuration.

    Useful for validating API keys and endpoints before adding a provider.
    """
    config_dict = request.config.model_dump()

    # Don't encrypt API key for testing
    result = await LLMRouter.test_provider(request.provider_name, config_dict)

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection test failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.get("/llm/defaults")
async def get_default_configs():
    """
    Get default configurations for common LLM providers.

    Returns preset configurations for:
    - Ollama
    - LM Studio
    - OpenAI
    - Anthropic
    - Google

    Users can use these as templates when adding providers.
    """
    return LLMRouter.get_default_configs()

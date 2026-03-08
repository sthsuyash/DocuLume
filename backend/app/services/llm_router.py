"""
LLM Router Service - Routes requests to appropriate LLM provider based on user configuration.
"""

from typing import Dict, Any, List, Optional

from app.models.user import User
from app.core.llm.provider import LLMProvider
from app.core.llm.universal_provider import UniversalLLMProvider
from app.utils.encryption import FieldEncryption


class LLMRouter:
    """
    Routes LLM requests to the appropriate provider based on user configuration.

    Supports:
    - User-configured providers (OpenAI, Anthropic, Google, Ollama, custom)
    - Fallback to alternative providers on failure
    - Cost tracking per provider
    - Connection health checking
    """

    @staticmethod
    def _get_provider_from_config(
        provider_name: str,
        config: Dict[str, Any]
    ) -> LLMProvider:
        """
        Create LLM provider instance from configuration.

        Args:
            provider_name: Name of provider (e.g., "openai", "ollama", "custom")
            config: Provider configuration dict

        Returns:
            Initialized LLM provider instance

        Raises:
            ValueError: If provider type is unsupported
        """
        provider_type = config.get("type", provider_name.lower())

        if provider_type == "openai":
            return OpenAIProvider(
                api_key=config["api_key"],
                model=config.get("model", "gpt-3.5-turbo")
            )

        elif provider_type == "anthropic":
            return AnthropicProvider(
                api_key=config["api_key"],
                model=config.get("model", "claude-3-haiku-20240307")
            )

        elif provider_type == "google":
            return GoogleProvider(
                api_key=config["api_key"],
                model=config.get("model", "gemini-pro")
            )

        elif provider_type in ["ollama", "lmstudio", "vllm", "custom"]:
            return UniversalLLMProvider(
                base_url=config["base_url"],
                api_key=config.get("api_key", "not-needed"),
                model=config.get("model", "default"),
                provider_type=provider_type,
                timeout=config.get("timeout", 60),
                max_retries=config.get("max_retries", 2)
            )

        else:
            raise ValueError(f"Unsupported provider type: {provider_type}")

    @staticmethod
    async def get_provider_for_user(
        user: User,
        preferred_provider: Optional[str] = None
    ) -> LLMProvider:
        """
        Get LLM provider for user based on their configuration.

        Args:
            user: User model instance
            preferred_provider: Optional specific provider to use (overrides default)

        Returns:
            Initialized LLM provider instance

        Raises:
            ValueError: If no valid provider configuration found
        """
        llm_config = user.llm_config or {}

        # Determine which provider to use
        provider_name = preferred_provider or llm_config.get("default_provider")

        if not provider_name:
            raise ValueError("No LLM provider configured for user")

        # Get provider configuration
        providers = llm_config.get("providers", {})

        if provider_name not in providers:
            raise ValueError(f"Provider '{provider_name}' not configured")

        config = providers[provider_name]

        # Decrypt API key if present
        if "api_key" in config:
            config["api_key"] = FieldEncryption.decrypt(config["api_key"])

        # Create and return provider instance
        return LLMRouter._get_provider_from_config(provider_name, config)

    @staticmethod
    async def chat_with_fallback(
        user: User,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Send chat request with automatic fallback to alternative providers.

        Args:
            user: User model instance
            messages: Chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            Dict with 'response' text, 'provider_used', and 'fallback_used' bool

        Raises:
            Exception: If all configured providers fail
        """
        llm_config = user.llm_config or {}
        fallback_order = llm_config.get("fallback_order", [])

        # Start with default provider
        default_provider = llm_config.get("default_provider")
        providers_to_try = [default_provider] + [
            p for p in fallback_order if p != default_provider
        ]

        last_error = None

        for provider_name in providers_to_try:
            try:
                provider = await LLMRouter.get_provider_for_user(user, provider_name)

                response = await provider.chat(
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )

                return {
                    "response": response,
                    "provider_used": provider_name,
                    "fallback_used": provider_name != default_provider
                }

            except Exception as e:
                last_error = e
                # Continue to next provider in fallback chain
                continue

        # All providers failed
        raise Exception(f"All LLM providers failed. Last error: {str(last_error)}")

    @staticmethod
    async def test_provider(
        provider_name: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Test connection to a provider without saving configuration.

        Args:
            provider_name: Provider identifier
            config: Provider configuration

        Returns:
            Dict with test results (success, error, etc.)
        """
        try:
            # Decrypt API key if it's encrypted
            if "api_key" in config and isinstance(config["api_key"], bytes):
                config["api_key"] = FieldEncryption.decrypt(config["api_key"])

            provider = LLMRouter._get_provider_from_config(provider_name, config)

            # Test connection if provider supports it
            if hasattr(provider, "test_connection"):
                return await provider.test_connection()
            else:
                # Fallback: try a simple chat
                await provider.chat(
                    messages=[{"role": "user", "content": "Hello"}],
                    max_tokens=10
                )
                return {
                    "success": True,
                    "provider_name": provider_name,
                    "message": "Connection successful"
                }

        except Exception as e:
            return {
                "success": False,
                "provider_name": provider_name,
                "error": str(e)
            }

    @staticmethod
    def get_default_configs() -> Dict[str, Dict[str, Any]]:
        """
        Get default configurations for common providers.

        Returns:
            Dict mapping provider names to default configs
        """
        return {
            "ollama": {
                "type": "ollama",
                "base_url": "http://localhost:11434/v1",
                "model": "llama2",
                "api_key": "not-needed"
            },
            "lmstudio": {
                "type": "lmstudio",
                "base_url": "http://localhost:1234/v1",
                "model": "local-model",
                "api_key": "not-needed"
            },
            "openai": {
                "type": "openai",
                "model": "gpt-3.5-turbo",
                "api_key": ""  # User must provide
            },
            "anthropic": {
                "type": "anthropic",
                "model": "claude-3-haiku-20240307",
                "api_key": ""  # User must provide
            },
            "google": {
                "type": "google",
                "model": "gemini-pro",
                "api_key": ""  # User must provide
            }
        }

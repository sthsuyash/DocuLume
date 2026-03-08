"""
Universal LLM Provider for any OpenAI-compatible API.

This provider enables integration with:
- Ollama (local)
- LM Studio (local)
- vLLM (self-hosted)
- Any custom OpenAI-compatible endpoint
"""

from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI

from app.core.llm.provider import LLMProvider


class UniversalLLMProvider(LLMProvider):
    """
    Generic provider that works with any OpenAI-compatible API.

    Compatible with:
    - Ollama: http://localhost:11434/v1
    - LM Studio: http://localhost:1234/v1
    - vLLM: http://your-server:8000/v1
    - Any custom endpoint following OpenAI's API spec
    """

    def __init__(
        self,
        base_url: str,
        api_key: str = "not-needed",
        model: str = "default",
        provider_type: str = "custom",
        timeout: int = 60,
        max_retries: int = 2
    ):
        """
        Initialize universal LLM provider.

        Args:
            base_url: OpenAI-compatible API endpoint (e.g., http://localhost:11434/v1)
            api_key: API key (use "not-needed" for local providers)
            model: Model identifier (e.g., "llama2", "mistral", "local-model")
            provider_type: Type identifier for logging (e.g., "ollama", "lmstudio", "custom")
            timeout: Request timeout in seconds
            max_retries: Number of retry attempts on failure
        """
        self.base_url = base_url
        self.api_key = api_key
        self.model = model
        self.provider_type = provider_type

        # Initialize OpenAI client with custom base URL
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
            timeout=timeout,
            max_retries=max_retries
        )

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """
        Send chat completion request.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate (None = provider default)
            stream: Whether to stream response (not yet implemented)

        Returns:
            Generated response text

        Raises:
            Exception: If API request fails
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False  # Streaming support can be added later
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"{self.provider_type.upper()} API error: {str(e)}")

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to the LLM provider.

        Returns:
            Dict with 'success' bool and optional 'error' message
        """
        try:
            # Try a simple chat completion
            response = await self.chat(
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )

            return {
                "success": True,
                "provider_type": self.provider_type,
                "model": self.model,
                "base_url": self.base_url
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "provider_type": self.provider_type,
                "base_url": self.base_url
            }

    @property
    def name(self) -> str:
        """Provider name for identification."""
        return f"{self.provider_type}:{self.model}"

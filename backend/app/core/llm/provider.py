"""LLM provider abstraction."""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, AsyncGenerator
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from google import genai
from app.config import settings


class LLMProvider(ABC):
    """Base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt."""
        pass

    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate chat completion."""
        pass

    @abstractmethod
    async def stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream text generation from prompt."""
        pass

    @abstractmethod
    async def chat_stream(
        self, messages: List[Dict[str, str]], **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion."""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo"):
        self.api_key = api_key or settings.openai_api_key
        self.model = model
        self.client = AsyncOpenAI(api_key=self.api_key)

    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt."""
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages, **kwargs)

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate chat completion."""
        response = await self.client.chat.completions.create(
            model=self.model, messages=messages, **kwargs
        )
        return response.choices[0].message.content

    async def stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream text generation from prompt."""
        messages = [{"role": "user", "content": prompt}]
        async for chunk in self.chat_stream(messages, **kwargs):
            yield chunk

    async def chat_stream(
        self, messages: List[Dict[str, str]], **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion."""
        stream = await self.client.chat.completions.create(
            model=self.model, messages=messages, stream=True, **kwargs
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class AnthropicProvider(LLMProvider):
    """Anthropic (Claude) LLM provider."""

    def __init__(
        self, api_key: Optional[str] = None, model: str = "claude-3-sonnet-20240229"
    ):
        self.api_key = api_key or settings.anthropic_api_key
        self.model = model
        self.client = AsyncAnthropic(api_key=self.api_key)

    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt."""
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages, **kwargs)

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate chat completion."""
        # Anthropic requires max_tokens to be set
        if "max_tokens" not in kwargs:
            kwargs["max_tokens"] = 4096

        response = await self.client.messages.create(
            model=self.model, messages=messages, **kwargs
        )
        return response.content[0].text

    async def stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream text generation from prompt."""
        messages = [{"role": "user", "content": prompt}]
        async for chunk in self.chat_stream(messages, **kwargs):
            yield chunk

    async def chat_stream(
        self, messages: List[Dict[str, str]], **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion."""
        # Anthropic requires max_tokens to be set
        if "max_tokens" not in kwargs:
            kwargs["max_tokens"] = 4096

        async with self.client.messages.stream(
            model=self.model, messages=messages, **kwargs
        ) as stream:
            async for text in stream.text_stream:
                yield text


class GoogleAIProvider(LLMProvider):
    """Google AI (Gemini) LLM provider."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.0-flash"):
        self.api_key = api_key or settings.google_api_key
        self.model = model
        self.client = genai.Client(api_key=self.api_key)

    @staticmethod
    def _messages_to_prompt(messages: List[Dict[str, str]]) -> str:
        """Convert chat messages into a single prompt for Gemini."""
        rendered = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            rendered.append(f"{role}: {content}")

        rendered.append("assistant:")
        return "\n\n".join(rendered)

    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt."""
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=prompt,
            **kwargs,
        )
        return response.text or ""

    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate chat completion."""
        prompt = self._messages_to_prompt(messages)
        return await self.generate(prompt, **kwargs)

    async def stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Stream text generation from prompt."""
        response = await self.client.aio.models.generate_content_stream(
            model=self.model,
            contents=prompt,
            **kwargs,
        )

        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def chat_stream(
        self, messages: List[Dict[str, str]], **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion."""
        prompt = self._messages_to_prompt(messages)
        async for chunk in self.stream(prompt, **kwargs):
            yield chunk


def get_llm_provider(
    provider: str = "openai", model: Optional[str] = None, api_key: Optional[str] = None
) -> LLMProvider:
    """Get LLM provider instance."""
    if provider == "openai":
        model = model or settings.default_llm_model
        return OpenAIProvider(api_key=api_key, model=model)
    elif provider == "anthropic":
        model = model or "claude-3-sonnet-20240229"
        return AnthropicProvider(api_key=api_key, model=model)
    elif provider == "google":
        model = model or "gemini-2.0-flash"
        return GoogleAIProvider(api_key=api_key, model=model)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

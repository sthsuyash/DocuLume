"""
Token counting utilities for different LLM providers.
Handles accurate token counting for OpenAI, Anthropic, and Google models.
"""

from typing import List, Dict, Any, Optional
import tiktoken
from app.core.context.model_configs import LLMProvider, get_model_config


class TokenCounter:
    """Unified token counter for multiple LLM providers."""

    def __init__(self, model_name: str, provider: Optional[LLMProvider] = None):
        """
        Initialize token counter for a specific model.

        Args:
            model_name: Name of the LLM model
            provider: Optional provider hint
        """
        self.model_name = model_name
        self.config = get_model_config(model_name, provider)
        self.provider = self.config.provider

        # Initialize provider-specific encoder
        if self.provider == LLMProvider.OPENAI:
            self._init_openai_encoder()
        elif self.provider == LLMProvider.ANTHROPIC:
            self._init_anthropic_encoder()
        elif self.provider == LLMProvider.GOOGLE:
            self._init_google_encoder()

    def _init_openai_encoder(self):
        """Initialize OpenAI tiktoken encoder."""
        try:
            # Try to get encoding for specific model
            self.encoder = tiktoken.encoding_for_model(self.model_name)
        except KeyError:
            # Fallback to cl100k_base (used by gpt-4, gpt-3.5-turbo)
            self.encoder = tiktoken.get_encoding("cl100k_base")

    def _init_anthropic_encoder(self):
        """Initialize Anthropic tokenizer."""
        try:
            from anthropic import Anthropic
            self.anthropic_client = Anthropic()
        except ImportError:
            # Fallback: Use approximate counting (1 token ≈ 4 chars for English)
            self.anthropic_client = None

    def _init_google_encoder(self):
        """Initialize Google tokenizer."""
        # Google uses similar tokenization to OpenAI for estimation
        # Fallback to approximate counting
        self.encoder = None

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in a text string.

        Args:
            text: Text to count tokens for

        Returns:
            Number of tokens
        """
        if not text:
            return 0

        if self.provider == LLMProvider.OPENAI:
            return len(self.encoder.encode(text))

        elif self.provider == LLMProvider.ANTHROPIC:
            if self.anthropic_client:
                # Use Anthropic's official counting
                try:
                    return self.anthropic_client.count_tokens(text)
                except:
                    pass
            # Fallback: approximate counting
            return self._approximate_token_count(text)

        elif self.provider == LLMProvider.GOOGLE:
            # Approximate counting for Google
            return self._approximate_token_count(text)

        return self._approximate_token_count(text)

    def count_messages_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Count tokens for a list of chat messages.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Returns:
            Total number of tokens including formatting overhead
        """
        if not messages:
            return 0

        total_tokens = 0

        if self.provider == LLMProvider.OPENAI:
            # OpenAI message formatting overhead
            # Every message follows <|start|>{role/name}\n{content}<|end|>\n
            tokens_per_message = 3
            tokens_per_name = 1

            for message in messages:
                total_tokens += tokens_per_message
                total_tokens += self.count_tokens(message.get("role", ""))
                total_tokens += self.count_tokens(message.get("content", ""))
                if "name" in message:
                    total_tokens += tokens_per_name
                    total_tokens += self.count_tokens(message["name"])

            total_tokens += 3  # Every reply is primed with <|start|>assistant<|message|>

        elif self.provider == LLMProvider.ANTHROPIC:
            # Anthropic message formatting
            for message in messages:
                role = message.get("role", "")
                content = message.get("content", "")
                # Format: "\n\nHuman: {content}" or "\n\nAssistant: {content}"
                formatted = f"\n\n{role.capitalize()}: {content}"
                total_tokens += self.count_tokens(formatted)

        elif self.provider == LLMProvider.GOOGLE:
            # Google Gemini formatting
            for message in messages:
                role = message.get("role", "")
                content = message.get("content", "")
                formatted = f"**{role}**: {content}\n"
                total_tokens += self.count_tokens(formatted)

        return total_tokens

    def _approximate_token_count(self, text: str) -> int:
        """
        Approximate token count using character-based estimation.
        Rule of thumb: 1 token ≈ 4 characters for English text.

        Args:
            text: Text to estimate

        Returns:
            Approximate token count
        """
        return len(text) // 4

    def estimate_max_response_tokens(self, context_tokens: int) -> int:
        """
        Estimate maximum tokens available for response.

        Args:
            context_tokens: Tokens used by context (messages + system prompt)

        Returns:
            Maximum tokens available for model response
        """
        max_output = min(
            self.config.max_output_tokens,
            self.config.context_window - context_tokens
        )
        return max(0, max_output)


def count_tokens_for_model(text: str, model_name: str, provider: Optional[LLMProvider] = None) -> int:
    """
    Convenience function to count tokens for a model.

    Args:
        text: Text to count tokens for
        model_name: Name of the model
        provider: Optional provider hint

    Returns:
        Number of tokens
    """
    counter = TokenCounter(model_name, provider)
    return counter.count_tokens(text)


def count_messages_tokens_for_model(
    messages: List[Dict[str, str]],
    model_name: str,
    provider: Optional[LLMProvider] = None
) -> int:
    """
    Convenience function to count tokens for messages.

    Args:
        messages: List of message dicts
        model_name: Name of the model
        provider: Optional provider hint

    Returns:
        Total number of tokens
    """
    counter = TokenCounter(model_name, provider)
    return counter.count_messages_tokens(messages)

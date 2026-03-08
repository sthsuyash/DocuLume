"""
Model-specific configurations for context window limits and token counting.
Supports multiple LLM providers with their specific context limits.
"""

from dataclasses import dataclass
from typing import Dict, Optional
from enum import Enum


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"


@dataclass
class ModelConfig:
    """Configuration for a specific LLM model."""
    name: str
    provider: LLMProvider
    context_window: int  # Maximum tokens
    max_output_tokens: int  # Maximum tokens for response
    supports_streaming: bool = True
    cost_per_1k_input: float = 0.0
    cost_per_1k_output: float = 0.0


# Model configurations database
MODEL_CONFIGS: Dict[str, ModelConfig] = {
    # OpenAI Models
    "gpt-4-turbo-preview": ModelConfig(
        name="gpt-4-turbo-preview",
        provider=LLMProvider.OPENAI,
        context_window=128000,
        max_output_tokens=4096,
        cost_per_1k_input=0.01,
        cost_per_1k_output=0.03,
    ),
    "gpt-4": ModelConfig(
        name="gpt-4",
        provider=LLMProvider.OPENAI,
        context_window=8192,
        max_output_tokens=4096,
        cost_per_1k_input=0.03,
        cost_per_1k_output=0.06,
    ),
    "gpt-4-32k": ModelConfig(
        name="gpt-4-32k",
        provider=LLMProvider.OPENAI,
        context_window=32768,
        max_output_tokens=4096,
        cost_per_1k_input=0.06,
        cost_per_1k_output=0.12,
    ),
    "gpt-3.5-turbo": ModelConfig(
        name="gpt-3.5-turbo",
        provider=LLMProvider.OPENAI,
        context_window=16385,
        max_output_tokens=4096,
        cost_per_1k_input=0.0005,
        cost_per_1k_output=0.0015,
    ),
    "gpt-3.5-turbo-16k": ModelConfig(
        name="gpt-3.5-turbo-16k",
        provider=LLMProvider.OPENAI,
        context_window=16385,
        max_output_tokens=4096,
        cost_per_1k_input=0.001,
        cost_per_1k_output=0.002,
    ),

    # Anthropic Claude Models
    "claude-3-opus-20240229": ModelConfig(
        name="claude-3-opus-20240229",
        provider=LLMProvider.ANTHROPIC,
        context_window=200000,
        max_output_tokens=4096,
        cost_per_1k_input=0.015,
        cost_per_1k_output=0.075,
    ),
    "claude-3-sonnet-20240229": ModelConfig(
        name="claude-3-sonnet-20240229",
        provider=LLMProvider.ANTHROPIC,
        context_window=200000,
        max_output_tokens=4096,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
    ),
    "claude-3-haiku-20240307": ModelConfig(
        name="claude-3-haiku-20240307",
        provider=LLMProvider.ANTHROPIC,
        context_window=200000,
        max_output_tokens=4096,
        cost_per_1k_input=0.00025,
        cost_per_1k_output=0.00125,
    ),
    "claude-2.1": ModelConfig(
        name="claude-2.1",
        provider=LLMProvider.ANTHROPIC,
        context_window=200000,
        max_output_tokens=4096,
        cost_per_1k_input=0.008,
        cost_per_1k_output=0.024,
    ),

    # Google Gemini Models
    "gemini-pro": ModelConfig(
        name="gemini-pro",
        provider=LLMProvider.GOOGLE,
        context_window=32760,
        max_output_tokens=8192,
        cost_per_1k_input=0.00025,
        cost_per_1k_output=0.0005,
    ),
    "gemini-pro-vision": ModelConfig(
        name="gemini-pro-vision",
        provider=LLMProvider.GOOGLE,
        context_window=16384,
        max_output_tokens=2048,
        cost_per_1k_input=0.00025,
        cost_per_1k_output=0.0005,
    ),
}


def get_model_config(model_name: str, provider: Optional[LLMProvider] = None) -> ModelConfig:
    """
    Get configuration for a specific model.

    Args:
        model_name: Name of the model
        provider: Optional provider hint for disambiguation

    Returns:
        ModelConfig for the model

    Raises:
        ValueError: If model is not found
    """
    # Try exact match first
    if model_name in MODEL_CONFIGS:
        return MODEL_CONFIGS[model_name]

    # Try fuzzy match by provider
    if provider:
        for config in MODEL_CONFIGS.values():
            if config.provider == provider and model_name.lower() in config.name.lower():
                return config

    # Default fallback based on provider
    if provider == LLMProvider.OPENAI:
        return MODEL_CONFIGS["gpt-3.5-turbo"]
    elif provider == LLMProvider.ANTHROPIC:
        return MODEL_CONFIGS["claude-3-haiku-20240307"]
    elif provider == LLMProvider.GOOGLE:
        return MODEL_CONFIGS["gemini-pro"]

    raise ValueError(f"Unknown model: {model_name}")


def get_context_limit(model_name: str, provider: Optional[LLMProvider] = None) -> int:
    """Get context window limit for a model."""
    config = get_model_config(model_name, provider)
    return config.context_window


def get_max_output_tokens(model_name: str, provider: Optional[LLMProvider] = None) -> int:
    """Get maximum output tokens for a model."""
    config = get_model_config(model_name, provider)
    return config.max_output_tokens


def calculate_cost(
    model_name: str,
    input_tokens: int,
    output_tokens: int,
    provider: Optional[LLMProvider] = None
) -> float:
    """Calculate cost for a model interaction."""
    config = get_model_config(model_name, provider)
    input_cost = (input_tokens / 1000) * config.cost_per_1k_input
    output_cost = (output_tokens / 1000) * config.cost_per_1k_output
    return input_cost + output_cost

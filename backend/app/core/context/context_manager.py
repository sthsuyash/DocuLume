"""
Context manager for tracking conversation context usage and triggering summarization.
Provides real-time context monitoring and intelligent conversation compression.
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.core.context.token_counter import TokenCounter
from app.core.context.model_configs import get_model_config, LLMProvider


@dataclass
class ContextUsage:
    """Context usage statistics for a conversation."""
    total_tokens: int
    max_tokens: int
    percentage_used: float
    tokens_by_role: Dict[str, int]
    message_count: int
    needs_summarization: bool
    available_tokens: int
    max_response_tokens: int
    estimated_cost: float


class ContextManager:
    """
    Manages conversation context tracking and summarization.

    Features:
    - Real-time token counting
    - Automatic summarization triggers
    - Model-specific context limits
    - Cost estimation
    """

    # Summarization thresholds
    SUMMARIZATION_THRESHOLD = 0.75  # Trigger at 75% capacity
    CRITICAL_THRESHOLD = 0.90  # Critical warning at 90%

    def __init__(
        self,
        conversation: Conversation,
        system_prompt: Optional[str] = None
    ):
        """
        Initialize context manager for a conversation.

        Args:
            conversation: The conversation to manage
            system_prompt: Optional system prompt to include in token count
        """
        self.conversation = conversation
        self.system_prompt = system_prompt or ""

        # Initialize token counter for the conversation's model
        self.token_counter = TokenCounter(
            model_name=conversation.llm_model,
            provider=LLMProvider(conversation.llm_provider)
        )

        self.model_config = get_model_config(
            conversation.llm_model,
            LLMProvider(conversation.llm_provider)
        )

    async def calculate_context_usage(
        self,
        db: AsyncSession,
        include_system_prompt: bool = True
    ) -> ContextUsage:
        """
        Calculate current context usage for the conversation.

        Args:
            db: Database session
            include_system_prompt: Whether to include system prompt in count

        Returns:
            ContextUsage with detailed statistics
        """
        # Fetch all messages for the conversation
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == self.conversation.id)
            .order_by(Message.created_at)
        )
        messages = result.scalars().all()

        # Count tokens by role
        tokens_by_role = {
            "system": 0,
            "user": 0,
            "assistant": 0,
        }

        # Add system prompt if present
        if include_system_prompt and self.system_prompt:
            tokens_by_role["system"] = self.token_counter.count_tokens(self.system_prompt)

        # Convert messages to format for token counting
        message_dicts = []
        for msg in messages:
            msg_dict = {
                "role": msg.role.value,
                "content": msg.content
            }
            message_dicts.append(msg_dict)

            # Track tokens by role
            tokens = self.token_counter.count_tokens(msg.content)
            tokens_by_role[msg.role.value] += tokens

        # Count total tokens with message formatting overhead
        total_tokens = self.token_counter.count_messages_tokens(message_dicts)

        # Add system prompt tokens
        total_tokens += tokens_by_role["system"]

        # Calculate percentages and availability
        max_tokens = self.model_config.context_window
        percentage_used = (total_tokens / max_tokens) * 100 if max_tokens > 0 else 0
        available_tokens = max(0, max_tokens - total_tokens)

        # Calculate max response tokens
        max_response_tokens = self.token_counter.estimate_max_response_tokens(total_tokens)

        # Determine if summarization is needed
        needs_summarization = percentage_used >= (self.SUMMARIZATION_THRESHOLD * 100)

        # Estimate cost (input tokens only, output will be counted after response)
        estimated_cost = self.model_config.cost_per_1k_input * (total_tokens / 1000)

        return ContextUsage(
            total_tokens=total_tokens,
            max_tokens=max_tokens,
            percentage_used=percentage_used,
            tokens_by_role=tokens_by_role,
            message_count=len(messages),
            needs_summarization=needs_summarization,
            available_tokens=available_tokens,
            max_response_tokens=max_response_tokens,
            estimated_cost=estimated_cost
        )

    async def should_summarize(self, db: AsyncSession) -> bool:
        """
        Check if conversation should be summarized.

        Args:
            db: Database session

        Returns:
            True if summarization is needed
        """
        usage = await self.calculate_context_usage(db)
        return usage.needs_summarization

    async def get_messages_for_summarization(
        self,
        db: AsyncSession,
        keep_recent: int = 5
    ) -> Tuple[List[Message], List[Message]]:
        """
        Get messages to summarize and messages to keep.

        Strategy: Keep the most recent messages intact, summarize older ones.

        Args:
            db: Database session
            keep_recent: Number of recent messages to keep unsummarized

        Returns:
            Tuple of (messages_to_summarize, messages_to_keep)
        """
        # Fetch all messages
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == self.conversation.id)
            .order_by(Message.created_at)
        )
        all_messages = list(result.scalars().all())

        if len(all_messages) <= keep_recent:
            return [], all_messages

        # Split into summarization candidates and recent messages
        messages_to_summarize = all_messages[:-keep_recent]
        messages_to_keep = all_messages[-keep_recent:]

        return messages_to_summarize, messages_to_keep

    async def get_context_warning_level(self, db: AsyncSession) -> str:
        """
        Get warning level for context usage.

        Args:
            db: Database session

        Returns:
            Warning level: 'ok', 'warning', or 'critical'
        """
        usage = await self.calculate_context_usage(db)

        if usage.percentage_used >= (self.CRITICAL_THRESHOLD * 100):
            return "critical"
        elif usage.percentage_used >= (self.SUMMARIZATION_THRESHOLD * 100):
            return "warning"
        else:
            return "ok"

    def estimate_new_message_impact(self, message_content: str, role: str = "user") -> int:
        """
        Estimate token impact of adding a new message.

        Args:
            message_content: Content of the new message
            role: Message role (user, assistant, system)

        Returns:
            Estimated tokens for the new message
        """
        # Count message content tokens
        content_tokens = self.token_counter.count_tokens(message_content)

        # Add formatting overhead (role, delimiters, etc.)
        overhead = 3  # Approximate overhead per message

        return content_tokens + overhead


async def get_context_manager(
    conversation_id: int,
    db: AsyncSession,
    system_prompt: Optional[str] = None
) -> Optional[ContextManager]:
    """
    Get context manager for a conversation.

    Args:
        conversation_id: ID of the conversation
        db: Database session
        system_prompt: Optional system prompt

    Returns:
        ContextManager instance or None if conversation not found
    """
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        return None

    return ContextManager(conversation, system_prompt)

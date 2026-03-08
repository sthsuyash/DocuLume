"""
Conversation summarization service using LLM to compress context.
Implements intelligent summarization strategies to maintain conversation coherence.
"""

from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.core.llm.provider import LLMProvider
from app.core.context.context_manager import ContextManager
import logging

logger = logging.getLogger(__name__)


class ConversationSummarizer:
    """
    Handles intelligent conversation summarization.

    Strategies:
    1. Rolling Window: Keep recent messages, summarize older ones
    2. Topic-based: Identify and preserve important topics
    3. Progressive: Incrementally summarize as conversation grows
    """

    SUMMARY_PROMPT_TEMPLATE = """You are a conversation summarizer. Your task is to create a concise yet comprehensive summary of the conversation below.

Key Requirements:
1. Preserve all important information, decisions, and conclusions
2. Maintain chronological order of key events
3. Keep track of any specific data, numbers, or facts mentioned
4. Note any unresolved questions or pending tasks
5. Be concise but don't lose critical context

Format your summary as:
**Summary of Discussion:**
[Your summary here]

**Key Points:**
- [Point 1]
- [Point 2]
- ...

**Pending Items:**
- [Item 1 if any]
- [Item 2 if any]
- ...

Conversation to summarize:
{conversation_text}

Provide the summary now:"""

    def __init__(self, conversation: Conversation):
        """
        Initialize summarizer for a conversation.

        Args:
            conversation: The conversation to summarize
        """
        self.conversation = conversation
        self.llm_provider = LLMProvider(
            provider=conversation.llm_provider,
            model=conversation.llm_model
        )

    async def summarize_messages(
        self,
        messages: List[Message],
        db: AsyncSession
    ) -> str:
        """
        Summarize a list of messages using LLM.

        Args:
            messages: Messages to summarize
            db: Database session

        Returns:
            Summary text
        """
        if not messages:
            return ""

        # Format messages for summarization
        conversation_text = self._format_messages_for_summary(messages)

        # Create prompt
        prompt = self.SUMMARY_PROMPT_TEMPLATE.format(
            conversation_text=conversation_text
        )

        try:
            # Get summary from LLM
            response = await self.llm_provider.generate(
                prompt=prompt,
                max_tokens=1000,  # Limit summary length
                temperature=0.3,  # Lower temperature for more focused summary
            )

            summary = response.get("content", "").strip()
            logger.info(f"Generated summary for {len(messages)} messages: {len(summary)} chars")
            return summary

        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            # Fallback: create simple concatenated summary
            return self._create_fallback_summary(messages)

    def _format_messages_for_summary(self, messages: List[Message]) -> str:
        """
        Format messages into readable text for summarization.

        Args:
            messages: Messages to format

        Returns:
            Formatted conversation text
        """
        formatted_lines = []

        for msg in messages:
            role = msg.role.value.capitalize()
            content = msg.content.strip()
            formatted_lines.append(f"{role}: {content}")

        return "\n\n".join(formatted_lines)

    def _create_fallback_summary(self, messages: List[Message]) -> str:
        """
        Create a simple fallback summary if LLM fails.

        Args:
            messages: Messages to summarize

        Returns:
            Simple summary
        """
        user_messages = [m for m in messages if m.role == MessageRole.USER]
        assistant_messages = [m for m in messages if m.role == MessageRole.ASSISTANT]

        summary_parts = [
            f"**Conversation Summary** ({len(messages)} messages)",
            f"- User asked {len(user_messages)} questions",
            f"- Assistant provided {len(assistant_messages)} responses",
        ]

        # Add first and last user message as context
        if user_messages:
            first_q = user_messages[0].content[:100] + "..." if len(user_messages[0].content) > 100 else user_messages[0].content
            summary_parts.append(f"- First question: {first_q}")

            if len(user_messages) > 1:
                last_q = user_messages[-1].content[:100] + "..." if len(user_messages[-1].content) > 100 else user_messages[-1].content
                summary_parts.append(f"- Last question: {last_q}")

        return "\n".join(summary_parts)

    async def compress_conversation(
        self,
        db: AsyncSession,
        keep_recent: int = 5
    ) -> bool:
        """
        Compress conversation by summarizing older messages.

        Strategy:
        1. Keep the most recent N messages intact
        2. Summarize all older messages
        3. Replace old messages with a single summary message
        4. Update conversation

        Args:
            db: Database session
            keep_recent: Number of recent messages to keep unsummarized

        Returns:
            True if compression was successful
        """
        try:
            # Get context manager
            context_mgr = ContextManager(self.conversation)

            # Get messages to summarize and keep
            messages_to_summarize, messages_to_keep = await context_mgr.get_messages_for_summarization(
                db, keep_recent=keep_recent
            )

            if not messages_to_summarize:
                logger.info(f"No messages to summarize for conversation {self.conversation.id}")
                return False

            # Generate summary
            summary_text = await self.summarize_messages(messages_to_summarize, db)

            # Delete old messages
            old_message_ids = [m.id for m in messages_to_summarize]
            await db.execute(
                delete(Message).where(Message.id.in_(old_message_ids))
            )

            # Create summary message as system message
            summary_message = Message(
                conversation_id=self.conversation.id,
                role=MessageRole.SYSTEM,
                content=f"[Previous conversation summary]\n\n{summary_text}"
            )
            db.add(summary_message)

            await db.commit()

            logger.info(
                f"Compressed conversation {self.conversation.id}: "
                f"Summarized {len(messages_to_summarize)} messages, "
                f"kept {len(messages_to_keep)} recent messages"
            )

            return True

        except Exception as e:
            logger.error(f"Error compressing conversation: {e}")
            await db.rollback()
            return False


async def auto_summarize_if_needed(
    conversation_id: int,
    db: AsyncSession,
    keep_recent: int = 5
) -> bool:
    """
    Automatically summarize conversation if needed.

    Args:
        conversation_id: ID of conversation to check
        db: Database session
        keep_recent: Number of recent messages to keep

    Returns:
        True if summarization was performed
    """
    # Get conversation
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        return False

    # Check if summarization is needed
    context_mgr = ContextManager(conversation)
    should_summarize = await context_mgr.should_summarize(db)

    if not should_summarize:
        return False

    # Perform summarization
    summarizer = ConversationSummarizer(conversation)
    return await summarizer.compress_conversation(db, keep_recent=keep_recent)

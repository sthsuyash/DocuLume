"""Chat service for RAG-based conversations."""

from typing import Tuple, List, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.core.rag import RAGPipeline, VectorStore
from app.services.llm_router import LLMRouter
from app.utils.logger import logger


class ChatService:
    """Service for chat operations."""

    @staticmethod
    async def create_conversation(
        db: AsyncSession,
        user: User,
        title: Optional[str] = None,
        llm_provider: str = "openai",
        llm_model: str = "gpt-3.5-turbo"
    ) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            user_id=user.id,
            title=title or "New Chat",
            llm_provider=llm_provider,
            llm_model=llm_model
        )

        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

        return conversation

    @staticmethod
    async def ask_question(
        db: AsyncSession,
        user: User,
        question: str,
        conversation_id: Optional[int],
        vector_store: VectorStore,
        use_rag: bool = True,
        top_k: int = 5
    ) -> Tuple[str, List[str], int, int]:
        """Process a question and return answer with sources."""
        # Get or create conversation
        if conversation_id:
            result = await db.execute(
                select(Conversation).filter(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user.id
                )
            )
            conversation = result.scalar_one_or_none()

            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            conversation = await ChatService.create_conversation(db, user)

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=question
        )
        db.add(user_message)

        # Get LLM provider using LLMRouter (supports all configured providers)
        try:
            llm_provider_instance = await LLMRouter.get_provider_for_user(
                user,
                preferred_provider=conversation.llm_provider if conversation.llm_provider else None
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"LLM provider error: {str(e)}"
            )

        # Process question
        if use_rag:
            # RAG pipeline - will use the provider instance
            # Note: RAG pipeline needs to be updated to accept provider instance instead of config
            # For now, use direct LLM with context
            messages = [{"role": "user", "content": question}]

            # Get context from vector store if RAG enabled
            if hasattr(vector_store, 'similarity_search'):
                chunks = await vector_store.similarity_search(question, k=top_k)
                context = "\n\n".join([chunk.get('text', '') for chunk in chunks])
                sources = [chunk.get('source', '') for chunk in chunks]

                # Add context to prompt
                enhanced_question = f"Context:\n{context}\n\nQuestion: {question}"
                messages = [{"role": "user", "content": enhanced_question}]
            else:
                sources = []

            answer = await llm_provider_instance.chat(messages=messages)
        else:
            # Direct LLM query
            messages = [{"role": "user", "content": question}]
            answer = await llm_provider_instance.chat(messages=messages)
            sources = []

        # Save assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=answer,
            sources=sources if sources else None
        )
        db.add(assistant_message)

        await db.commit()
        await db.refresh(assistant_message)

        logger.info(f"Question answered in conversation {conversation.id}")

        return answer, sources, conversation.id, assistant_message.id

    @staticmethod
    async def ask_question_stream(
        db: AsyncSession,
        user: User,
        question: str,
        conversation_id: Optional[int],
        vector_store: VectorStore,
        use_rag: bool = True,
        top_k: int = 5
    ) -> AsyncGenerator[Tuple[str, Optional[List[str]], int, Optional[int]], None]:
        """Process a question and stream answer with sources."""
        # Get or create conversation
        if conversation_id:
            result = await db.execute(
                select(Conversation).filter(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user.id
                )
            )
            conversation = result.scalar_one_or_none()

            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            conversation = await ChatService.create_conversation(db, user)

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=question
        )
        db.add(user_message)
        await db.commit()

        # Get LLM provider using LLMRouter
        try:
            llm_provider_instance = await LLMRouter.get_provider_for_user(
                user,
                preferred_provider=conversation.llm_provider if conversation.llm_provider else None
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"LLM provider error: {str(e)}"
            )

        # Stream response
        full_answer = ""
        sources = []

        # For now, stream is not implemented in UniversalLLMProvider
        # Use non-streaming approach and yield in chunks
        messages = [{"role": "user", "content": question}]

        if use_rag and hasattr(vector_store, 'similarity_search'):
            # Get context from vector store
            chunks = await vector_store.similarity_search(question, k=top_k)
            context = "\n\n".join([chunk.get('text', '') for chunk in chunks])
            sources = [chunk.get('source', '') for chunk in chunks]

            # Yield sources first
            yield "", sources, conversation.id, None

            # Add context to prompt
            enhanced_question = f"Context:\n{context}\n\nQuestion: {question}"
            messages = [{"role": "user", "content": enhanced_question}]

        # Get full answer (streaming can be added later)
        full_answer = await llm_provider_instance.chat(messages=messages)

        # Yield answer in chunks for better UX
        chunk_size = 50
        for i in range(0, len(full_answer), chunk_size):
            chunk = full_answer[i:i+chunk_size]
            yield chunk, None, conversation.id, None

        # Save complete assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=full_answer,
            sources=sources if sources else None
        )
        db.add(assistant_message)
        await db.commit()
        await db.refresh(assistant_message)

        logger.info(f"Streamed question answered in conversation {conversation.id}")

        # Yield final chunk with message ID
        yield "", None, conversation.id, assistant_message.id

    @staticmethod
    async def get_user_conversations(
        db: AsyncSession,
        user_id: int,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Conversation], int]:
        """Get paginated conversations for a user.

        Args:
            db: Database session
            user_id: User ID to filter conversations
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (conversations list, total count)
        """
        # Count total conversations
        count_query = select(func.count(Conversation.id)).filter(
            Conversation.user_id == user_id
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated conversations
        offset = (page - 1) * page_size
        query = (
            select(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await db.execute(query)
        conversations = list(result.scalars().all())

        return conversations, total

    @staticmethod
    async def get_conversation_messages(
        db: AsyncSession,
        conversation_id: int,
        user_id: int
    ) -> List[Message]:
        """Get all messages in a conversation."""
        # Verify ownership
        result = await db.execute(
            select(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # Get messages
        message_result = await db.execute(
            select(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        return list(message_result.scalars().all())

    @staticmethod
    async def get_conversation_with_messages(
        db: AsyncSession,
        conversation_id: int,
        user_id: int
    ) -> Tuple[Conversation, List[Message]]:
        """Get conversation with all its messages."""
        # Verify ownership
        result = await db.execute(
            select(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # Get messages
        messages = await ChatService.get_conversation_messages(db, conversation_id, user_id)

        return conversation, messages

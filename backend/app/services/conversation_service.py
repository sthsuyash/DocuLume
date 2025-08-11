"""Conversation management service."""

from typing import Any, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User


class ConversationService:

    @staticmethod
    async def create(
        db: AsyncSession,
        user: User,
        title: Optional[str] = None,
        llm_provider: str = "openai",
        llm_model: str = "gpt-3.5-turbo",
        system_prompt: Optional[str] = None,
    ) -> Conversation:
        conversation = Conversation(
            user_id=user.id,
            title=title or "New Chat",
            llm_provider=llm_provider,
            llm_model=llm_model,
            system_prompt=system_prompt,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def update(
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
        **fields: Any,
    ) -> Conversation:
        result = await db.execute(
            select(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        for k, v in fields.items():
            if v is not None and hasattr(conv, k):
                setattr(conv, k, v)
        await db.commit()
        await db.refresh(conv)
        return conv

    @staticmethod
    async def get_or_404(db: AsyncSession, conversation_id: int, user_id: int) -> Conversation:
        result = await db.execute(
            select(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        return conv

    @staticmethod
    async def list_active(
        db: AsyncSession,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Conversation], int]:
        total = (await db.execute(
            select(func.count(Conversation.id)).filter(
                Conversation.user_id == user_id, Conversation.is_archived == False
            )
        )).scalar() or 0

        rows = await db.execute(
            select(Conversation)
            .filter(Conversation.user_id == user_id, Conversation.is_archived == False)
            .order_by(Conversation.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(rows.scalars().all()), total

    @staticmethod
    async def list_archived(
        db: AsyncSession,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Conversation], int]:
        total = (await db.execute(
            select(func.count(Conversation.id)).filter(
                Conversation.user_id == user_id, Conversation.is_archived == True
            )
        )).scalar() or 0

        rows = await db.execute(
            select(Conversation)
            .filter(Conversation.user_id == user_id, Conversation.is_archived == True)
            .order_by(Conversation.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(rows.scalars().all()), total

    @staticmethod
    async def search(
        db: AsyncSession,
        user_id: int,
        q: str,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Conversation], int]:
        pattern = f"%{q}%"
        base = (
            select(Conversation)
            .join(Message, Message.conversation_id == Conversation.id, isouter=True)
            .filter(
                Conversation.user_id == user_id,
                or_(Conversation.title.ilike(pattern), Message.content.ilike(pattern)),
            )
            .distinct()
        )
        total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar() or 0
        rows = await db.execute(
            base.order_by(Conversation.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(rows.scalars().all()), total

    @staticmethod
    async def get_messages(
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
    ) -> List[Message]:
        await ConversationService.get_or_404(db, conversation_id, user_id)
        rows = await db.execute(
            select(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        return list(rows.scalars().all())

    @staticmethod
    async def get_with_messages(
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
    ) -> Tuple[Conversation, List[Message]]:
        conv = await ConversationService.get_or_404(db, conversation_id, user_id)
        messages = await ConversationService.get_messages(db, conversation_id, user_id)
        return conv, messages

    @staticmethod
    async def delete(db: AsyncSession, conversation_id: int, user_id: int) -> None:
        conv = await ConversationService.get_or_404(db, conversation_id, user_id)
        await db.delete(conv)
        await db.commit()

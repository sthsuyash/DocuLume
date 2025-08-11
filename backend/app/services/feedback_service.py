"""Feedback service for message ratings."""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.feedback import Feedback, FeedbackValue


class FeedbackService:

    @staticmethod
    async def submit(
        db: AsyncSession,
        message_id: int,
        user_id: int,
        value: str,
        comment: Optional[str] = None,
    ) -> Feedback:
        result = await db.execute(
            select(Message)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .filter(Message.id == message_id, Conversation.user_id == user_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        fb_result = await db.execute(select(Feedback).filter(Feedback.message_id == message_id))
        feedback = fb_result.scalar_one_or_none()
        if feedback:
            feedback.value = FeedbackValue(value)
            feedback.comment = comment
        else:
            feedback = Feedback(
                message_id=message_id,
                user_id=user_id,
                value=FeedbackValue(value),
                comment=comment,
            )
            db.add(feedback)

        await db.commit()
        await db.refresh(feedback)
        return feedback

    @staticmethod
    async def delete(db: AsyncSession, message_id: int, user_id: int) -> None:
        result = await db.execute(
            select(Feedback).filter(Feedback.message_id == message_id, Feedback.user_id == user_id)
        )
        feedback = result.scalar_one_or_none()
        if feedback:
            await db.delete(feedback)
            await db.commit()

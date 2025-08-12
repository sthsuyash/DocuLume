"""User routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.services import AuthService
from app.middleware import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user information."""
    updated_user = await AuthService.update_user(db, current_user.id, user_update)
    return updated_user


@router.get("/me/stats")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Personal usage statistics for the current user."""
    doc_count = (await db.execute(
        select(func.count(Document.id)).where(Document.user_id == current_user.id)
    )).scalar() or 0

    conv_count = (await db.execute(
        select(func.count(Conversation.id)).where(Conversation.user_id == current_user.id)
    )).scalar() or 0

    msg_stats = (await db.execute(
        select(
            func.count(Message.id),
            func.coalesce(func.sum(Message.prompt_tokens), 0),
            func.coalesce(func.sum(Message.completion_tokens), 0),
            func.coalesce(func.sum(Message.estimated_cost_usd), 0.0),
        )
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == current_user.id, Message.role == MessageRole.ASSISTANT)
    )).one()

    return {
        "document_count": doc_count,
        "conversation_count": conv_count,
        "message_count": int(msg_stats[0]),
        "total_prompt_tokens": int(msg_stats[1]),
        "total_completion_tokens": int(msg_stats[2]),
        "total_cost_usd": round(float(msg_stats[3]), 4),
    }

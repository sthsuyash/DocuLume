"""Public read-only conversation share endpoint."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.conversation_share import ConversationShare
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter(prefix="/share", tags=["Share"])


@router.get("/{token}")
async def get_shared_conversation(token: str, db: AsyncSession = Depends(get_db)):
    """Return a shared conversation (no auth required)."""
    share = (await db.execute(
        select(ConversationShare).where(
            ConversationShare.token == token,
            ConversationShare.is_active == True,
        )
    )).scalar_one_or_none()

    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found or revoked")

    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Share link has expired")

    conv = (await db.execute(
        select(Conversation).where(Conversation.id == share.conversation_id)
    )).scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = (await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    )).scalars().all()

    return {
        "conversation": {
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat(),
        },
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
                "sources": m.sources,
            }
            for m in messages
        ],
        "shared_at": share.created_at.isoformat(),
    }

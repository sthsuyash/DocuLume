"""Active session management routes."""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hashlib

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.user_session import UserSession

router = APIRouter(prefix="/users/me/sessions", tags=["Sessions"])


class SessionResponse(BaseModel):
    id: int
    device_info: str | None
    ip_address: str | None
    created_at: datetime
    last_used_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSession)
        .filter(UserSession.user_id == current_user.id, UserSession.is_active == True)
        .order_by(UserSession.last_used_at.desc())
    )
    return result.scalars().all()


@router.delete("/{session_id}", status_code=204)
async def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSession).filter(
            UserSession.id == session_id,
            UserSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session.is_active = False
    await db.commit()


@router.delete("", status_code=204)
async def revoke_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke all sessions except the current one."""
    current_refresh = request.cookies.get("refresh_token")
    current_hash = hashlib.sha256(current_refresh.encode()).hexdigest() if current_refresh else None

    result = await db.execute(
        select(UserSession).filter(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True,
        )
    )
    for session in result.scalars().all():
        if session.refresh_token_hash != current_hash:
            session.is_active = False
    await db.commit()

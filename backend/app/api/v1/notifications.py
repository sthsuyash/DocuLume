"""Notification routes."""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    body: Optional[str]
    data: Optional[dict]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    q = q.order_by(Notification.created_at.desc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
        await db.refresh(notif)
    return notif


@router.post("/read-all", status_code=204)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()

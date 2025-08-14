"""Audit log viewer routes."""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/users/me/audit-log", tags=["Audit Log"])


class AuditLogResponse(BaseModel):
    id: int
    event: str
    target: Optional[str]
    ip_address: Optional[str]
    extra: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[AuditLogResponse])
async def get_audit_log(
    limit: int = Query(50, ge=1, le=200),
    event: Optional[str] = Query(None, description="Filter by event prefix"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(AuditLog).filter(AuditLog.user_id == current_user.id)
    if event:
        q = q.filter(AuditLog.event.startswith(event))
    q = q.order_by(AuditLog.created_at.desc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()

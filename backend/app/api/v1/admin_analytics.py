"""Admin statistics and analytics routes."""

import csv
import io
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.database import get_db
from app.models.conversation import Conversation
from app.models.document import Document
from app.models.feedback import Feedback
from app.models.message import Message
from app.models.user import User
from app.api.v1.admin_deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats/overview")
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from datetime import datetime, timedelta

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_docs = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    total_convos = (await db.execute(select(func.count(Conversation.id)))).scalar() or 0
    total_messages = (await db.execute(select(func.count(Message.id)))).scalar() or 0
    total_storage = (await db.execute(select(func.coalesce(func.sum(Document.file_size), 0)))).scalar() or 0

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = (await db.execute(
        select(func.count(func.distinct(Conversation.user_id)))
        .where(Conversation.created_at >= thirty_days_ago)
    )).scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_documents": total_docs,
        "total_conversations": total_convos,
        "total_messages": total_messages,
        "total_storage_bytes": total_storage,
        "avg_documents_per_user": round(total_docs / total_users, 2) if total_users > 0 else 0,
        "avg_conversations_per_user": round(total_convos / total_users, 2) if total_users > 0 else 0,
    }


@router.get("/activity/recent")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users_result = await db.execute(
        select(User.id, User.email, User.created_at).order_by(User.created_at.desc()).limit(limit)
    )
    docs_result = await db.execute(
        select(Document.id, Document.original_filename, Document.user_id, Document.created_at)
        .order_by(Document.created_at.desc())
        .limit(limit)
    )
    convos_result = await db.execute(
        select(Conversation.id, Conversation.user_id, Conversation.title, Conversation.created_at)
        .order_by(Conversation.created_at.desc())
        .limit(limit)
    )

    activities = []
    for row in users_result.all():
        activities.append({
            "id": row.id, "type": "user_registered", "user_email": row.email,
            "description": f"New user registered: {row.email}",
            "created_at": row.created_at.isoformat(),
        })
    for row in docs_result.all():
        activities.append({
            "id": row.id, "type": "document_uploaded", "user_email": f"user:{row.user_id}",
            "description": f"Document uploaded: {row.original_filename}",
            "created_at": row.created_at.isoformat(),
        })
    for row in convos_result.all():
        activities.append({
            "id": row.id, "type": "conversation_started", "user_email": f"user:{row.user_id}",
            "description": f"Conversation started: {row.title or 'Untitled'}",
            "created_at": row.created_at.isoformat(),
        })

    activities.sort(key=lambda x: x["created_at"], reverse=True)
    return {"items": activities[:limit]}


@router.get("/stats/users/{user_id}")
async def get_user_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    doc_count = (await db.execute(select(func.count(Document.id)).where(Document.user_id == user_id))).scalar()
    convo_count = (await db.execute(select(func.count(Conversation.id)).where(Conversation.user_id == user_id))).scalar()
    total_storage = (await db.execute(select(func.sum(Document.file_size)).where(Document.user_id == user_id))).scalar() or 0

    return {
        "user_id": user_id,
        "email": user.email,
        "total_documents": doc_count,
        "total_conversations": convo_count,
        "total_storage_bytes": total_storage,
        "total_storage_mb": round(total_storage / (1024 * 1024), 2),
        "member_since": user.created_at.isoformat(),
    }


@router.get("/analytics/feedback/export")
async def export_feedback(
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    rows = (await db.execute(
        select(
            Feedback.id,
            Feedback.value,
            Feedback.comment,
            Feedback.created_at,
            Message.content.label("message_content"),
            Message.role.label("message_role"),
            Conversation.id.label("conversation_id"),
            User.email.label("user_email"),
        )
        .join(Message, Feedback.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .join(User, Conversation.user_id == User.id)
        .order_by(Feedback.created_at.desc())
    )).all()

    if format == "json":
        data = [
            {
                "id": r.id, "value": r.value, "comment": r.comment,
                "created_at": r.created_at.isoformat(),
                "message": r.message_content[:200],
                "conversation_id": r.conversation_id,
                "user_email": r.user_email,
            }
            for r in rows
        ]
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=feedback_export.json"},
        )

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "value", "comment", "created_at", "message_preview", "conversation_id", "user_email"])
    for r in rows:
        writer.writerow([
            r.id, r.value, r.comment or "", r.created_at.isoformat(),
            r.message_content[:200], r.conversation_id, r.user_email,
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=feedback_export.csv"},
    )

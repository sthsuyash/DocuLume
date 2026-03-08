"""Admin analytics endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
from typing import Optional, List
import json
import csv
from io import StringIO
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.document import Document
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/analytics/overview")
async def analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system analytics overview (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    # Total users
    users_count = await db.execute(select(func.count(User.id)))
    total_users = users_count.scalar()

    # Active users (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_users = await db.execute(
        select(func.count(User.id)).filter(User.last_login >= week_ago)
    )
    active_count = active_users.scalar()

    # Total conversations
    convs = await db.execute(select(func.count(Conversation.id)))
    total_conversations = convs.scalar()

    # Total messages
    msgs = await db.execute(select(func.count(Message.id)))
    total_messages = msgs.scalar()

    return {
        "total_users": total_users,
        "active_users_7d": active_count,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "avg_messages_per_conversation": round(total_messages / max(total_conversations, 1), 2)
    }


@router.get("/stats")
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system statistics for admin dashboard."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    # Total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    # Active users (logged in within last 30 days)
    month_ago = datetime.utcnow() - timedelta(days=30)
    active_users_result = await db.execute(
        select(func.count(User.id)).filter(User.last_login >= month_ago)
    )
    active_users = active_users_result.scalar() or 0

    # Total documents
    total_docs_result = await db.execute(select(func.count(Document.id)))
    total_documents = total_docs_result.scalar() or 0

    # Total storage (sum of file sizes)
    total_storage_result = await db.execute(select(func.sum(Document.file_size)))
    total_storage_bytes = total_storage_result.scalar() or 0

    # Total conversations
    total_convs_result = await db.execute(select(func.count(Conversation.id)))
    total_conversations = total_convs_result.scalar() or 0

    # Total messages
    total_msgs_result = await db.execute(select(func.count(Message.id)))
    total_messages = total_msgs_result.scalar() or 0

    # Calculate averages
    avg_documents_per_user = total_documents / max(total_users, 1)
    avg_conversations_per_user = total_conversations / max(total_users, 1)

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_documents": total_documents,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_storage_bytes": total_storage_bytes,
        "avg_documents_per_user": round(avg_documents_per_user, 2),
        "avg_conversations_per_user": round(avg_conversations_per_user, 2)
    }


@router.get("/activity/recent")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent system activity for admin dashboard."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    activity_items = []

    # Recent user registrations
    recent_users = await db.execute(
        select(User).order_by(desc(User.created_at)).limit(limit // 3)
    )
    for user in recent_users.scalars():
        activity_items.append({
            "id": user.id,
            "type": "user_registered",
            "user_email": user.email,
            "description": f"New user registered: {user.username}",
            "created_at": user.created_at.isoformat()
        })

    # Recent document uploads
    recent_docs = await db.execute(
        select(Document, User).join(User).order_by(desc(Document.created_at)).limit(limit // 3)
    )
    for doc, user in recent_docs:
        activity_items.append({
            "id": doc.id,
            "type": "document_uploaded",
            "user_email": user.email,
            "description": f"Document uploaded: {doc.original_filename}",
            "created_at": doc.created_at.isoformat()
        })

    # Recent conversations
    recent_convs = await db.execute(
        select(Conversation, User).join(User).order_by(desc(Conversation.created_at)).limit(limit // 3)
    )
    for conv, user in recent_convs:
        activity_items.append({
            "id": conv.id,
            "type": "conversation_started",
            "user_email": user.email,
            "description": f"New conversation: {conv.title or 'Untitled'}",
            "created_at": conv.created_at.isoformat()
        })

    # Sort by created_at descending
    activity_items.sort(key=lambda x: x["created_at"], reverse=True)

    return activity_items[:limit]



@router.get("/analytics")
async def get_analytics(
    time_range: str = Query("7d", regex="^(24h|7d|30d|90d|all)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive analytics with time range filter."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    # Calculate time range
    if time_range == "24h":
        since = datetime.utcnow() - timedelta(hours=24)
    elif time_range == "7d":
        since = datetime.utcnow() - timedelta(days=7)
    elif time_range == "30d":
        since = datetime.utcnow() - timedelta(days=30)
    elif time_range == "90d":
        since = datetime.utcnow() - timedelta(days=90)
    else:  # all
        since = datetime.min

    # Overview stats
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_docs = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    total_convs = (await db.execute(select(func.count(Conversation.id)))).scalar() or 0
    total_msgs = (await db.execute(select(func.count(Message.id)))).scalar() or 0

    # Users in time range
    users_in_range = (await db.execute(
        select(func.count(User.id)).filter(User.created_at >= since)
    )).scalar() or 0

    # Documents in time range
    docs_in_range = (await db.execute(
        select(func.count(Document.id)).filter(Document.created_at >= since)
    )).scalar() or 0

    # Calculate growth rates
    growth_rate_users = (users_in_range / max(total_users - users_in_range, 1)) * 100
    growth_rate_documents = (docs_in_range / max(total_docs - docs_in_range, 1)) * 100

    # Top users by document count
    top_users_query = await db.execute(
        select(
            User.username,
            User.email,
            func.count(Document.id).label("document_count"),
            func.count(Conversation.id).label("conversation_count"),
            func.count(Message.id).label("message_count")
        )
        .outerjoin(Document)
        .outerjoin(Conversation)
        .outerjoin(Message)
        .group_by(User.id, User.username, User.email)
        .order_by(desc("document_count"))
        .limit(10)
    )
    top_users = [
        {
            "username": row[0],
            "email": row[1],
            "document_count": row[2],
            "conversation_count": row[3],
            "message_count": row[4]
        }
        for row in top_users_query
    ]

    # Document types distribution
    doc_types_query = await db.execute(
        select(
            Document.file_type,
            func.count(Document.id).label("count")
        )
        .group_by(Document.file_type)
    )
    doc_types = []
    for file_type, count in doc_types_query:
        percentage = (count / max(total_docs, 1)) * 100
        doc_types.append({
            "file_type": file_type,
            "count": count,
            "percentage": round(percentage, 2)
        })

    # Time series data (simplified - daily for last 7-30 days)
    time_series = []
    if time_range != "all":
        days = 7 if time_range in ["24h", "7d"] else 30
        for i in range(days):
            day_start = datetime.utcnow() - timedelta(days=days - i)
            day_end = day_start + timedelta(days=1)

            users_day = (await db.execute(
                select(func.count(User.id)).filter(
                    User.created_at >= day_start,
                    User.created_at < day_end
                )
            )).scalar() or 0

            docs_day = (await db.execute(
                select(func.count(Document.id)).filter(
                    Document.created_at >= day_start,
                    Document.created_at < day_end
                )
            )).scalar() or 0

            convs_day = (await db.execute(
                select(func.count(Conversation.id)).filter(
                    Conversation.created_at >= day_start,
                    Conversation.created_at < day_end
                )
            )).scalar() or 0

            time_series.append({
                "date": day_start.date().isoformat(),
                "users": users_day,
                "documents": docs_day,
                "conversations": convs_day
            })

    # Conversation stats
    avg_messages = (total_msgs / max(total_convs, 1))
    
    return {
        "overview": {
            "total_users": total_users,
            "total_documents": total_docs,
            "total_conversations": total_convs,
            "total_messages": total_msgs,
            "growth_rate_users": round(growth_rate_users, 2),
            "growth_rate_documents": round(growth_rate_documents, 2)
        },
        "time_series": time_series,
        "top_users": top_users,
        "document_types": doc_types,
        "conversation_stats": {
            "avg_messages_per_conversation": round(avg_messages, 2),
            "avg_conversation_length_minutes": 0,  # Would need duration tracking
            "most_active_hour": 14,  # Would need hourly tracking
            "total_rag_queries": total_convs  # Simplified
        }
    }


@router.get("/analytics/export")
async def export_analytics(
    format: str = Query("json", pattern="^(json|csv)$"),
    time_range: str = Query("7d", pattern="^(24h|7d|30d|90d|all)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export analytics data in JSON or CSV format."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    # Get analytics data
    analytics_data = await get_analytics(time_range, db, current_user)

    if format == "json":
        return Response(
            content=json.dumps(analytics_data, indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=analytics_{time_range}.json"}
        )
    else:  # csv
        # Convert to CSV (simplified - top users only)
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["Username", "Email", "Documents", "Conversations", "Messages"])
        for user in analytics_data["top_users"]:
            writer.writerow([
                user["username"],
                user["email"],
                user["document_count"],
                user["conversation_count"],
                user["message_count"]
            ])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=analytics_{time_range}.csv"}
        )

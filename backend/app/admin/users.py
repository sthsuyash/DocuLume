"""Admin user management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.api.v1.auth import get_current_user

router = APIRouter()


class UserUpdate(BaseModel):
    """User update schema for admin."""
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_admin: Optional[bool] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users with pagination and filters (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    # Build query
    query = select(User)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_filter)) | (User.username.ilike(search_filter))
        )

    if is_admin is not None:
        query = query.filter(User.is_superuser == is_admin)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(User.created_at.desc())

    result = await db.execute(query)
    users = result.scalars().all()

    # Add aggregated counts for each user
    users_with_counts = []
    for user in users:
        # Count documents
        doc_count_result = await db.execute(
            select(func.count(Document.id)).filter(Document.user_id == user.id)
        )
        document_count = doc_count_result.scalar() or 0

        # Count conversations
        conv_count_result = await db.execute(
            select(func.count(Conversation.id)).filter(Conversation.user_id == user.id)
        )
        conversation_count = conv_count_result.scalar() or 0

        # Create user dict with counts
        user_dict = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login,
            "document_count": document_count,
            "conversation_count": conversation_count,
        }
        users_with_counts.append(user_dict)

    return {
        "items": users_with_counts,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed user info (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found")

    return user

@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    # Prevent self-modification
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot modify your own account")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found")

    # Update fields
    if user_update.is_admin is not None:
        user.is_superuser = user_update.is_admin

    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    if user_update.is_verified is not None:
        user.is_verified = user_update.is_verified

    await db.commit()
    await db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "is_verified": user.is_verified
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot delete your own account")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found")

    await db.delete(user)
    await db.commit()

    return {"message": "User deleted successfully", "user_id": user_id}


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle user active status (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found")

    user.is_active = not user.is_active
    await db.commit()

    return {"user_id": user_id, "is_active": user.is_active}

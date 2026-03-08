"""Admin routes for document and user management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.schemas.document import DocumentResponse
from app.schemas.user import UserResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify user has admin privileges."""
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


# ==================== USER MANAGEMENT ====================

@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users (admin only)."""
    # Count total
    count_query = select(func.count(User.id))
    if search:
        count_query = count_query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )
    total = (await db.execute(count_query)).scalar()

    # Paginated query
    offset = (page - 1) * page_size
    query = select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)

    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )

    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedResponse(
        items=[UserResponse.model_validate(user) for user in users],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get detailed user information."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str,  # 'user', 'admin', 'super_admin'
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update user role (super admin only)."""
    if admin.role != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required"
        )

    if role not in ['user', 'admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.role = role
    await db.commit()

    return {"message": f"User role updated to {role}"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a user and all their data."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent deleting super admins
    if hasattr(user, 'role') and user.role == 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete super admin"
        )

    await db.delete(user)
    await db.commit()

    return {"message": "User deleted successfully"}


# ==================== DOCUMENT MANAGEMENT ====================

@router.get("/documents", response_model=PaginatedResponse[DocumentResponse])
async def list_all_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all documents across all users."""
    # Count total
    count_query = select(func.count(Document.id))
    if user_id:
        count_query = count_query.where(Document.user_id == user_id)
    if status:
        count_query = count_query.where(Document.status == status)
    total = (await db.execute(count_query)).scalar()

    # Paginated query
    offset = (page - 1) * page_size
    query = (
        select(Document)
        .options(selectinload(Document.user))
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    if user_id:
        query = query.where(Document.user_id == user_id)
    if status:
        query = query.where(Document.status == status)

    result = await db.execute(query)
    documents = result.scalars().all()

    return PaginatedResponse(
        items=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/users/{user_id}/documents", response_model=PaginatedResponse[DocumentResponse])
async def list_user_documents(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all documents for a specific user."""
    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Count total
    count_query = select(func.count(Document.id)).where(Document.user_id == user_id)
    total = (await db.execute(count_query)).scalar()

    # Paginated query
    offset = (page - 1) * page_size
    query = (
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    result = await db.execute(query)
    documents = result.scalars().all()

    return PaginatedResponse(
        items=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size
    )


@router.delete("/documents/{document_id}")
async def admin_delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete any document (admin only)."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    await db.delete(document)
    await db.commit()

    return {"message": "Document deleted successfully"}


@router.post("/documents/bulk-delete")
async def bulk_delete_documents(
    document_ids: List[int],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Bulk delete multiple documents."""
    result = await db.execute(
        select(Document).where(Document.id.in_(document_ids))
    )
    documents = result.scalars().all()

    for doc in documents:
        await db.delete(doc)

    await db.commit()

    return {
        "message": f"Deleted {len(documents)} documents",
        "deleted_count": len(documents)
    }


# ==================== STATISTICS ====================

@router.get("/stats/overview")
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get platform-wide statistics."""
    # Total users
    total_users = (await db.execute(select(func.count(User.id)))).scalar()

    # Total documents
    total_docs = (await db.execute(select(func.count(Document.id)))).scalar()

    # Total conversations
    total_convos = (await db.execute(select(func.count(Conversation.id)))).scalar()

    # Active users (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = (await db.execute(
        select(func.count(func.distinct(Conversation.user_id)))
        .where(Conversation.created_at >= thirty_days_ago)
    )).scalar()

    return {
        "total_users": total_users,
        "total_documents": total_docs,
        "total_conversations": total_convos,
        "active_users_30d": active_users,
        "avg_docs_per_user": round(total_docs / total_users, 2) if total_users > 0 else 0,
        "avg_convos_per_user": round(total_convos / total_users, 2) if total_users > 0 else 0
    }


@router.get("/stats/users/{user_id}")
async def get_user_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get detailed statistics for a specific user."""
    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Document count
    doc_count = (await db.execute(
        select(func.count(Document.id)).where(Document.user_id == user_id)
    )).scalar()

    # Conversation count
    convo_count = (await db.execute(
        select(func.count(Conversation.id)).where(Conversation.user_id == user_id)
    )).scalar()

    # Total storage used (sum of file sizes)
    total_storage = (await db.execute(
        select(func.sum(Document.file_size)).where(Document.user_id == user_id)
    )).scalar() or 0

    return {
        "user_id": user_id,
        "email": user.email,
        "total_documents": doc_count,
        "total_conversations": convo_count,
        "total_storage_bytes": total_storage,
        "total_storage_mb": round(total_storage / (1024 * 1024), 2),
        "member_since": user.created_at.isoformat()
    }

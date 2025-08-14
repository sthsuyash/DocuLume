"""Admin user management routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, or_, select

from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserResponse
from app.utils import audit
from app.api.v1.admin_deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    count_query = select(func.count(User.id))
    if search:
        count_query = count_query.where(
            or_(User.email.ilike(f"%{search}%"), User.full_name.ilike(f"%{search}%"))
        )
    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    if search:
        query = query.where(
            or_(User.email.ilike(f"%{search}%"), User.full_name.ilike(f"%{search}%"))
        )

    result = await db.execute(query)
    users = result.scalars().all()
    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if not admin.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin privileges required")
    if role not in ["user", "admin", "super_admin"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = role
    await db.commit()
    audit.log_admin_role_change(admin.id, user_id, role)
    return {"message": f"User role updated to {role}"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if hasattr(user, "role") and user.role == "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete super admin")

    audit.log_admin_user_delete(admin.id, user_id, user.email)
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}

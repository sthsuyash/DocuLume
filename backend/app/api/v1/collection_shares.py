"""Collection sharing routes."""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.collection import Collection
from app.models.collection_share import CollectionShare
from app.utils.email import send_email

router = APIRouter(prefix="/collections", tags=["Collection Sharing"])


class ShareInvite(BaseModel):
    email: EmailStr
    permission: str = Field(default="read", pattern="^(read|write)$")


class ShareResponse(BaseModel):
    id: int
    collection_id: int
    shared_with_email: str
    permission: str
    accepted: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/{collection_id}/shares", response_model=List[ShareResponse])
async def list_shares(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    col_result = await db.execute(
        select(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not col_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    result = await db.execute(
        select(CollectionShare).filter(CollectionShare.collection_id == collection_id)
    )
    return result.scalars().all()


@router.post("/{collection_id}/shares", response_model=ShareResponse, status_code=201)
async def invite_to_collection(
    collection_id: int,
    data: ShareInvite,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    col_result = await db.execute(
        select(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    collection = col_result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    existing = await db.execute(
        select(CollectionShare).filter(
            CollectionShare.collection_id == collection_id,
            CollectionShare.shared_with_email == data.email,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already invited")

    share = CollectionShare(
        collection_id=collection_id,
        invited_by_user_id=current_user.id,
        shared_with_email=data.email,
        permission=data.permission,
    )
    db.add(share)
    await db.commit()
    await db.refresh(share)

    await send_email(
        to=data.email,
        subject=f"{current_user.full_name or current_user.email} shared a collection with you on DocuLume",
        html_body=(
            f"<p>{current_user.full_name or current_user.email} has shared the collection "
            f"<strong>{collection.name}</strong> with you on DocuLume.</p>"
            f"<p>Log in to your DocuLume account to access it.</p>"
        ),
    )

    return share


@router.delete("/{collection_id}/shares/{share_id}", status_code=204)
async def remove_share(
    collection_id: int,
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    col_result = await db.execute(
        select(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not col_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    result = await db.execute(
        select(CollectionShare).filter(
            CollectionShare.id == share_id,
            CollectionShare.collection_id == collection_id,
        )
    )
    share = result.scalar_one_or_none()
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found")
    await db.delete(share)
    await db.commit()

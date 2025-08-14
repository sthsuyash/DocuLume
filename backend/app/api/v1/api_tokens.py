"""API token management routes."""

import hashlib
import secrets
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.api_token import APIToken

router = APIRouter(prefix="/api-tokens", tags=["API Tokens"])


class APITokenCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    expires_at: Optional[datetime] = None


class APITokenResponse(BaseModel):
    id: int
    name: str
    token_prefix: str
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class APITokenCreated(APITokenResponse):
    token: str = ""  # populated at creation, never stored


@router.get("", response_model=List[APITokenResponse])
async def list_tokens(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIToken)
        .filter(APIToken.user_id == current_user.id, APIToken.is_active == True)
        .order_by(APIToken.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=APITokenCreated, status_code=201)
async def create_token(
    data: APITokenCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    raw = secrets.token_urlsafe(40)
    prefix = raw[:8]
    token_hash = hashlib.sha256(raw.encode()).hexdigest()

    token = APIToken(
        user_id=current_user.id,
        name=data.name,
        token_prefix=prefix,
        token_hash=token_hash,
        expires_at=data.expires_at,
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)

    resp = APITokenCreated.model_validate(token)
    return resp.model_copy(update={"token": raw})


@router.delete("/{token_id}", status_code=204)
async def revoke_token(
    token_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIToken).filter(APIToken.id == token_id, APIToken.user_id == current_user.id)
    )
    token = result.scalar_one_or_none()
    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
    token.is_active = False
    await db.commit()

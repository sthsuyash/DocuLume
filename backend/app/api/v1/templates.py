"""Conversation template routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.conversation_template import ConversationTemplate

router = APIRouter(prefix="/chat/templates", tags=["Templates"])


class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    system_prompt: Optional[str] = Field(None, max_length=4000)
    llm_provider: str = Field(default="openai", pattern="^(openai|anthropic|google)$")
    llm_model: str = "gpt-3.5-turbo"


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    system_prompt: Optional[str] = Field(None, max_length=4000)
    llm_provider: Optional[str] = Field(None, pattern="^(openai|anthropic|google)$")
    llm_model: Optional[str] = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    system_prompt: Optional[str]
    llm_provider: str
    llm_model: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ConversationTemplate)
        .filter(ConversationTemplate.user_id == current_user.id)
        .order_by(ConversationTemplate.name)
    )
    return result.scalars().all()


@router.post("", response_model=TemplateResponse, status_code=201)
async def create_template(
    data: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    template = ConversationTemplate(user_id=current_user.id, **data.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    data: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ConversationTemplate).filter(
            ConversationTemplate.id == template_id,
            ConversationTemplate.user_id == current_user.id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ConversationTemplate).filter(
            ConversationTemplate.id == template_id,
            ConversationTemplate.user_id == current_user.id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    await db.delete(template)
    await db.commit()

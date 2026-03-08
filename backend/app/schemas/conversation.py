"""Conversation schemas."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ConversationCreate(BaseModel):
    title: Optional[str] = None
    llm_provider: str = Field(default="openai", pattern="^(openai|anthropic|google)$")
    llm_model: str = "gpt-3.5-turbo"


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    llm_provider: Optional[str] = Field(None, pattern="^(openai|anthropic|google)$")
    llm_model: Optional[str] = None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: Optional[str]
    llm_provider: str
    llm_model: str
    created_at: datetime
    updated_at: datetime


class ConversationWithMessages(ConversationResponse):
    messages: List["MessageResponse"] = []


class ConversationList(BaseModel):
    conversations: List[ConversationResponse]
    total: int


from app.schemas.message import MessageResponse
ConversationWithMessages.model_rebuild()

"""Message schemas."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.message import MessageRole
from app.utils.validators import sanitize_text_input


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: MessageRole
    content: str
    sources: Optional[List[str]] = None
    created_at: datetime


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="User question")
    conversation_id: Optional[int] = Field(None, ge=1, description="Conversation ID")
    use_rag: bool = Field(True, description="Whether to use RAG for context")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="LLM temperature")

    @field_validator('question')
    @classmethod
    def validate_question(cls, v: str) -> str:
        """Validate and sanitize question."""
        # Strip whitespace
        v = sanitize_text_input(v, max_length=2000)
        if not v:
            raise ValueError('Question cannot be empty or whitespace only')
        return v


class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    conversation_id: int
    message_id: int

"""Collection schemas."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)


class CollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    document_count: int = 0
    document_ids: List[int] = []
    created_at: datetime
    updated_at: datetime


class CollectionDocumentAdd(BaseModel):
    document_ids: List[int] = Field(..., min_length=1, max_length=100)

"""Document schemas."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.document import DocumentStatus
from app.utils.validators import sanitize_filename


class DocumentUpload(BaseModel):
    """Schema for document upload validation."""
    filename: Optional[str] = Field(None, max_length=255)

    @field_validator('filename')
    @classmethod
    def validate_filename(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize filename."""
        if v:
            return sanitize_filename(v)
        return v


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    status: DocumentStatus
    page_count: Optional[int] = None
    chunk_count: int
    created_at: datetime
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class DocumentList(BaseModel):
    documents: list[DocumentResponse]
    total: int


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete."""
    document_ids: List[int] = Field(..., min_length=1, max_length=100)


class BulkUploadResult(BaseModel):
    """Result for a single upload in bulk upload."""
    filename: str
    success: bool
    document: Optional[DocumentResponse] = None
    error: Optional[str] = None


class BulkUploadResponse(BaseModel):
    """Response model for bulk upload."""
    results: List[BulkUploadResult]
    total: int
    successful: int
    failed: int

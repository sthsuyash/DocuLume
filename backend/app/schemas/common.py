"""Common schemas for API responses."""

from typing import Optional, Any, Generic, TypeVar, List
from pydantic import BaseModel, Field


class Response(BaseModel):
    status: str = "success"
    data: Optional[Any] = None
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    details: Optional[Any] = None


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""

    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")


# Generic type for paginated response items
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""

    items: List[T]
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")

    @property
    def total_pages(self) -> int:
        """Calculate total number of pages."""
        return (self.total + self.page_size - 1) // self.page_size

    @property
    def has_next(self) -> bool:
        """Check if there is a next page."""
        return self.page < self.total_pages

    @property
    def has_previous(self) -> bool:
        """Check if there is a previous page."""
        return self.page > 1

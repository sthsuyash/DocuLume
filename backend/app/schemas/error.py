"""RFC 7807 Problem Details error schemas."""

from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class ProblemDetail(BaseModel):
    """RFC 7807 Problem Details for HTTP APIs.
    
    See: https://tools.ietf.org/html/rfc7807
    """
    
    type: str = Field(
        ...,
        description="URI reference identifying the problem type",
        example="https://api.doculume.com/errors/validation-error"
    )
    title: str = Field(
        ...,
        description="Short, human-readable summary of the problem",
        example="Validation Error"
    )
    status: int = Field(
        ...,
        description="HTTP status code",
        example=400
    )
    detail: str = Field(
        ...,
        description="Human-readable explanation specific to this occurrence",
        example="The 'email' field is required"
    )
    instance: str = Field(
        ...,
        description="URI reference to the specific occurrence of the problem",
        example="/api/v1/auth/register"
    )
    request_id: Optional[str] = Field(
        None,
        description="Request correlation ID for tracing",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="ISO 8601 timestamp of when the error occurred"
    )
    errors: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional error details (e.g., validation errors)",
        example={"email": ["Invalid email format"], "password": ["Too short"]}
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "https://api.doculume.com/errors/validation-error",
                "title": "Validation Error",
                "status": 400,
                "detail": "The request body contains invalid data",
                "instance": "/api/v1/auth/register",
                "request_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": "2026-03-02T10:00:00Z",
                "errors": {
                    "email": ["Invalid email format"],
                    "password": ["Must be at least 8 characters"]
                }
            }
        }

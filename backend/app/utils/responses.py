"""Response utility functions."""

from typing import Any, Optional
from fastapi.responses import JSONResponse
from app.schemas.common import Response, ErrorResponse


def success_response(
    data: Any = None,
    message: Optional[str] = None,
    status_code: int = 200
) -> JSONResponse:
    """Create a success response."""
    response = Response(status="success", data=data, message=message)
    return JSONResponse(content=response.model_dump(), status_code=status_code)


def error_response(
    message: str,
    details: Any = None,
    status_code: int = 400
) -> JSONResponse:
    """Create an error response."""
    response = ErrorResponse(status="error", message=message, details=details)
    return JSONResponse(content=response.model_dump(), status_code=status_code)

"""Global error handling middleware with RFC 7807 support."""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from app.utils.logger import logger
from app.exceptions import APIException
from app.schemas.error import ProblemDetail
from app.config import settings


async def handle_errors(request: Request, exc: Exception) -> JSONResponse:
    """Handle application errors using RFC 7807 Problem Details format."""

    # Get request ID if available
    request_id = getattr(request.state, "request_id", None)
    instance = str(request.url.path)

    # Handle custom API exceptions
    if isinstance(exc, APIException):
        logger.warning(f"API exception: {exc.detail}", extra={"request_id": request_id})
        problem = ProblemDetail(
            type=exc.type_uri,
            title=exc.title,
            status=exc.status_code,
            detail=exc.detail,
            instance=instance,
            request_id=request_id,
            errors=exc.errors
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=problem.model_dump(exclude_none=True),
            headers={"Content-Type": "application/problem+json"}
        )

    # Handle FastAPI HTTPException
    if isinstance(exc, HTTPException):
        logger.warning(f"HTTP exception: {exc.detail}", extra={"request_id": request_id})
        problem = ProblemDetail(
            type=f"https://api.doculume.com/errors/{exc.status_code}",
            title=get_status_title(exc.status_code),
            status=exc.status_code,
            detail=str(exc.detail),
            instance=instance,
            request_id=request_id
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=problem.model_dump(exclude_none=True),
            headers={"Content-Type": "application/problem+json"}
        )

    # Handle Pydantic validation errors
    if isinstance(exc, (RequestValidationError, ValidationError)):
        logger.warning(f"Validation error: {exc}", extra={"request_id": request_id})

        # Extract validation errors
        errors = {}
        if hasattr(exc, "errors"):
            for error in exc.errors():
                field = ".".join(str(loc) for loc in error["loc"])
                if field not in errors:
                    errors[field] = []
                errors[field].append(error["msg"])

        problem = ProblemDetail(
            type="https://api.doculume.com/errors/validation-error",
            title="Validation Error",
            status=422,
            detail="The request contains invalid data",
            instance=instance,
            request_id=request_id,
            errors=errors or None
        )
        return JSONResponse(
            status_code=422,
            content=problem.model_dump(exclude_none=True),
            headers={"Content-Type": "application/problem+json"}
        )

    # Handle database errors
    if isinstance(exc, SQLAlchemyError):
        logger.error(f"Database error: {str(exc)}", extra={"request_id": request_id})
        problem = ProblemDetail(
            type="https://api.doculume.com/errors/database-error",
            title="Database Error",
            status=500,
            detail="A database error occurred" if not settings.debug else str(exc),
            instance=instance,
            request_id=request_id
        )
        return JSONResponse(
            status_code=500,
            content=problem.model_dump(exclude_none=True),
            headers={"Content-Type": "application/problem+json"}
        )

    # Handle all other exceptions
    logger.error(f"Unhandled error: {str(exc)}", extra={"request_id": request_id}, exc_info=True)
    problem = ProblemDetail(
        type="https://api.doculume.com/errors/internal-server-error",
        title="Internal Server Error",
        status=500,
        detail="An unexpected error occurred" if not settings.debug else str(exc),
        instance=instance,
        request_id=request_id
    )
    return JSONResponse(
        status_code=500,
        content=problem.model_dump(exclude_none=True),
        headers={"Content-Type": "application/problem+json"}
    )


def get_status_title(status_code: int) -> str:
    """Get human-readable title for HTTP status code."""
    status_titles = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        409: "Conflict",
        422: "Unprocessable Entity",
        429: "Too Many Requests",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout"
    }
    return status_titles.get(status_code, "Error")

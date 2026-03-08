"""Custom exception classes with RFC 7807 support."""

from typing import Optional, Dict, Any


class APIException(Exception):
    """Base exception for API errors with RFC 7807 support."""
    
    def __init__(
        self,
        status_code: int,
        title: str,
        detail: str,
        type_uri: Optional[str] = None,
        errors: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.title = title
        self.detail = detail
        self.type_uri = type_uri or f"https://api.doculume.com/errors/{status_code}"
        self.errors = errors
        super().__init__(detail)


class ResourceNotFoundError(APIException):
    """Exception for when a requested resource is not found."""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            status_code=404,
            title="Resource Not Found",
            detail=f"{resource} with identifier '{identifier}' does not exist",
            type_uri="https://api.doculume.com/errors/not-found"
        )


class ValidationError(APIException):
    """Exception for validation errors."""
    
    def __init__(self, detail: str, errors: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=422,
            title="Validation Error",
            detail=detail,
            type_uri="https://api.doculume.com/errors/validation-error",
            errors=errors
        )


class AuthenticationError(APIException):
    """Exception for authentication failures."""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=401,
            title="Authentication Failed",
            detail=detail,
            type_uri="https://api.doculume.com/errors/authentication-failed"
        )


class AuthorizationError(APIException):
    """Exception for authorization failures."""
    
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=403,
            title="Forbidden",
            detail=detail,
            type_uri="https://api.doculume.com/errors/forbidden"
        )


class ConflictError(APIException):
    """Exception for resource conflicts."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=409,
            title="Conflict",
            detail=detail,
            type_uri="https://api.doculume.com/errors/conflict"
        )


class RateLimitError(APIException):
    """Exception for rate limit exceeded."""
    
    def __init__(self, detail: str = "Too many requests. Please try again later."):
        super().__init__(
            status_code=429,
            title="Rate Limit Exceeded",
            detail=detail,
            type_uri="https://api.doculume.com/errors/rate-limit-exceeded"
        )


class ServiceUnavailableError(APIException):
    """Exception for service unavailability."""
    
    def __init__(self, detail: str = "Service temporarily unavailable"):
        super().__init__(
            status_code=503,
            title="Service Unavailable",
            detail=detail,
            type_uri="https://api.doculume.com/errors/service-unavailable"
        )


class BadRequestError(APIException):
    """Exception for bad requests."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=400,
            title="Bad Request",
            detail=detail,
            type_uri="https://api.doculume.com/errors/bad-request"
        )

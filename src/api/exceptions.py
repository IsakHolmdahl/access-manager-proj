"""
Custom exception classes for the API.

These exceptions are raised by services and automatically converted to
appropriate HTTP responses by FastAPI exception handlers.
"""

from typing import Any


class APIException(Exception):
    """
    Base exception for all API errors.
    
    All custom exceptions should inherit from this class.
    """
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: dict[str, Any] | None = None
    ):
        """
        Initialize API exception.
        
        Args:
            message: Human-readable error message
            status_code: HTTP status code
            details: Optional additional error details
        """
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(APIException):
    """
    Exception raised when a requested resource is not found.
    
    Maps to HTTP 404 Not Found.
    
    Example:
        raise NotFoundException("User with id '123' not found")
    """
    
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, status_code=404, details=details)


class ConflictException(APIException):
    """
    Exception raised when a resource conflict occurs.
    
    Maps to HTTP 409 Conflict.
    Commonly used for duplicate resource creation.
    
    Example:
        raise ConflictException("Username 'john_doe' already exists")
    """
    
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, status_code=409, details=details)


class ValidationException(APIException):
    """
    Exception raised when business logic validation fails.
    
    Maps to HTTP 400 Bad Request.
    Note: This is different from Pydantic validation errors (422).
    
    Example:
        raise ValidationException("Cannot delete access that is currently assigned")
    """
    
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, status_code=400, details=details)


class UnauthorizedException(APIException):
    """
    Exception raised when authentication fails.
    
    Maps to HTTP 401 Unauthorized.
    
    Example:
        raise UnauthorizedException("Invalid admin key")
    """
    
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, status_code=401, details=details)


class ForbiddenException(APIException):
    """
    Exception raised when user lacks permission for the requested action.
    
    Maps to HTTP 403 Forbidden.
    
    Example:
        raise ForbiddenException("You can only access your own resources")
    """
    
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, status_code=403, details=details)

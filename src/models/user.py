"""
User Pydantic models for API request/response validation.

These models define the structure and validation rules for user-related
API operations.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


# ============================================================================
# Base Schema
# ============================================================================

class UserBase(BaseModel):
    """
    Shared user properties.
    
    Contains fields common to all user representations.
    """
    username: str = Field(
        min_length=3,
        max_length=50,
        pattern="^[a-zA-Z0-9_-]+$",
        description="Username (3-50 chars, alphanumeric with _ and -)"
    )


# ============================================================================
# Request Models (API Input)
# ============================================================================

class UserCreate(UserBase):
    """
    Schema for creating a new user (admin endpoint).
    
    Includes password for initial user creation.
    Password will be hashed before storage.
    """
    password: str = Field(
        min_length=8,
        max_length=128,
        description="Password (8-128 chars, will be hashed)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "john_doe",
                "password": "SecurePass123!"
            }
        }
    )


class UserUpdate(BaseModel):
    """
    Schema for updating user (optional fields).
    
    All fields are optional to allow partial updates.
    """
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=50,
        pattern="^[a-zA-Z0-9_-]+$",
        description="New username"
    )
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=128,
        description="New password (will be hashed)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "jane_doe",
                "password": "NewSecurePass456!"
            }
        }
    )


# ============================================================================
# Response Models (API Output)
# ============================================================================

class UserResponse(UserBase):
    """
    Public user information (no password).
    
    Returned by API endpoints. Never includes password or hash.
    """
    id: int
    created_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "john_doe",
                "created_at": "2026-02-06T10:30:00Z"
            }
        }
    )


class UserListResponse(BaseModel):
    """
    Paginated list of users.
    
    Includes total count for pagination.
    """
    users: list[UserResponse]
    total: int
    limit: int
    offset: int
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "users": [
                    {
                        "id": 1,
                        "username": "john_doe",
                        "created_at": "2026-02-06T10:30:00Z"
                    },
                    {
                        "id": 2,
                        "username": "jane_smith",
                        "created_at": "2026-02-06T11:00:00Z"
                    }
                ],
                "total": 25,
                "limit": 10,
                "offset": 0
            }
        }
    )


# ============================================================================
# Internal Models (Not Exposed in API)
# ============================================================================

class UserInDB(UserBase):
    """
    User as stored in database (with password hash).
    
    Internal model - never returned by API endpoints.
    Includes password_hash for authentication.
    """
    id: int
    password_hash: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

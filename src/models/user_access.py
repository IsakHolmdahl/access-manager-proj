"""
User-Access assignment models for API contracts.

Defines Pydantic models for the relationship between users and accesses,
including assignment tracking and access lists.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from src.models.access import AccessResponse


class UserAccessResponse(BaseModel):
    """Response for user-access assignment."""
    user_id: int
    access_id: int
    access_name: str
    assigned_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "user_id": 1,
                "access_id": 5,
                "access_name": "READ_DOCUMENTS",
                "assigned_at": "2026-02-05T14:30:00Z"
            }
        }
    )


class AccessListResponse(BaseModel):
    """Response containing list of accesses for a user."""
    user_id: int
    username: str
    accesses: list[AccessResponse]
    total_count: int
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "username": "john_doe",
                "accesses": [
                    {
                        "id": 5,
                        "name": "READ_DOCUMENTS",
                        "description": "Allows reading company documents",
                        "renewal_period": 90,
                        "created_at": "2026-01-15T10:00:00Z"
                    }
                ],
                "total_count": 1
            }
        }
    )


class AccessRequestByName(BaseModel):
    """User requests access by name (auto-approved)."""
    access_name: str = Field(
        min_length=1,
        max_length=100,
        description="Name of the access to request"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_name": "READ_DOCUMENTS"
            }
        }
    )


class AccessRevocationRequest(BaseModel):
    """Request to revoke access from a user."""
    access_id: int = Field(gt=0, description="ID of access to revoke")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_id": 5
            }
        }
    )

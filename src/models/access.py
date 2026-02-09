"""
Access models for API contracts.

Defines Pydantic models for access entities, including creation,
updates, and responses.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class AccessBase(BaseModel):
    """Shared access properties."""
    name: str = Field(
        min_length=1,
        max_length=100,
        pattern="^[A-Z_]+$",
        description="Uppercase access identifier (e.g., 'READ_DOCUMENTS')"
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Human-readable description of what the access grants"
    )
    renewal_period: Optional[int] = Field(
        None,
        ge=1,
        description="Days until renewal required (null = non-expiring)"
    )


class AccessCreate(AccessBase):
    """Schema for creating a new access (admin endpoint)."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "READ_DOCUMENTS",
                "description": "Allows reading company documents",
                "renewal_period": 90
            }
        }
    )


class AccessUpdate(BaseModel):
    """Schema for updating an access (optional fields)."""
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        pattern="^[A-Z_]+$"
    )
    description: Optional[str] = Field(None, max_length=1000)
    renewal_period: Optional[int] = Field(None, ge=1)


class AccessResponse(AccessBase):
    """Public access information."""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "READ_DOCUMENTS",
                "description": "Allows reading company documents",
                "renewal_period": 90,
                "created_at": "2026-02-05T10:30:00Z"
            }
        }
    )


class AccessInDB(AccessBase):
    """Access as stored in database."""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AccessPaginatedResponse(BaseModel):
    """Paginated list of accesses."""
    accesses: list[AccessResponse]
    total: int
    limit: int
    offset: int
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "accesses": [
                    {
                        "id": 1,
                        "name": "READ_DOCUMENTS",
                        "description": "Allows reading company documents",
                        "renewal_period": 90,
                        "created_at": "2026-02-05T10:30:00Z"
                    }
                ],
                "total": 10,
                "limit": 10,
                "offset": 0
            }
        }
    )

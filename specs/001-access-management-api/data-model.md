# Data Model: Access Management API

**Feature**: Access Management API  
**Branch**: `001-access-management-api`  
**Date**: 2026-02-05

## Overview

This document defines the data model for the Access Management API, including database schema, entity relationships, and Pydantic models for API contracts.

---

## Database Schema

### Tables

#### 1. Users Table

Stores user accounts that can be assigned accesses.

```sql
CREATE SEQUENCE users_id_seq START 1;

CREATE TABLE users (
    id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
    username VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (username)
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `username`: Unique username for authentication (NOT NULL)
- `password_hash`: Bcrypt-hashed password (NOT NULL)
- `created_at`: Timestamp of account creation

**Constraints:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `username` (prevents duplicate usernames)

**Indexes:**
- ART index on `id` (from PRIMARY KEY)
- ART index on `username` (from UNIQUE constraint)

---

#### 2. Accesses Table

Stores the catalog of available accesses that can be granted to users.

```sql
CREATE SEQUENCE accesses_id_seq START 1;

CREATE TABLE accesses (
    id INTEGER PRIMARY KEY DEFAULT nextval('accesses_id_seq'),
    name VARCHAR NOT NULL,
    description VARCHAR,
    renewal_period INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `name`: Unique access identifier/name (e.g., "READ_DOCUMENTS", "ADMIN_PANEL")
- `description`: Human-readable description of what the access grants (unlimited length)
- `renewal_period`: Number of days before access expires (NULL for non-expiring accesses)
- `created_at`: Timestamp when access was defined

**Constraints:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `name` (prevents duplicate access names)

**Nullable Fields:**
- `description`: Optional description
- `renewal_period`: NULL indicates non-expiring access

**Indexes:**
- ART index on `id` (from PRIMARY KEY)
- ART index on `name` (from UNIQUE constraint)

---

#### 3. User_Accesses Junction Table

Represents the many-to-many relationship between users and accesses. A user can have multiple accesses, and an access can be assigned to multiple users.

```sql
CREATE TABLE user_accesses (
    user_id INTEGER NOT NULL,
    access_id INTEGER NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, access_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (access_id) REFERENCES accesses(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_accesses_access_id ON user_accesses(access_id);
CREATE INDEX idx_user_accesses_assigned_at ON user_accesses(assigned_at);
```

**Columns:**
- `user_id`: Foreign key to users table
- `access_id`: Foreign key to accesses table
- `assigned_at`: Timestamp when access was granted

**Constraints:**
- Composite PRIMARY KEY on `(user_id, access_id)` (prevents duplicate assignments)
- FOREIGN KEY to `users(id)` with CASCADE delete
- FOREIGN KEY to `accesses(id)` with CASCADE delete

**Indexes:**
- Composite PRIMARY KEY creates ART index for user → accesses lookups
- `idx_user_accesses_access_id`: Optimizes access → users reverse lookups
- `idx_user_accesses_assigned_at`: Supports time-based queries (recent assignments)

**Referential Integrity:**
- `ON DELETE CASCADE`: When a user is deleted, all their access assignments are removed
- `ON DELETE CASCADE`: When an access is deleted, all user assignments are removed

---

## Entity Relationships

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│     Users       │         │   User_Accesses      │         │    Accesses     │
├─────────────────┤         ├──────────────────────┤         ├─────────────────┤
│ id (PK)         │◄───────┤ user_id (FK)         │         │ id (PK)         │
│ username (UQ)   │         │ access_id (FK)       ├────────►│ name (UQ)       │
│ password_hash   │         │ assigned_at          │         │ description     │
│ created_at      │         │ PK(user_id,access_id)│         │ renewal_period  │
└─────────────────┘         └──────────────────────┘         │ created_at      │
                                                              └─────────────────┘
```

**Relationship Type**: Many-to-Many
- One user can have multiple accesses
- One access can be assigned to multiple users
- Junction table `user_accesses` manages the relationship

---

## Pydantic Models

### User Models

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

# ============================================================================
# Base Schema
# ============================================================================

class UserBase(BaseModel):
    """Shared user properties"""
    username: str = Field(min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")

# ============================================================================
# Request Models (API Input)
# ============================================================================

class UserCreate(UserBase):
    """Schema for creating a new user (admin endpoint)"""
    password: str = Field(min_length=8, max_length=128)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "john_doe",
                "password": "SecurePass123!"
            }
        }
    )

class UserUpdate(BaseModel):
    """Schema for updating user (optional fields)"""
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    password: Optional[str] = Field(None, min_length=8, max_length=128)

# ============================================================================
# Response Models (API Output)
# ============================================================================

class UserResponse(UserBase):
    """Public user information (no password)"""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "john_doe",
                "created_at": "2026-02-05T10:30:00Z"
            }
        }
    )

class UserWithAccesses(UserResponse):
    """User with their assigned accesses"""
    accesses: list["AccessResponse"] = []

# ============================================================================
# Internal Models (Not Exposed in API)
# ============================================================================

class UserInDB(UserBase):
    """User as stored in database (with password hash)"""
    id: int
    password_hash: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

**Validation Rules:**
- `username`: 3-50 characters, alphanumeric with underscore and hyphen only
- `password`: 8-128 characters (will be hashed before storage)
- `UserResponse`: Never exposes password or password_hash
- `UserInDB`: Internal-only model with password_hash

---

### Access Models

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

# ============================================================================
# Base Schema
# ============================================================================

class AccessBase(BaseModel):
    """Shared access properties"""
    name: str = Field(min_length=1, max_length=100, pattern="^[A-Z_]+$")
    description: Optional[str] = Field(None, max_length=1000)
    renewal_period: Optional[int] = Field(None, ge=1, description="Days until renewal required (null = non-expiring)")

# ============================================================================
# Request Models (API Input)
# ============================================================================

class AccessCreate(AccessBase):
    """Schema for creating a new access (admin endpoint)"""
    
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
    """Schema for updating an access (optional fields)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, pattern="^[A-Z_]+$")
    description: Optional[str] = Field(None, max_length=1000)
    renewal_period: Optional[int] = Field(None, ge=1)

# ============================================================================
# Response Models (API Output)
# ============================================================================

class AccessResponse(AccessBase):
    """Public access information"""
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

class AccessWithUsers(AccessResponse):
    """Access with list of users who have it"""
    users: list[UserResponse] = []
```

**Validation Rules:**
- `name`: 1-100 characters, UPPERCASE with underscores only (e.g., "READ_DOCUMENTS")
- `description`: Optional, max 1000 characters
- `renewal_period`: Optional positive integer (days), null means non-expiring
- Consistent naming convention for access identifiers

---

### User Access Assignment Models

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# ============================================================================
# Request Models
# ============================================================================

class AccessAssignmentRequest(BaseModel):
    """Request to assign access to a user"""
    user_id: int = Field(gt=0)
    access_id: int = Field(gt=0)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "access_id": 5
            }
        }
    )

class AccessRequestByName(BaseModel):
    """User requests access by name (auto-approved)"""
    access_name: str = Field(min_length=1, max_length=100)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_name": "READ_DOCUMENTS"
            }
        }
    )

class AccessRevocationRequest(BaseModel):
    """Request to revoke access from a user"""
    access_id: int = Field(gt=0)

# ============================================================================
# Response Models
# ============================================================================

class UserAccessResponse(BaseModel):
    """Response for user-access assignment"""
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
    """Response containing list of accesses for a user"""
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
```

---

### Custom Query Models

```python
from pydantic import BaseModel, Field, ConfigDict
from typing import Any

class CustomQueryRequest(BaseModel):
    """Request to execute a custom SELECT query"""
    query: str = Field(min_length=1, max_length=5000, description="SELECT query to execute")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "SELECT name, COUNT(*) as user_count FROM accesses JOIN user_accesses ON accesses.id = user_accesses.access_id GROUP BY name"
            }
        }
    )

class CustomQueryResponse(BaseModel):
    """Response from custom query execution"""
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "columns": ["name", "user_count"],
                "rows": [
                    ["READ_DOCUMENTS", 5],
                    ["ADMIN_PANEL", 2]
                ],
                "row_count": 2
            }
        }
    )
```

---

### Error Models

```python
from pydantic import BaseModel
from typing import Optional, Dict, Any

class ErrorDetail(BaseModel):
    """Structured error response"""
    message: str
    type: str
    details: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "User with id '123' not found",
                "type": "NotFoundException",
                "details": {"resource": "User", "identifier": "123"}
            }
        }
    )

class ErrorResponse(BaseModel):
    """Standard error response wrapper"""
    error: ErrorDetail
```

---

## Validation Rules Summary

| Field | Validation | Rationale |
|-------|------------|-----------|
| `username` | 3-50 chars, alphanumeric + `_-` | Prevents injection, reasonable length |
| `password` | 8-128 chars | Security minimum, prevent DOS with huge passwords |
| `access.name` | 1-100 chars, UPPERCASE + `_` | Consistent naming convention |
| `description` | Max 1000 chars | Prevent abuse, reasonable for descriptions |
| `renewal_period` | Positive integer or null | Must be at least 1 day if specified |
| `query` | Max 5000 chars, SELECT only | Prevent abuse, security validation |

---

## Data Integrity Rules

1. **No Orphaned Records**: Foreign key constraints with CASCADE delete ensure cleanup
2. **No Duplicates**: UNIQUE constraints prevent duplicate usernames and access names
3. **No Duplicate Assignments**: Composite PK prevents assigning same access twice to one user
4. **Password Security**: Passwords are hashed with bcrypt before storage (never stored plaintext)
5. **Timestamp Tracking**: All entities have `created_at`, assignments have `assigned_at`

---

## Example Queries

### Get User with All Accesses

```sql
SELECT 
    u.id, u.username, u.created_at,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', a.id,
                'name', a.name,
                'description', a.description,
                'renewal_period', a.renewal_period,
                'assigned_at', ua.assigned_at
            )
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'
    ) as accesses
FROM users u
LEFT JOIN user_accesses ua ON u.id = ua.user_id
LEFT JOIN accesses a ON ua.access_id = a.id
WHERE u.id = ?
GROUP BY u.id, u.username, u.created_at;
```

### Check If User Has Specific Access

```sql
SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN user_accesses ua ON u.id = ua.user_id
    JOIN accesses a ON ua.access_id = a.id
    WHERE u.id = ? AND a.name = ?
) as has_access;
```

### Find Users with Expiring Accesses

```sql
SELECT 
    u.username,
    a.name as access_name,
    a.renewal_period,
    ua.assigned_at,
    ua.assigned_at + INTERVAL (a.renewal_period || ' days') as expires_at
FROM users u
JOIN user_accesses ua ON u.id = ua.user_id
JOIN accesses a ON ua.access_id = a.id
WHERE a.renewal_period IS NOT NULL
    AND ua.assigned_at + INTERVAL (a.renewal_period || ' days') < CURRENT_TIMESTAMP + INTERVAL '30 days'
ORDER BY expires_at ASC;
```

---

## Migration Strategy

### Initial Schema Setup

```python
# database/migrations/init_schema.sql

-- Create users table
CREATE SEQUENCE users_id_seq START 1;
CREATE TABLE users (
    id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
    username VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (username)
);

-- Create accesses table
CREATE SEQUENCE accesses_id_seq START 1;
CREATE TABLE accesses (
    id INTEGER PRIMARY KEY DEFAULT nextval('accesses_id_seq'),
    name VARCHAR NOT NULL,
    description VARCHAR,
    renewal_period INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
);

-- Create junction table
CREATE TABLE user_accesses (
    user_id INTEGER NOT NULL,
    access_id INTEGER NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, access_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (access_id) REFERENCES accesses(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_user_accesses_access_id ON user_accesses(access_id);
CREATE INDEX idx_user_accesses_assigned_at ON user_accesses(assigned_at);
```

### Seed Data (Optional)

```sql
-- Sample accesses
INSERT INTO accesses (name, description, renewal_period) VALUES
('READ_DOCUMENTS', 'View company documents', 90),
('WRITE_DOCUMENTS', 'Create and edit company documents', 90),
('DELETE_DOCUMENTS', 'Delete company documents', 30),
('ADMIN_PANEL', 'Access to administrative functions', NULL),
('USER_MANAGEMENT', 'Create, update, and delete users', NULL),
('APPROVE_INVOICES', 'Approve pending invoices', 60),
('VIEW_REPORTS', 'Access financial and operational reports', 180);

-- Sample admin user (password: admin123)
INSERT INTO users (username, password_hash) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5K0JW9Nx1gQya');

-- Assign all accesses to admin
INSERT INTO user_accesses (user_id, access_id)
SELECT 1, id FROM accesses;
```

---

## Notes

- All timestamps are in UTC
- Password hashing uses bcrypt with cost factor 12
- Nullable fields allow flexibility (descriptions, renewal periods)
- Indexes are minimal but targeted for high-selectivity queries
- Foreign key cascades simplify data cleanup
- Pydantic models provide strong API contract validation

This data model supports all functional requirements from the specification while maintaining data integrity and query performance.

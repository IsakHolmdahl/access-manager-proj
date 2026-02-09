"""
User management routes for admin operations.

Admin endpoints for creating, reading, updating, and deleting users.
All endpoints require admin authentication via X-Admin-Key header.
"""

from fastapi import APIRouter, Query, status
from typing import Annotated

from src.models.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from src.services.user_service import UserService
from src.api.dependencies import DatabaseDep, AdminDep


# Create router for user management
router = APIRouter()


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
    description="Create a new user account. Requires admin authentication.",
    responses={
        201: {"description": "User created successfully"},
        401: {"description": "Missing or invalid admin key"},
        409: {"description": "Username already exists"},
        422: {"description": "Invalid request data"}
    }
)
async def create_user(
    user: UserCreate,
    db: DatabaseDep,
    admin: AdminDep
) -> UserResponse:
    """
    Create a new user account.
    
    **Admin only**: Requires X-Admin-Key header.
    
    - **username**: 3-50 characters, alphanumeric with underscore and hyphen
    - **password**: 8-128 characters, will be hashed before storage
    
    Returns the created user without password information.
    """
    service = UserService(db)
    return service.create_user(user)


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List all users",
    description="Get a paginated list of all users. Requires admin authentication.",
    responses={
        200: {"description": "Users retrieved successfully"},
        401: {"description": "Missing or invalid admin key"},
        400: {"description": "Invalid pagination parameters"}
    }
)
async def list_users(
    db: DatabaseDep,
    admin: AdminDep,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum number of users to return")] = 10,
    offset: Annotated[int, Query(ge=0, description="Number of users to skip")] = 0
) -> UserListResponse:
    """
    List all users with pagination.
    
    **Admin only**: Requires X-Admin-Key header.
    
    - **limit**: Number of users per page (1-100, default: 10)
    - **offset**: Number of users to skip (default: 0)
    
    Returns list of users with total count for pagination.
    """
    service = UserService(db)
    return service.list_users(limit, offset)


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Get details of a specific user. Requires admin authentication.",
    responses={
        200: {"description": "User retrieved successfully"},
        401: {"description": "Missing or invalid admin key"},
        404: {"description": "User not found"}
    }
)
async def get_user(
    user_id: int,
    db: DatabaseDep,
    admin: AdminDep
) -> UserResponse:
    """
    Get a specific user by ID.
    
    **Admin only**: Requires X-Admin-Key header.
    
    Returns user details without password information.
    """
    service = UserService(db)
    return service.get_user(user_id)


@router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Update user",
    description="Update username and/or password for a user. Requires admin authentication.",
    responses={
        200: {"description": "User updated successfully"},
        401: {"description": "Missing or invalid admin key"},
        404: {"description": "User not found"},
        409: {"description": "New username already exists"},
        422: {"description": "Invalid request data"}
    }
)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: DatabaseDep,
    admin: AdminDep
) -> UserResponse:
    """
    Update an existing user.
    
    **Admin only**: Requires X-Admin-Key header.
    
    All fields are optional:
    - **username**: New username (3-50 chars, alphanumeric with _ and -)
    - **password**: New password (8-128 chars, will be hashed)
    
    Returns updated user without password information.
    """
    service = UserService(db)
    return service.update_user(user_id, user_update)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user",
    description="Delete a user and all their access assignments. Requires admin authentication.",
    responses={
        204: {"description": "User deleted successfully"},
        401: {"description": "Missing or invalid admin key"},
        404: {"description": "User not found"}
    }
)
async def delete_user(
    user_id: int,
    db: DatabaseDep,
    admin: AdminDep
) -> None:
    """
    Delete a user.
    
    **Admin only**: Requires X-Admin-Key header.
    
    **Warning**: This will also remove all access assignments for this user.
    This operation cannot be undone.
    """
    service = UserService(db)
    service.delete_user(user_id)

"""
FastAPI dependencies for database, settings, and authentication.

This module provides reusable dependencies that can be injected into route handlers.
"""

from typing import Annotated
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import APIKeyHeader
import duckdb

from src.config import Settings, get_settings
from src.database.connection import get_db


# ============================================================================
# Database and Settings Dependencies
# ============================================================================

def get_settings_dependency() -> Settings:
    """
    FastAPI dependency to inject application settings.
    
    Returns:
        Settings: Application settings instance
    """
    return get_settings()


SettingsDep = Annotated[Settings, Depends(get_settings_dependency)]
DatabaseDep = Annotated[duckdb.DuckDBPyConnection, Depends(get_db)]


# ============================================================================
# Admin Authentication
# ============================================================================

# Define the header-based API key security scheme
admin_key_header = APIKeyHeader(
    name="X-Admin-Key",
    description="Admin secret key for privileged operations",
    auto_error=False  # We'll handle errors manually for better messages
)


async def verify_admin_key(
    settings: SettingsDep,
    admin_key: str | None = Depends(admin_key_header)
) -> str:
    """
    Verify admin authentication via X-Admin-Key header.
    
    Args:
        settings: Application settings with admin secret key
        admin_key: Admin key from X-Admin-Key header
        
    Returns:
        str: The valid admin key
        
    Raises:
        HTTPException: 401 if key is missing or invalid
        
    Example:
        @app.post("/admin/users")
        async def create_user(
            admin: str = Depends(verify_admin_key)
        ):
            # Only reaches here if admin key is valid
            return {"message": "User created"}
    """
    if admin_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Admin-Key header. Admin authentication required.",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    if admin_key != settings.admin_secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key. Access denied.",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    return admin_key


AdminDep = Annotated[str, Depends(verify_admin_key)]


# ============================================================================
# User Authentication
# ============================================================================

async def get_current_username(
    x_username: str | None = Header(None, description="Username for authentication")
) -> str:
    """
    Get current user's username from X-Username header.
    
    This is a simplified authentication for POC. In production, this would
    verify the username against a session or JWT token.
    
    Args:
        x_username: Username from X-Username header
        
    Returns:
        str: The authenticated username
        
    Raises:
        HTTPException: 401 if X-Username header is missing
        
    Example:
        @app.get("/users/{user_id}/accesses")
        async def get_user_accesses(
            user_id: int,
            username: str = Depends(get_current_username)
        ):
            # Only reaches here if X-Username header is present
            return {"user_id": user_id, "username": username}
    """
    if x_username is None or x_username.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Username header. User authentication required.",
            headers={"WWW-Authenticate": "Username"}
        )
    
    return x_username.strip()


UsernameDep = Annotated[str, Depends(get_current_username)]


# ============================================================================
# Username Validation
# ============================================================================

async def validate_username_matches_user_id(
    user_id: int,
    username: UsernameDep,
    db: DatabaseDep
) -> str:
    """
    Validate that the authenticated username matches the user_id in the path.
    
    Ensures users can only access their own resources.
    
    Args:
        user_id: User ID from path parameter
        username: Authenticated username from X-Username header
        db: Database connection
        
    Returns:
        str: The validated username
        
    Raises:
        HTTPException: 403 if username doesn't match user_id
        HTTPException: 404 if user not found
        
    Example:
        @app.get("/users/{user_id}/accesses")
        async def get_user_accesses(
            user_id: int,
            username: str = Depends(validate_username_matches_user_id)
        ):
            # Only reaches here if username matches user_id
            return {"accesses": [...]}
    """
    # Fetch the user by ID
    result = db.execute(
        "SELECT username FROM users WHERE id = ?",
        [user_id]
    ).fetchone()
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found"
        )
    
    db_username = result[0]
    
    if db_username != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You can only access your own resources."
        )
    
    return username


ValidatedUsernameDep = Annotated[str, Depends(validate_username_matches_user_id)]

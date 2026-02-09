"""
User service for business logic and password management.

Handles user-related operations with password hashing and validation.
"""

import duckdb
import bcrypt
from typing import Optional

from src.models.user import UserCreate, UserUpdate, UserResponse, UserInDB, UserListResponse
from src.database.repositories.user_repository import UserRepository
from src.api.exceptions import NotFoundException, ValidationException


class UserService:
    """
    Service layer for user operations.
    
    Handles business logic, validation, and password management.
    """
    
    def __init__(self, db: duckdb.DuckDBPyConnection):
        """
        Initialize service with database connection.
        
        Args:
            db: DuckDB database connection
        """
        self.repository = UserRepository(db)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a plain-text password using bcrypt.
        
        Bcrypt has a 72-byte limit, so passwords are truncated if needed.
        
        Args:
            password: Plain-text password
            
        Returns:
            Hashed password string
        """
        # Bcrypt has a 72-byte limit - truncate if necessary
        password_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain-text password against a hashed password.
        
        Args:
            plain_password: Plain-text password to verify
            hashed_password: Hashed password to compare against
            
        Returns:
            True if password matches, False otherwise
        """
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    
    def create_user(self, user: UserCreate) -> UserResponse:
        """
        Create a new user with hashed password.
        
        Args:
            user: User creation data with plain-text password
            
        Returns:
            UserResponse with created user data (no password)
            
        Raises:
            ConflictException: If username already exists
        """
        # Hash the password
        password_hash = self.hash_password(user.password)
        
        # Create user in database
        user_in_db = self.repository.create(user, password_hash)
        
        # Return public user data (without password hash)
        return UserResponse(
            id=user_in_db.id,
            username=user_in_db.username,
            created_at=user_in_db.created_at
        )
    
    def get_user(self, user_id: int) -> UserResponse:
        """
        Get user by ID.
        
        Args:
            user_id: User ID to fetch
            
        Returns:
            UserResponse with user data
            
        Raises:
            NotFoundException: If user not found
        """
        user_in_db = self.repository.get(user_id)
        
        if user_in_db is None:
            raise NotFoundException(
                f"User with id '{user_id}' not found",
                details={"resource": "User", "id": user_id}
            )
        
        return UserResponse(
            id=user_in_db.id,
            username=user_in_db.username,
            created_at=user_in_db.created_at
        )
    
    def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        """
        Get user by username.
        
        Args:
            username: Username to search for
            
        Returns:
            UserResponse if found, None otherwise
        """
        user_in_db = self.repository.get_by_username(username)
        
        if user_in_db is None:
            return None
        
        return UserResponse(
            id=user_in_db.id,
            username=user_in_db.username,
            created_at=user_in_db.created_at
        )
    
    def list_users(self, limit: int = 10, offset: int = 0) -> UserListResponse:
        """
        List users with pagination.
        
        Args:
            limit: Maximum number of users to return (default: 10, max: 100)
            offset: Number of users to skip (default: 0)
            
        Returns:
            UserListResponse with users and pagination info
            
        Raises:
            ValidationException: If pagination parameters are invalid
        """
        # Validate pagination parameters
        if limit < 1 or limit > 100:
            raise ValidationException(
                "Limit must be between 1 and 100",
                details={"field": "limit", "value": limit}
            )
        
        if offset < 0:
            raise ValidationException(
                "Offset must be non-negative",
                details={"field": "offset", "value": offset}
            )
        
        # Fetch users
        users_in_db, total = self.repository.get_multi(limit, offset)
        
        # Convert to response models
        users = [
            UserResponse(
                id=user.id,
                username=user.username,
                created_at=user.created_at
            )
            for user in users_in_db
        ]
        
        return UserListResponse(
            users=users,
            total=total,
            limit=limit,
            offset=offset
        )
    
    def update_user(self, user_id: int, user_update: UserUpdate) -> UserResponse:
        """
        Update an existing user.
        
        Args:
            user_id: ID of user to update
            user_update: Fields to update (optional username and/or password)
            
        Returns:
            UserResponse with updated user data
            
        Raises:
            NotFoundException: If user not found
            ConflictException: If new username already exists
        """
        # Hash new password if provided
        password_hash = None
        if user_update.password:
            password_hash = self.hash_password(user_update.password)
        
        # Update user in database
        user_in_db = self.repository.update(user_id, user_update, password_hash)
        
        return UserResponse(
            id=user_in_db.id,
            username=user_in_db.username,
            created_at=user_in_db.created_at
        )
    
    def delete_user(self, user_id: int) -> None:
        """
        Delete a user.
        
        Also removes all access assignments for this user.
        
        Args:
            user_id: ID of user to delete
            
        Raises:
            NotFoundException: If user not found
        """
        self.repository.delete(user_id)

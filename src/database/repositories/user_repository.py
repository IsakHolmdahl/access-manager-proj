"""
User repository for database operations.

Handles all user-related database queries using the repository pattern.
"""

import duckdb
from typing import Optional
from datetime import datetime

from src.models.user import UserInDB, UserCreate, UserUpdate
from src.api.exceptions import NotFoundException, ConflictException


class UserRepository:
    """
    Repository for user data access.
    
    Provides CRUD operations for users table.
    """
    
    def __init__(self, db: duckdb.DuckDBPyConnection):
        """
        Initialize repository with database connection.
        
        Args:
            db: DuckDB database connection
        """
        self.db = db
    
    def get(self, user_id: int) -> Optional[UserInDB]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID to fetch
            
        Returns:
            UserInDB if found, None otherwise
        """
        result = self.db.execute(
            "SELECT id, username, password_hash, created_at FROM users WHERE id = ?",
            [user_id]
        ).fetchone()
        
        if result is None:
            return None
        
        return UserInDB(
            id=result[0],
            username=result[1],
            password_hash=result[2],
            created_at=result[3]
        )
    
    def get_by_username(self, username: str) -> Optional[UserInDB]:
        """
        Get user by username.
        
        Args:
            username: Username to search for
            
        Returns:
            UserInDB if found, None otherwise
        """
        result = self.db.execute(
            "SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
            [username]
        ).fetchone()
        
        if result is None:
            return None
        
        return UserInDB(
            id=result[0],
            username=result[1],
            password_hash=result[2],
            created_at=result[3]
        )
    
    def get_multi(self, limit: int = 10, offset: int = 0) -> tuple[list[UserInDB], int]:
        """
        Get multiple users with pagination.
        
        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip
            
        Returns:
            Tuple of (list of UserInDB, total count)
        """
        # Get total count
        total = self.db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        
        # Get paginated results
        results = self.db.execute(
            """
            SELECT id, username, password_hash, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            [limit, offset]
        ).fetchall()
        
        users = [
            UserInDB(
                id=row[0],
                username=row[1],
                password_hash=row[2],
                created_at=row[3]
            )
            for row in results
        ]
        
        return users, total
    
    def create(self, user: UserCreate, password_hash: str) -> UserInDB:
        """
        Create a new user.
        
        Args:
            user: User creation data
            password_hash: Hashed password
            
        Returns:
            Created UserInDB
            
        Raises:
            ConflictException: If username already exists
        """
        # Check if username already exists
        existing = self.get_by_username(user.username)
        if existing is not None:
            raise ConflictException(
                f"Username '{user.username}' already exists",
                details={"field": "username", "value": user.username}
            )
        
        # Insert new user
        result = self.db.execute(
            """
            INSERT INTO users (username, password_hash, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            RETURNING id, username, password_hash, created_at
            """,
            [user.username, password_hash]
        ).fetchone()
        
        self.db.commit()
        
        return UserInDB(
            id=result[0],
            username=result[1],
            password_hash=result[2],
            created_at=result[3]
        )
    
    def update(self, user_id: int, user_update: UserUpdate, password_hash: Optional[str] = None) -> UserInDB:
        """
        Update an existing user.
        
        Args:
            user_id: ID of user to update
            user_update: Fields to update
            password_hash: New password hash (if password is being updated)
            
        Returns:
            Updated UserInDB
            
        Raises:
            NotFoundException: If user not found
            ConflictException: If new username already exists
        """
        # Check if user exists
        existing_user = self.get(user_id)
        if existing_user is None:
            raise NotFoundException(
                f"User with id '{user_id}' not found",
                details={"resource": "User", "id": user_id}
            )
        
        # Check if new username conflicts with another user
        update_data = user_update.model_dump(exclude_unset=True)
        
        if "username" in update_data and update_data["username"] != existing_user.username:
            conflicting_user = self.get_by_username(update_data["username"])
            if conflicting_user is not None:
                raise ConflictException(
                    f"Username '{update_data['username']}' already exists",
                    details={"field": "username", "value": update_data["username"]}
                )
        
        # Build dynamic UPDATE query
        updates = []
        params = []
        
        if "username" in update_data:
            updates.append("username = ?")
            params.append(update_data["username"])
        
        if password_hash:
            updates.append("password_hash = ?")
            params.append(password_hash)
        
        if not updates:
            # No updates requested, return existing user
            return existing_user
        
        # Add user_id to params
        params.append(user_id)
        
        # Execute update
        query = f"""
            UPDATE users
            SET {", ".join(updates)}
            WHERE id = ?
            RETURNING id, username, password_hash, created_at
        """
        
        result = self.db.execute(query, params).fetchone()
        self.db.commit()
        
        return UserInDB(
            id=result[0],
            username=result[1],
            password_hash=result[2],
            created_at=result[3]
        )
    
    def delete(self, user_id: int) -> None:
        """
        Delete a user.
        
        Also deletes all user_accesses entries for this user
        (manual cleanup since DuckDB doesn't support CASCADE).
        
        Args:
            user_id: ID of user to delete
            
        Raises:
            NotFoundException: If user not found
        """
        # Check if user exists
        existing_user = self.get(user_id)
        if existing_user is None:
            raise NotFoundException(
                f"User with id '{user_id}' not found",
                details={"resource": "User", "id": user_id}
            )
        
        # Manually delete user_accesses (CASCADE not supported in DuckDB)
        self.db.execute(
            "DELETE FROM user_accesses WHERE user_id = ?",
            [user_id]
        )
        
        # Delete user
        self.db.execute(
            "DELETE FROM users WHERE id = ?",
            [user_id]
        )
        
        self.db.commit()

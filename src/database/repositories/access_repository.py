"""
Access repository for database operations.

Handles CRUD operations for accesses and user-access assignments.
"""

import duckdb
from typing import Optional
from datetime import datetime

from src.models.access import AccessCreate, AccessUpdate, AccessInDB
from src.models.user import UserInDB
from src.api.exceptions import NotFoundException, ConflictException


class AccessRepository:
    """
    Repository for access data operations.
    
    Handles database queries for the accesses table and user_accesses junction table.
    """
    
    def __init__(self, db: duckdb.DuckDBPyConnection):
        """
        Initialize repository with database connection.
        
        Args:
            db: DuckDB database connection
        """
        self.db = db
    
    def get(self, access_id: int) -> Optional[AccessInDB]:
        """
        Get access by ID.
        
        Args:
            access_id: Access ID to fetch
            
        Returns:
            AccessInDB if found, None otherwise
        """
        result = self.db.execute(
            "SELECT id, name, description, renewal_period, created_at "
            "FROM accesses WHERE id = ?",
            [access_id]
        ).fetchone()
        
        if result is None:
            return None
        
        return AccessInDB(
            id=result[0],
            name=result[1],
            description=result[2],
            renewal_period=result[3],
            created_at=result[4]
        )
    
    def get_by_name(self, name: str) -> Optional[AccessInDB]:
        """
        Get access by name.
        
        Args:
            name: Access name to search for
            
        Returns:
            AccessInDB if found, None otherwise
        """
        result = self.db.execute(
            "SELECT id, name, description, renewal_period, created_at "
            "FROM accesses WHERE name = ?",
            [name]
        ).fetchone()
        
        if result is None:
            return None
        
        return AccessInDB(
            id=result[0],
            name=result[1],
            description=result[2],
            renewal_period=result[3],
            created_at=result[4]
        )
    
    def get_multi(self, limit: int = 10, offset: int = 0) -> tuple[list[AccessInDB], int]:
        """
        Get multiple accesses with pagination.
        
        Args:
            limit: Maximum number of accesses to return
            offset: Number of accesses to skip
            
        Returns:
            Tuple of (list of accesses, total count)
        """
        # Get total count
        total_result = self.db.execute("SELECT COUNT(*) FROM accesses").fetchone()
        total = total_result[0] if total_result else 0
        
        # Get paginated results
        results = self.db.execute(
            "SELECT id, name, description, renewal_period, created_at "
            "FROM accesses "
            "ORDER BY created_at DESC, id DESC "
            "LIMIT ? OFFSET ?",
            [limit, offset]
        ).fetchall()
        
        accesses = [
            AccessInDB(
                id=row[0],
                name=row[1],
                description=row[2],
                renewal_period=row[3],
                created_at=row[4]
            )
            for row in results
        ]
        
        return accesses, total
    
    def get_user_accesses(self, user_id: int) -> list[AccessInDB]:
        """
        Get all accesses assigned to a user.
        
        Args:
            user_id: User ID to fetch accesses for
            
        Returns:
            List of AccessInDB objects assigned to the user
        """
        results = self.db.execute(
            "SELECT a.id, a.name, a.description, a.renewal_period, a.created_at "
            "FROM accesses a "
            "JOIN user_accesses ua ON a.id = ua.access_id "
            "WHERE ua.user_id = ? "
            "ORDER BY a.name ASC",
            [user_id]
        ).fetchall()
        
        return [
            AccessInDB(
                id=row[0],
                name=row[1],
                description=row[2],
                renewal_period=row[3],
                created_at=row[4]
            )
            for row in results
        ]
    
    def create(self, access: AccessCreate) -> AccessInDB:
        """
        Create a new access.
        
        Args:
            access: Access creation data
            
        Returns:
            AccessInDB with created access data
            
        Raises:
            ConflictException: If access name already exists
        """
        # Check for duplicate name
        existing = self.get_by_name(access.name)
        if existing:
            raise ConflictException(
                f"Access with name '{access.name}' already exists",
                details={"field": "name", "value": access.name}
            )
        
        # Insert access
        result = self.db.execute(
            "INSERT INTO accesses (name, description, renewal_period) "
            "VALUES (?, ?, ?) "
            "RETURNING id, name, description, renewal_period, created_at",
            [access.name, access.description, access.renewal_period]
        ).fetchone()
        
        return AccessInDB(
            id=result[0],
            name=result[1],
            description=result[2],
            renewal_period=result[3],
            created_at=result[4]
        )
    
    def update(self, access_id: int, access_update: AccessUpdate) -> AccessInDB:
        """
        Update an existing access.
        
        Args:
            access_id: ID of access to update
            access_update: Fields to update
            
        Returns:
            AccessInDB with updated access data
            
        Raises:
            NotFoundException: If access not found
            ConflictException: If new name already exists
        """
        # Check if access exists
        existing = self.get(access_id)
        if not existing:
            raise NotFoundException(
                f"Access with id '{access_id}' not found",
                details={"resource": "Access", "id": access_id}
            )
        
        # Check for duplicate name if updating name
        if access_update.name and access_update.name != existing.name:
            name_conflict = self.get_by_name(access_update.name)
            if name_conflict:
                raise ConflictException(
                    f"Access with name '{access_update.name}' already exists",
                    details={"field": "name", "value": access_update.name}
                )
        
        # Build update query dynamically
        # Use model_dump(exclude_unset=True) to only get fields that were explicitly set
        update_data = access_update.model_dump(exclude_unset=True)
        
        if not update_data:
            # No fields to update, return existing
            return existing
        
        update_fields = []
        params = []
        
        if "name" in update_data:
            update_fields.append("name = ?")
            params.append(update_data["name"])
        
        if "description" in update_data:
            update_fields.append("description = ?")
            params.append(update_data["description"])
        
        if "renewal_period" in update_data:
            update_fields.append("renewal_period = ?")
            params.append(update_data["renewal_period"])
        
        params.append(access_id)
        
        # Execute update (DuckDB has issues with RETURNING when foreign keys are present)
        self.db.execute(
            f"UPDATE accesses SET {', '.join(update_fields)} WHERE id = ?",
            params
        )
        
        # Fetch the updated record
        result = self.db.execute(
            "SELECT id, name, description, renewal_period, created_at FROM accesses WHERE id = ?",
            [access_id]
        ).fetchone()
        
        return AccessInDB(
            id=result[0],
            name=result[1],
            description=result[2],
            renewal_period=result[3],
            created_at=result[4]
        )
    
    def delete(self, access_id: int) -> None:
        """
        Delete an access.
        
        Also removes all user assignments for this access (manual CASCADE).
        
        Args:
            access_id: ID of access to delete
            
        Raises:
            NotFoundException: If access not found
        """
        # Check if access exists
        existing = self.get(access_id)
        if not existing:
            raise NotFoundException(
                f"Access with id '{access_id}' not found",
                details={"resource": "Access", "id": access_id}
            )
        
        # Delete user_accesses assignments (manual CASCADE)
        self.db.execute(
            "DELETE FROM user_accesses WHERE access_id = ?",
            [access_id]
        )
        
        # Delete access
        self.db.execute("DELETE FROM accesses WHERE id = ?", [access_id])
    
    def assign_access_to_user(self, user_id: int, access_id: int) -> datetime:
        """
        Assign an access to a user.
        
        Args:
            user_id: User ID to assign access to
            access_id: Access ID to assign
            
        Returns:
            Timestamp when access was assigned
            
        Raises:
            ConflictException: If access already assigned to user
        """
        # Check if already assigned
        existing = self.db.execute(
            "SELECT assigned_at FROM user_accesses WHERE user_id = ? AND access_id = ?",
            [user_id, access_id]
        ).fetchone()
        
        if existing:
            raise ConflictException(
                f"Access already assigned to user",
                details={"user_id": user_id, "access_id": access_id}
            )
        
        # Insert assignment
        result = self.db.execute(
            "INSERT INTO user_accesses (user_id, access_id) "
            "VALUES (?, ?) "
            "RETURNING assigned_at",
            [user_id, access_id]
        ).fetchone()
        
        return result[0]
    
    def remove_access_from_user(self, user_id: int, access_id: int) -> None:
        """
        Remove an access from a user.
        
        Args:
            user_id: User ID to remove access from
            access_id: Access ID to remove
            
        Raises:
            NotFoundException: If access not assigned to user
        """
        # Check if assigned
        existing = self.db.execute(
            "SELECT 1 FROM user_accesses WHERE user_id = ? AND access_id = ?",
            [user_id, access_id]
        ).fetchone()
        
        if not existing:
            raise NotFoundException(
                f"Access not assigned to user",
                details={"user_id": user_id, "access_id": access_id}
            )
        
        # Delete assignment
        self.db.execute(
            "DELETE FROM user_accesses WHERE user_id = ? AND access_id = ?",
            [user_id, access_id]
        )

"""
Access service for business logic.

Handles access-related operations with validation.
"""

import duckdb
from typing import Optional

from src.models.access import AccessCreate, AccessUpdate, AccessResponse, AccessPaginatedResponse
from src.models.user_access import AccessListResponse
from src.database.repositories.access_repository import AccessRepository
from src.database.repositories.user_repository import UserRepository
from src.api.exceptions import NotFoundException, ValidationException


class AccessService:
    """
    Service layer for access operations.
    
    Handles business logic and validation for access catalog and user assignments.
    """
    
    def __init__(self, db: duckdb.DuckDBPyConnection):
        """
        Initialize service with database connection.
        
        Args:
            db: DuckDB database connection
        """
        self.access_repo = AccessRepository(db)
        self.user_repo = UserRepository(db)
    
    def get_access(self, access_id: int) -> AccessResponse:
        """
        Get access by ID.
        
        Args:
            access_id: Access ID to fetch
            
        Returns:
            AccessResponse with access data
            
        Raises:
            NotFoundException: If access not found
        """
        access_in_db = self.access_repo.get(access_id)
        
        if access_in_db is None:
            raise NotFoundException(
                f"Access with id '{access_id}' not found",
                details={"resource": "Access", "id": access_id}
            )
        
        return AccessResponse(
            id=access_in_db.id,
            name=access_in_db.name,
            description=access_in_db.description,
            renewal_period=access_in_db.renewal_period,
            created_at=access_in_db.created_at
        )
    
    def get_access_by_name(self, name: str) -> Optional[AccessResponse]:
        """
        Get access by name.
        
        Args:
            name: Access name to search for
            
        Returns:
            AccessResponse if found, None otherwise
        """
        access_in_db = self.access_repo.get_by_name(name)
        
        if access_in_db is None:
            return None
        
        return AccessResponse(
            id=access_in_db.id,
            name=access_in_db.name,
            description=access_in_db.description,
            renewal_period=access_in_db.renewal_period,
            created_at=access_in_db.created_at
        )
    
    def list_accesses(self, limit: int = 10, offset: int = 0) -> AccessPaginatedResponse:
        """
        List accesses with pagination.
        
        Args:
            limit: Maximum number of accesses to return (default: 10, max: 100)
            offset: Number of accesses to skip (default: 0)
            
        Returns:
            AccessPaginatedResponse with accesses and pagination info
            
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
        
        # Fetch accesses
        accesses_in_db, total = self.access_repo.get_multi(limit, offset)
        
        # Convert to response models
        accesses = [
            AccessResponse(
                id=access.id,
                name=access.name,
                description=access.description,
                renewal_period=access.renewal_period,
                created_at=access.created_at
            )
            for access in accesses_in_db
        ]
        
        return AccessPaginatedResponse(
            accesses=accesses,
            total=total,
            limit=limit,
            offset=offset
        )
    
    def get_user_accesses(self, user_id: int) -> AccessListResponse:
        """
        Get all accesses assigned to a user.
        
        Args:
            user_id: User ID to fetch accesses for
            
        Returns:
            AccessListResponse with user info and their accesses
            
        Raises:
            NotFoundException: If user not found
        """
        # Check if user exists
        user_in_db = self.user_repo.get(user_id)
        if user_in_db is None:
            raise NotFoundException(
                f"User with id '{user_id}' not found",
                details={"resource": "User", "id": user_id}
            )
        
        # Fetch user's accesses
        accesses_in_db = self.access_repo.get_user_accesses(user_id)
        
        # Convert to response models
        accesses = [
            AccessResponse(
                id=access.id,
                name=access.name,
                description=access.description,
                renewal_period=access.renewal_period,
                created_at=access.created_at
            )
            for access in accesses_in_db
        ]
        
        return AccessListResponse(
            user_id=user_in_db.id,
            username=user_in_db.username,
            accesses=accesses,
            total_count=len(accesses)
        )
    
    def create_access(self, access: AccessCreate) -> AccessResponse:
        """
        Create a new access.
        
        Args:
            access: Access creation data
            
        Returns:
            AccessResponse with created access data
            
        Raises:
            ConflictException: If access name already exists
        """
        access_in_db = self.access_repo.create(access)
        
        return AccessResponse(
            id=access_in_db.id,
            name=access_in_db.name,
            description=access_in_db.description,
            renewal_period=access_in_db.renewal_period,
            created_at=access_in_db.created_at
        )
    
    def update_access(self, access_id: int, access_update: AccessUpdate) -> AccessResponse:
        """
        Update an existing access.
        
        Args:
            access_id: ID of access to update
            access_update: Fields to update
            
        Returns:
            AccessResponse with updated access data
            
        Raises:
            NotFoundException: If access not found
            ConflictException: If new name already exists
        """
        access_in_db = self.access_repo.update(access_id, access_update)
        
        return AccessResponse(
            id=access_in_db.id,
            name=access_in_db.name,
            description=access_in_db.description,
            renewal_period=access_in_db.renewal_period,
            created_at=access_in_db.created_at
        )
    
    def delete_access(self, access_id: int) -> None:
        """
        Delete an access.
        
        Also removes all user assignments for this access.
        
        Args:
            access_id: ID of access to delete
            
        Raises:
            NotFoundException: If access not found
        """
        self.access_repo.delete(access_id)
    
    def remove_user_access(self, user_id: int, access_id: int) -> None:
        """
        Remove an access from a user.
        
        Validates that both user and access exist before removal.
        
        Args:
            user_id: User ID to remove access from
            access_id: Access ID to remove
            
        Raises:
            NotFoundException: If user not found, access not found, or access not assigned
        """
        # Check if user exists
        user_in_db = self.user_repo.get(user_id)
        if user_in_db is None:
            raise NotFoundException(
                f"User with id '{user_id}' not found",
                details={"resource": "User", "id": user_id}
            )
        
        # Check if access exists
        access_in_db = self.access_repo.get(access_id)
        if access_in_db is None:
            raise NotFoundException(
                f"Access with id '{access_id}' not found",
                details={"resource": "Access", "id": access_id}
            )
        
        # Remove the assignment (repository will raise NotFoundException if not assigned)
        self.access_repo.remove_access_from_user(user_id, access_id)
    
    def request_user_access(self, user_id: int, access_name: str) -> AccessResponse:
        """
        Request an access for a user by access name.
        
        Auto-approves the request and immediately assigns the access.
        
        Args:
            user_id: User ID to request access for
            access_name: Name of the access to request
            
        Returns:
            AccessResponse with the granted access data
            
        Raises:
            NotFoundException: If user not found or access name not found
            ConflictException: If access already assigned to user
        """
        # Check if user exists
        user_in_db = self.user_repo.get(user_id)
        if user_in_db is None:
            raise NotFoundException(
                f"User with id '{user_id}' not found",
                details={"resource": "User", "id": user_id}
            )
        
        # Check if access exists by name
        access_in_db = self.access_repo.get_by_name(access_name)
        if access_in_db is None:
            raise NotFoundException(
                f"Access with name '{access_name}' not found",
                details={"resource": "Access", "name": access_name}
            )
        
        # Assign the access (repository will raise ConflictException if already assigned)
        self.access_repo.assign_access_to_user(user_id, access_in_db.id)
        
        return AccessResponse(
            id=access_in_db.id,
            name=access_in_db.name,
            description=access_in_db.description,
            renewal_period=access_in_db.renewal_period,
            created_at=access_in_db.created_at
        )

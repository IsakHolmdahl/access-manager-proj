"""
Access catalog routes for administrators.

Provides endpoints for viewing and managing the access catalog.
"""

from fastapi import APIRouter, Depends, Query, status
from typing import Annotated
import duckdb

from src.models.access import AccessResponse, AccessPaginatedResponse, AccessCreate, AccessUpdate
from src.services.access_service import AccessService
from src.api.dependencies import get_db, verify_admin_key

router = APIRouter(
    prefix="/admin/accesses",
    tags=["Admin - Access Catalog"]
)


def get_access_service(db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)]) -> AccessService:
    """Dependency to get AccessService instance."""
    return AccessService(db)


@router.get(
    "",
    response_model=AccessPaginatedResponse,
    status_code=status.HTTP_200_OK,
    summary="List all accesses",
    description="Retrieve a paginated list of all available accesses in the catalog. Requires admin authentication.",
    dependencies=[Depends(verify_admin_key)]
)
async def list_accesses(
    service: Annotated[AccessService, Depends(get_access_service)],
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum number of accesses to return")] = 10,
    offset: Annotated[int, Query(ge=0, description="Number of accesses to skip")] = 0
) -> AccessPaginatedResponse:
    """
    List all accesses with pagination.
    
    **Authentication**: Requires X-Admin-Key header
    
    **Query Parameters**:
    - `limit`: Maximum number of accesses to return (1-100, default: 10)
    - `offset`: Number of accesses to skip (default: 0)
    
    **Returns**: Paginated list of accesses with total count
    """
    return service.list_accesses(limit=limit, offset=offset)


@router.get(
    "/{access_id}",
    response_model=AccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Get access by ID",
    description="Retrieve detailed information about a specific access. Requires admin authentication.",
    dependencies=[Depends(verify_admin_key)]
)
async def get_access(
    access_id: int,
    service: Annotated[AccessService, Depends(get_access_service)]
) -> AccessResponse:
    """
    Get access by ID.
    
    **Authentication**: Requires X-Admin-Key header
    
    **Path Parameters**:
    - `access_id`: ID of the access to retrieve
    
    **Returns**: Access details
    
    **Raises**:
    - `404 Not Found`: If access does not exist
    """
    return service.get_access(access_id)


@router.post(
    "",
    response_model=AccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new access",
    description="Create a new access definition in the catalog. Requires admin authentication.",
    dependencies=[Depends(verify_admin_key)]
)
async def create_access(
    access: AccessCreate,
    service: Annotated[AccessService, Depends(get_access_service)]
) -> AccessResponse:
    """
    Create a new access.
    
    **Authentication**: Requires X-Admin-Key header
    
    **Request Body**:
    - `name`: Unique name for the access (e.g., "READ_DOCUMENTS")
    - `description`: Description of what this access allows
    - `renewal_period`: Optional renewal period in days (null for non-expiring)
    
    **Returns**: Created access details with 201 status
    
    **Raises**:
    - `409 Conflict`: If access name already exists
    """
    return service.create_access(access)


@router.patch(
    "/{access_id}",
    response_model=AccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Update access",
    description="Update an existing access definition. Requires admin authentication.",
    dependencies=[Depends(verify_admin_key)]
)
async def update_access(
    access_id: int,
    access_update: AccessUpdate,
    service: Annotated[AccessService, Depends(get_access_service)]
) -> AccessResponse:
    """
    Update an existing access.
    
    **Authentication**: Requires X-Admin-Key header
    
    **Path Parameters**:
    - `access_id`: ID of the access to update
    
    **Request Body** (all fields optional):
    - `name`: New name for the access
    - `description`: New description
    - `renewal_period`: New renewal period in days (or null)
    
    **Returns**: Updated access details
    
    **Raises**:
    - `404 Not Found`: If access does not exist
    - `409 Conflict`: If new name already exists
    """
    return service.update_access(access_id, access_update)


@router.delete(
    "/{access_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete access",
    description="Delete an access definition from the catalog. Also removes all user assignments. Requires admin authentication.",
    dependencies=[Depends(verify_admin_key)]
)
async def delete_access(
    access_id: int,
    service: Annotated[AccessService, Depends(get_access_service)]
) -> None:
    """
    Delete an access.
    
    **Authentication**: Requires X-Admin-Key header
    
    **Path Parameters**:
    - `access_id`: ID of the access to delete
    
    **Returns**: 204 No Content on success
    
    **Raises**:
    - `404 Not Found`: If access does not exist
    
    **Note**: This will also remove all user assignments for this access.
    """
    service.delete_access(access_id)

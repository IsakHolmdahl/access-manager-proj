"""
User access routes for viewing assigned accesses.

Provides endpoints for users to view their own access assignments.
"""

from fastapi import APIRouter, Depends, status
from typing import Annotated
import duckdb

from src.models.user_access import AccessListResponse, AccessRequestByName
from src.models.access import AccessResponse
from src.services.access_service import AccessService
from src.api.dependencies import get_db, get_current_username
from src.api.exceptions import ForbiddenException

router = APIRouter(
    prefix="/users",
    tags=["User - My Accesses"]
)


def get_access_service(db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)]) -> AccessService:
    """Dependency to get AccessService instance."""
    return AccessService(db)


@router.get(
    "/{user_id}/accesses",
    response_model=AccessListResponse,
    status_code=status.HTTP_200_OK,
    summary="View my accesses",
    description="Retrieve all accesses assigned to the authenticated user. Users can only view their own accesses."
)
async def get_user_accesses(
    user_id: int,
    username: Annotated[str, Depends(get_current_username)],
    service: Annotated[AccessService, Depends(get_access_service)]
) -> AccessListResponse:
    """
    Get all accesses assigned to a user.
    
    **Authentication**: Requires X-Username header
    
    **Authorization**: Users can only view their own accesses. The username in the 
    X-Username header must match the username of the user_id in the path.
    
    **Path Parameters**:
    - `user_id`: ID of the user whose accesses to retrieve
    
    **Returns**: User information with list of assigned accesses
    
    **Raises**:
    - `403 Forbidden`: If username doesn't match the requested user_id
    - `404 Not Found`: If user does not exist
    """
    # Fetch user accesses (this will validate user exists)
    access_list = service.get_user_accesses(user_id)
    
    # Validate that the authenticated username matches the requested user
    if access_list.username != username:
        raise ForbiddenException(
            f"You can only view your own accesses. Authenticated as '{username}' but requested accesses for user '{access_list.username}'",
            details={
                "authenticated_username": username,
                "requested_username": access_list.username,
                "requested_user_id": user_id
            }
        )
    
    return access_list


@router.delete(
    "/{user_id}/accesses/{access_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove my access",
    description="Remove an access from the authenticated user. Users can only remove their own accesses."
)
async def remove_user_access(
    user_id: int,
    access_id: int,
    username: Annotated[str, Depends(get_current_username)],
    service: Annotated[AccessService, Depends(get_access_service)]
) -> None:
    """
    Remove an access from a user.
    
    **Authentication**: Requires X-Username header
    
    **Authorization**: Users can only remove their own accesses. The username in the 
    X-Username header must match the username of the user_id in the path.
    
    **Path Parameters**:
    - `user_id`: ID of the user whose access to remove
    - `access_id`: ID of the access to remove
    
    **Returns**: 204 No Content on success
    
    **Raises**:
    - `403 Forbidden`: If username doesn't match the requested user_id
    - `404 Not Found`: If user does not exist, access does not exist, or access not assigned to user
    """
    # First, verify the user exists and matches the authenticated username
    access_list = service.get_user_accesses(user_id)
    
    # Validate that the authenticated username matches the requested user
    if access_list.username != username:
        raise ForbiddenException(
            f"You can only remove your own accesses. Authenticated as '{username}' but requested removal for user '{access_list.username}'",
            details={
                "authenticated_username": username,
                "requested_username": access_list.username,
                "requested_user_id": user_id
            }
        )
    
    # Remove the access
    service.remove_user_access(user_id, access_id)


@router.post(
    "/{user_id}/accesses",
    response_model=AccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request new access",
    description="Request a new access by name. Requests are auto-approved and immediately granted. Users can only request accesses for themselves."
)
async def request_access(
    user_id: int,
    request: AccessRequestByName,
    username: Annotated[str, Depends(get_current_username)],
    service: Annotated[AccessService, Depends(get_access_service)]
) -> AccessResponse:
    """
    Request a new access by name (auto-approved).
    
    **Authentication**: Requires X-Username header
    
    **Authorization**: Users can only request accesses for themselves. The username in the 
    X-Username header must match the username of the user_id in the path.
    
    **Path Parameters**:
    - `user_id`: ID of the user requesting access
    
    **Request Body**:
    - `access_name`: Name of the access to request (e.g., "READ_DOCUMENTS")
    
    **Returns**: The granted access details with 201 Created status
    
    **Raises**:
    - `403 Forbidden`: If username doesn't match the requested user_id
    - `404 Not Found`: If user does not exist or access name not found
    - `409 Conflict`: If access already assigned to user
    """
    # First, verify the user exists and matches the authenticated username
    access_list = service.get_user_accesses(user_id)
    
    # Validate that the authenticated username matches the requested user
    if access_list.username != username:
        raise ForbiddenException(
            f"You can only request accesses for yourself. Authenticated as '{username}' but requested access for user '{access_list.username}'",
            details={
                "authenticated_username": username,
                "requested_username": access_list.username,
                "requested_user_id": user_id
            }
        )
    
    # Request the access (auto-approved)
    return service.request_user_access(user_id, request.access_name)

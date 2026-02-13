"""
Agent tools for access operations.
Implements list_available_accesses, grant_access_to_user tools for the Strands agent.
"""

import logging
from typing import Dict, Any, List, Optional
from strands import tool

logger = logging.getLogger(__name__)


@tool
async def list_available_accesses() -> List[Dict[str, Any]]:
    """
    Retrieve all available accesses from the backend API.
    
    This tool queries the access catalog to get a list of all available
    access types that can be requested by users.
    
    Returns:
        List of access dictionaries with id, name, and description
        Returns empty list on error with error logged
    
    Example:
        [
            {
                "id": 1,
                "name": "READ_DOCUMENTS",
                "description": "View documents in the system"
            },
            {
                "id": 2,
                "name": "WRITE_DOCUMENTS", 
                "description": "Create and edit documents"
            }
        ]
    """
    logger.info("Tool called: list_available_accesses")
    
    try:
        # Import here to avoid circular imports
        from .http_client import make_backend_request, BackendAPIClient
        
        # Get client from global context (set during app lifespan)
        from ..main import backend_client
        
        if not backend_client:
            logger.error("Backend client not initialized")
            return []
        
        # Make the request
        result = await make_backend_request(backend_client, "get_accesses")
        
        # Extract accesses from response
        accesses = result.get("accesses", [])
        
        # Transform to simplified format for the agent
        simplified_accesses = []
        for access in accesses:
            simplified_accesses.append({
                "id": access.get("id"),
                "name": access.get("name"),
                "description": access.get("description", "")
            })
        
        logger.info(f"Retrieved {len(simplified_accesses)} available accesses")
        return simplified_accesses
        
    except Exception as e:
        logger.error(f"Error retrieving available accesses: {e}", exc_info=True)
        return []


@tool
async def grant_access_to_user(
    user_id: int,
    access_name: str,
    username: str
) -> Dict[str, Any]:
    """
    Grant a specific access to a user.
    
    This tool grants an access to the specified user. The access is
    immediately granted (no approval workflow exists).
    
    Args:
        user_id: ID of the user to grant access to
        access_name: Name of the access to grant (e.g., "READ_DOCUMENTS")
        username: Username for authentication
        
    Returns:
        Dictionary with success status, access details, and message
        
    Success Response:
        {
            "success": True,
            "access": {"id": 1, "name": "READ_DOCUMENTS", "description": "..."},
            "message": "Access granted successfully"
        }
        
    Error Response:
        {
            "success": False,
            "message": "Access not found: {access_name}"
        }
        or
        {
            "success": False,
            "message": "User already has this access"
        }
    """
    logger.info(f"Tool called: grant_access_to_user(user_id={user_id}, access_name={access_name}, username={username})")
    
    try:
        from .http_client import make_backend_request, BackendAPIClient
        
        from ..main import backend_client
        
        if not backend_client:
            logger.error("Backend client not initialized")
            return {
                "success": False,
                "message": "Backend API client not available"
            }
        
        # Make the request
        result = await make_backend_request(
            backend_client,
            "grant_access",
            user_id=user_id,
            access_name=access_name,
            username=username
        )
        
        logger.info(f"Successfully granted access '{access_name}' to user {user_id}")
        
        return {
            "success": True,
            "access": {
                "id": result.get("id"),
                "name": result.get("name"),
                "description": result.get("description", "")
            },
            "message": "Access granted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error granting access: {e}", exc_info=True)
        
        # Check for specific error types
        error_message = str(e)
        if "already has this access" in error_message.lower():
            return {
                "success": False,
                "message": "User already has this access"
            }
        elif "not found" in error_message.lower():
            return {
                "success": False,
                "message": f"Access not found: {access_name}"
            }
        else:
            return {
                "success": False,
                "message": f"Failed to grant access: {error_message}"
            }

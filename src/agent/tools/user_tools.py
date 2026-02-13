"""
Agent tools for user operations.
Implements get_user_accesses tool for the Strands agent.
"""

import logging
from typing import Dict, Any

from strands import tool

logger = logging.getLogger(__name__)


@tool
async def get_user_accesses(user_id: int, username: str) -> Dict[str, Any]:
    """
    Get all accesses currently assigned to a user.
    
    This tool retrieves the list of accesses that a user already has,
    which helps determine if they need additional accesses or already
    have the access they're requesting.
    
    Args:
        user_id: ID of the user
        username: Username for authentication
        
    Returns:
        Dictionary with user_id, username, and list of assigned accesses
        
    Example Response:
        {
            "user_id": 1,
            "username": "john_doe",
            "accesses": [
                {
                    "id": 1,
                    "name": "READ_DOCUMENTS",
                    "description": "View documents in the system"
                }
            ]
        }
        
    Error Response:
        {
            "user_id": 1,
            "username": "john_doe",
            "accesses": [],
            "error": "User not found"
        }
    """
    logger.info(f"Tool called: get_user_accesses(user_id={user_id}, username={username})")
    
    try:
        from .http_client import make_backend_request, BackendAPIClient
        
        from ..main import backend_client
        
        if not backend_client:
            logger.error("Backend client not initialized")
            return {
                "user_id": user_id,
                "username": username,
                "accesses": [],
                "error": "Backend API client not available"
            }
        
        # Make the request
        result = await make_backend_request(
            backend_client,
            "get_user_accesses",
            user_id=user_id,
            username=username
        )
        
        # Transform accesses to simplified format
        simplified_accesses = []
        for access in result.get("accesses", []):
            simplified_accesses.append({
                "id": access.get("id"),
                "name": access.get("name"),
                "description": access.get("description", "")
            })
        
        logger.info(f"User {username} (ID: {user_id}) has {len(simplified_accesses)} accesses")
        
        return {
            "user_id": result.get("user_id"),
            "username": result.get("username"),
            "accesses": simplified_accesses
        }
        
    except Exception as e:
        logger.error(f"Error retrieving user accesses: {e}", exc_info=True)
        
        # Check for specific error types
        error_message = str(e)
        if "not found" in error_message.lower():
            return {
                "user_id": user_id,
                "username": username,
                "accesses": [],
                "error": "User not found"
            }
        else:
            return {
                "user_id": user_id,
                "username": username,
                "accesses": [],
                "error": error_message
            }

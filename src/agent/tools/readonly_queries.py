"""
Read-only database query tools for the Strands Agent.
Ensures all agent database queries are read-only with no data modification capability.
"""

import logging
from typing import List, Dict, Any, Optional
from strands import tool
from datetime import datetime

logger = logging.getLogger(__name__)


@tool
def query_user_accesses(user_id: int) -> List[Dict[str, Any]]:
    """
    Query all accesses granted to a specific user.
    
    This tool performs a read-only query to retrieve the list of all accesses
    that have been granted to the specified user. The query cannot modify
    any data in the database.
    
    Args:
        user_id: ID of the user to query accesses for
        
    Returns:
        List of access dictionaries containing access details
        Returns empty list if user has no accesses or on error
        
    Example Response:
        [
            {
                "id": 1,
                "name": "READ_DOCUMENTS",
                "description": "View documents in the system",
                "assigned_at": "2026-02-10T14:30:00Z"
            },
            {
                "id": 2,
                "name": "WRITE_DOCUMENTS",
                "description": "Create and edit documents",
                "assigned_at": "2026-02-11T10:15:00Z"
            }
        ]
    """
    logger.info(f"Tool called: query_user_accesses(user_id={user_id})")
    
    try:
        # Import database connection - read-only access
        from src.database.connection import get_connection
        
        db_manager = get_connection()
        conn = db_manager.get_connection()
        
        # Execute read-only query
        query = """
        SELECT 
            a.id,
            a.name,
            a.description,
            ua.assigned_at
        FROM user_accesses ua
        JOIN accesses a ON ua.access_id = a.id
        WHERE ua.user_id = ?
        ORDER BY ua.assigned_at DESC
        """
        
        results = conn.execute(query, (user_id,)).fetchall()
        
        # Convert to list of dicts
        column_names = ["id", "name", "description", "assigned_at"]
        results = [dict(zip(column_names, row)) for row in results]
        
        logger.info(f"Retrieved {len(results)} accesses for user {user_id}")
        return results
        
    except Exception as e:
        logger.error(f"Error querying user accesses: {e}", exc_info=True)
        return []


@tool
def list_all_available_accesses() -> List[Dict[str, Any]]:
    """
    Query all available access types in the system.
    
    This tool performs a read-only query to retrieve the complete list of
    access types that are available in the system. Users can request these
    accesses to be granted to them.
    
    Returns:
        List of access type dictionaries with id, name, and description
        Returns empty list on error
        
    Example Response:
        [
            {
                "id": 1,
                "name": "READ_DOCUMENTS",
                "description": "View documents in the system",
                "category": "document_access"
            },
            {
                "id": 2,
                "name": "WRITE_DOCUMENTS",
                "description": "Create and edit documents",
                "category": "document_access"
            }
        ]
    """
    logger.info("Tool called: list_all_available_accesses")
    
    try:
        from src.database.connection import get_connection
        
        db_manager = get_connection()
        conn = db_manager.get_connection()
        
        # Execute read-only query
        query = """
        SELECT 
            id,
            name,
            description,
            category,
            is_active,
            created_at
        FROM accesses
        WHERE is_active = true
        ORDER BY name ASC
        """
        
        results = conn.execute(query).fetchall()
        
        # Convert to list of dicts
        column_names = ["id", "name", "description", "category", "is_active", "created_at"]
        results = [dict(zip(column_names, row)) for row in results]
        
        logger.info(f"Retrieved {len(results)} available access types")
        return results
        
    except Exception as e:
        logger.error(f"Error listing available accesses: {e}", exc_info=True)
        return []


@tool
def search_accesses(search_term: str) -> List[Dict[str, Any]]:
    """
    Search for access types matching a search term.
    
    This tool performs a read-only query to find access types that match
    the provided search term in their name or description.
    
    Args:
        search_term: Term to search for in access names and descriptions
        
    Returns:
        List of matching access dictionaries
        Returns empty list if no matches found or on error
        
    Example Response:
        [
            {
                "id": 1,
                "name": "READ_DOCUMENTS",
                "description": "View documents in the system"
            }
        ]
    """
    logger.info(f"Tool called: search_accesses(search_term='{search_term}')")
    
    if not search_term or len(search_term.strip()) < 2:
        logger.warning("Search term too short (minimum 2 characters)")
        return []
    
    try:
        from src.database.connection import get_connection
        
        db_manager = get_connection()
        conn = db_manager.get_connection()
        
        # Execute read-only query with LIKE for partial matching
        query = """
        SELECT 
            id,
            name,
            description,
            category,
            is_active
        FROM accesses
        WHERE is_active = true 
        AND (name ILIKE ? OR description ILIKE ?)
        ORDER BY name ASC
        LIMIT 20
        """
        
        search_pattern = f"%{search_term}%"
        results = conn.execute(query, (search_pattern, search_pattern)).fetchall()
        
        # Convert to list of dicts
        column_names = ["id", "name", "description", "category", "is_active"]
        results = [dict(zip(column_names, row)) for row in results]
        
        logger.info(f"Found {len(results)} access types matching '{search_term}'")
        return results
        
    except Exception as e:
        logger.error(f"Error searching accesses: {e}", exc_info=True)
        return []


@tool
def get_access_details(access_name: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed information about a specific access type.
    
    This tool performs a read-only query to retrieve the complete details
    of an access type identified by its name.
    
    Args:
        access_name: Name of the access type to look up
        
    Returns:
        Dictionary containing access details
        Returns None if access not found or on error
        
    Example Response:
        {
            "id": 1,
            "name": "READ_DOCUMENTS",
            "description": "View documents in the system",
            "category": "document_access",
            "is_active": true,
            "renewal_period": 90,
            "required_roles": [],
            "created_at": "2026-01-01T00:00:00Z"
        }
    """
    logger.info(f"Tool called: get_access_details(access_name='{access_name}')")
    
    try:
        from src.database.connection import get_connection
        
        db_manager = get_connection()
        conn = db_manager.get_connection()
        
        # Execute read-only query
        query = """
        SELECT 
            id,
            name,
            description,
            category,
            is_active,
            renewal_period,
            required_roles,
            created_at,
            updated_at
        FROM accesses
        WHERE name = ? AND is_active = true
        """
        
        results = conn.execute(query, (access_name,)).fetchall()
        
        if results:
            logger.info(f"Retrieved details for access '{access_name}'")
            # Convert to dict
            column_names = ["id", "name", "description", "category", "is_active", "renewal_period", "required_roles", "created_at", "updated_at"]
            return dict(zip(column_names, results[0]))
        else:
            logger.warning(f"Access '{access_name}' not found")
            return None
            
    except Exception as e:
        logger.error(f"Error getting access details: {e}", exc_info=True)
        return None


@tool
def check_user_has_access(user_id: int, access_name: str) -> bool:
    """
    Check if a specific user has a particular access.
    
    This tool performs a read-only query to verify whether the specified
    user currently has the given access granted to them.
    
    Args:
        user_id: ID of the user to check
        access_name: Name of the access to verify
        
    Returns:
        True if user has the access, False otherwise
        Returns False on error
    """
    logger.info(f"Tool called: check_user_has_access(user_id={user_id}, access_name='{access_name}')")
    
    try:
        from src.database.connection import get_connection
        
        db_manager = get_connection()
        conn = db_manager.get_connection()
        
        # Execute read-only query
        query = """
        SELECT COUNT(*) as count
        FROM user_accesses ua
        JOIN accesses a ON ua.access_id = a.id
        WHERE ua.user_id = ? AND a.name = ?
        """
        
        results = conn.execute(query, (user_id, access_name)).fetchall()
        
        has_access = results[0][0] > 0 if results else False
        
        logger.info(f"User {user_id} {'has' if has_access else 'does not have'} access '{access_name}'")
        return has_access
        
    except Exception as e:
        logger.error(f"Error checking user access: {e}", exc_info=True)
        return False


@tool
def get_access_statistics() -> Dict[str, Any]:
    """
    Get statistics about access usage in the system.
    
    This tool performs read-only aggregation queries to provide statistics
    about access grants across the system.
    
    Returns:
        Dictionary containing access statistics
    """
    logger.info("Tool called: get_access_statistics")
    
    try:
        from src.database.connection import get_connection
        
        db_manager = get_connection()
        conn = db_manager.get_connection()
        
        # Execute read-only queries for statistics
        total_accesses_query = "SELECT COUNT(*) as count FROM accesses WHERE is_active = true"
        total_grants_query = "SELECT COUNT(*) as count FROM user_accesses"
        
        total_accesses = conn.execute(total_accesses_query).fetchall()
        total_grants = conn.execute(total_grants_query).fetchall()
        
        stats = {
            "available_access_types": total_accesses[0][0] if total_accesses else 0,
            "total_access_grants": total_grants[0][0] if total_grants else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Access statistics: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error getting access statistics: {e}", exc_info=True)
        return {
            "available_access_types": 0,
            "total_access_grants": 0,
            "error": str(e)
        }

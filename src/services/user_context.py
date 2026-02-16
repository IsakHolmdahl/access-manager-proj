"""
User context extraction service.
Handles automatic user ID extraction from authenticated session for chat operations.
"""

import logging
from typing import Optional
from datetime import datetime
from src.models.chat_message import UserContext

logger = logging.getLogger(__name__)


class UserContextService:
    """
    Service for extracting and managing user context from authenticated sessions.
    
    This service handles the automatic user ID extraction that allows the chat
    to operate without requiring users to identify themselves. It integrates
    with the existing authentication system to retrieve user information.
    """
    
    def __init__(self):
        """Initialize the user context service."""
        logger.info("UserContextService initialized")
    
    async def get_current_user_context(self, request) -> UserContext:
        """
        Extract user context from the authenticated session.
        
        This method automatically retrieves the authenticated user's information
        from the request context, eliminating the need for users to provide
        their ID in chat messages.
        
        Args:
            request: FastAPI request object with authentication context
            
        Returns:
            UserContext object with user ID, username, and current accesses
            
        Raises:
            UnauthorizedError: If user is not authenticated
        """
        logger.info("Extracting user context from authenticated session")
        
        try:
            # Extract user information from authentication context
            user_id = await self._extract_user_id(request)
            username = await self._extract_username(request)
            email = await self._extract_email(request)
            
            # Get user's current accesses
            current_accesses = await self._get_user_accesses(user_id)
            
            user_context = UserContext(
                user_id=user_id,
                username=username,
                email=email,
                current_accesses=current_accesses
            )
            
            logger.info(f"User context extracted for user {user_id} ({username})")
            return user_context
            
        except Exception as e:
            logger.error(f"Error extracting user context: {e}", exc_info=True)
            raise
    
    async def _extract_user_id(self, request) -> int:
        """
        Extract user ID from authenticated session.
        
        This method retrieves the user ID from the authentication token/session
        that is automatically provided with the request.
        """
        # Get user from authentication dependency
        # This integrates with the existing authentication system
        user = getattr(request.state, 'user', None)
        
        if user is None:
            # Try to get from authentication header
            # This integrates with existing auth patterns
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                # Extract user from JWT token
                # This uses existing token validation
                user = await self._get_user_from_token(auth_header[7:])
        
        if user is None:
            logger.error("No authenticated user found in request")
            raise UnauthorizedError("User must be authenticated to use chat")
        
        return user.get("user_id") if isinstance(user, dict) else user.id
    
    async def _extract_username(self, request) -> str:
        """Extract username from authenticated session."""
        user = getattr(request.state, 'user', None)
        
        if user:
            return user.get("username") if isinstance(user, dict) else user.username
        
        # Fallback to extracting from token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            return await self._get_username_from_token(token)
        
        return "User"
    
    async def _extract_email(self, request) -> Optional[str]:
        """Extract user email from authenticated session."""
        user = getattr(request.state, 'user', None)
        
        if user:
            return user.get("email") if isinstance(user, dict) else getattr(user, 'email', None)
        
        return None
    
    async def _get_user_accesses(self, user_id: int) -> list[str]:
        """
        Get list of access names for the current user.
        
        This method retrieves the user's current access permissions from the
        database to provide context for the agent.
        """
        try:
            # Import access service to query user accesses
            # This avoids circular imports
            from src.services.access_service import AccessService
            from src.database.connection import get_db_session
            
            async with get_db_session() as session:
                access_service = AccessService(session)
                user_accesses = await access_service.get_user_accesses(user_id)
                
                # Extract access names
                access_names = [
                    access.get("name") or access.get("access_name") 
                    for access in user_accesses
                ]
                
                return access_names
                
        except Exception as e:
            logger.error(f"Error retrieving user accesses: {e}", exc_info=True)
            return []
    
    async def _get_user_from_token(self, token: str) -> Optional[dict]:
        """
        Extract user information from authentication token.
        
        This method validates the JWT token and extracts user claims.
        """
        # This integrates with existing JWT validation
        # Implementation depends on the authentication system in use
        try:
            # Placeholder for JWT validation
            # In production, this would use the existing JWT library
            # to decode and validate the token
            import jwt
            
            # Get secret from environment or config
            secret = "your-jwt-secret"  # This would come from config
            
            decoded = jwt.decode(token, secret, algorithms=["HS256"])
            return decoded
            
        except Exception as e:
            logger.error(f"Error decoding token: {e}")
            return None
    
    async def _get_username_from_token(self, token: str) -> str:
        """Extract username from authentication token."""
        user = await self._get_user_from_token(token)
        
        if user:
            return user.get("username", "User")
        
        return "User"
    
    def validate_user_id(self, user_id: int, context: UserContext) -> bool:
        """
        Validate that operations are scoped to the correct user.
        
        This method ensures that all database queries are properly scoped
        to the authenticated user's ID, preventing unauthorized access
        to other users' information.
        """
        return context.user_id == user_id
    
    def format_user_for_agent(self, context: UserContext) -> str:
        """
        Format user context for agent consumption.
        
        Creates a human-readable summary of the user context that can be
        included in the agent's system prompt or context.
        """
        accesses_text = ", ".join(context.current_accesses) if context.current_accesses else "no accesses"
        
        return (
            f"User: {context.username} (ID: {context.user_id})\n"
            f"Email: {context.email or 'Not provided'}\n"
            f"Current accesses: {accesses_text}"
        )


class UnauthorizedError(Exception):
    """Exception raised when user is not authenticated."""
    pass


# Singleton instance for service reuse
user_context_service = UserContextService()

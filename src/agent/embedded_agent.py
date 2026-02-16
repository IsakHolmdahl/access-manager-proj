"""
Embedded agent implementation for chat interface.
Runs as part of the backend service instead of a separate container.
"""

import logging
from typing import Optional
from src.models.chat_message import UserContext
from src.agent.tools.access_tools import list_available_accesses, grant_access_to_user
from src.agent.tools.readonly_queries import (
    query_user_accesses,
    list_all_available_accesses,
    search_accesses,
    get_access_details,
    check_user_has_access,
)

logger = logging.getLogger(__name__)


class EmbeddedAgent:
    """
    Embedded agent for chat-based access management.
    
    This agent runs as part of the backend service, using the same
    DuckDB service for data access and making requests through the
    existing access grant endpoint.
    """
    
    def __init__(self):
        """Initialize the embedded agent."""
        logger.info("EmbeddedAgent initialized")
        
        # Available tools for the agent
        self._tools = [
            list_available_accesses,
            grant_access_to_user,
            query_user_accesses,
            list_all_available_accesses,
            search_accesses,
            get_access_details,
            check_user_has_access,
        ]
    
    async def process_message(
        self,
        message: str,
        user_context: UserContext,
        conversation_history: str,
        conversation_id: str
    ) -> str:
        """
        Process a user message and generate a response.
        
        This is the main entry point for the embedded agent. It takes
        the user's message along with context and generates an appropriate
        response.
        
        Args:
            message: User's message text
            user_context: Information about the authenticated user
            conversation_history: Formatted conversation history
            conversation_id: Unique conversation identifier
            
        Returns:
            Agent's response text
        """
        logger.info(f"Processing message for conversation {conversation_id}")
        
        try:
            # Simple response generation based on message content
            # In production, this would use the Strands Agent framework
            response = await self._generate_response(
                message=message,
                user_context=user_context,
                conversation_history=conversation_history
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            return f"I'm sorry, I encountered an error processing your request: {str(e)}"
    
    async def _generate_response(
        self,
        message: str,
        user_context: UserContext,
        conversation_history: str
    ) -> str:
        """
        Generate an appropriate response to the user message.
        
        This method analyzes the user's message and generates a relevant
        response based on the available tools and user context.
        """
        message_lower = message.lower().strip()
        
        # Get user's current accesses
        user_accesses = query_user_accesses(user_context.user_id)
        access_names = [a.get("name", "Unknown") for a in user_accesses]
        
        # Determine intent and generate appropriate response
        if "what access" in message_lower and "have" in message_lower:
            return self._handle_query_own_accesses(access_names, user_accesses)
        
        elif "what access" in message_lower and ("available" in message_lower or "can i get" in message_lower):
            return await self._handle_query_available_accesses()
        
        elif "grant" in message_lower or "add" in message_lower or "give me" in message_lower:
            return await self._handle_grant_access(message, user_context)
        
        elif "help" in message_lower:
            return self._handle_help_request()
        
        elif "list" in message_lower and "access" in message_lower:
            return await self._handle_list_all_accesses()
        
        else:
            return self._handle_general_inquiry(message, access_names)
    
    def _handle_query_own_accesses(
        self,
        access_names: list,
        user_accesses: list
    ) -> str:
        """Handle query about user's current accesses."""
        if not access_names:
            return (
                "You currently don't have any accesses granted. "
                "Would you like to request an access? You can ask me what accesses are available."
            )
        
        access_list = "\n".join([f"- {name}" for name in access_names])
        return (
            f"You currently have {len(access_names)} access(es):\n\n"
            f"{access_list}\n\n"
            f"Would you like to request an additional access?"
        )
    
    async def _handle_query_available_accesses(self) -> str:
        """Handle query about available access types."""
        available = list_all_available_accesses()
        
        if not available:
            return "There are no access types currently available in the system."
        
        access_list = "\n".join([
            f"- {a.get('name', 'Unknown')}: {a.get('description', 'No description')}"
            for a in available
        ])
        
        return (
            f"Here are the access types available in the system:\n\n"
            f"{access_list}\n\n"
            f"Which access would you like to request?"
        )
    
    async def _handle_grant_access(self, message: str, user_context: UserContext) -> str:
        """Handle request to grant an access."""
        # Extract access name from message
        # This is a simple implementation - production would use NLP
        available = list_all_available_accesses()
        available_names = [a.get("name", "").lower() for a in available]
        
        granted_access = None
        for access in available:
            if access.get("name", "").lower() in message.lower():
                granted_access = access
                break
        
        if not granted_access:
            # Try to find any available access mentioned
            return (
                "I couldn't identify which access you want to grant. "
                "Please specify the exact access name. "
                "You can ask me what accesses are available."
            )
        
        # Check if already has access
        if check_user_has_access(user_context.user_id, granted_access.get("name", "")):
            return f"You already have the '{granted_access.get('name')}' access."
        
        # Grant the access
        result = await grant_access_to_user(
            user_id=user_context.user_id,
            access_name=granted_access.get("name", ""),
            username=user_context.username
        )
        
        if result.get("success"):
            return (
                f"Successfully granted you the '{granted_access.get('name')}' access.\n\n"
                f"{granted_access.get('description', '')}\n\n"
                f"You can now use this access."
            )
        else:
            return f"Failed to grant access: {result.get('message', 'Unknown error')}"
    
    def _handle_help_request(self) -> str:
        """Handle help request."""
        return (
            "I can help you manage your accesses. You can ask me:\n\n"
            "- \"What accesses do I have?\" - See your current accesses\n"
            "- \"What accesses are available?\" - See what you can request\n"
            "- \"Grant me [access name]\" - Request an access\n"
            "- \"List all accesses\" - See all available access types\n\n"
            "How can I help you today?"
        )
    
    async def _handle_list_all_accesses(self) -> str:
        """Handle request to list all accesses."""
        available = list_all_available_accesses()
        
        if not available:
            return "There are no access types currently available in the system."
        
        access_list = "\n".join([
            f"- {a.get('name', 'Unknown')}: {a.get('description', 'No description')}"
            for a in available
        ])
        
        return f"Here are all the access types available:\n\n{access_list}"
    
    def _handle_general_inquiry(self, message: str, user_accesses: list) -> str:
        """Handle general inquiries."""
        return (
            f"I'm not sure I understand. I can help you manage your accesses.\n\n"
            f"You currently have {len(user_accesses)} access(es).\n\n"
            f"Try asking:\n"
            f"- \"What accesses do I have?\"\n"
            f"- \"What accesses are available?\"\n"
            f"- \"Grant me [access name]\"\n\n"
            f"What would you like to do?"
        )


# Singleton instance
embedded_agent = EmbeddedAgent()

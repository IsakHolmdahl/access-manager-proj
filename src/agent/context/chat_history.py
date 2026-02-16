"""
Chat history context for the agent.
Provides full conversation history for agent context injection.
"""

import logging
from datetime import datetime
from typing import Optional
from src.services.chat_history import chat_history_service

logger = logging.getLogger(__name__)


class ChatHistoryContext:
    """
    Manages chat history serialization and injection for the agent.
    
    This class handles formatting the conversation history into a format
    that can be provided to the agent for context.
    """
    
    def __init__(self):
        """Initialize the chat history context manager."""
        logger.info("ChatHistoryContext initialized")
    
    def get_formatted_history(self, conversation_id: str) -> str:
        """
        Get formatted conversation history for agent context.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            Formatted string representation of conversation history
        """
        return chat_history_service.format_history_for_agent(conversation_id)
    
    def get_message_count(self, conversation_id: str) -> int:
        """
        Get the number of messages in a conversation.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            Message count
        """
        return chat_history_service.get_message_count(conversation_id)
    
    def get_context_summary(self, conversation_id: str) -> dict:
        """
        Get a summary of the conversation context.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            Dictionary with conversation context summary
        """
        conversation = chat_history_service.get_conversation(conversation_id)
        
        if not conversation:
            return {
                "exists": False,
                "message_count": 0,
                "message": "No conversation found"
            }
        
        # Count messages by role
        user_messages = sum(1 for m in conversation.messages if m.role.value == "user")
        agent_messages = sum(1 for m in conversation.messages if m.role.value == "agent")
        
        return {
            "exists": True,
            "conversation_id": conversation_id,
            "user_id": conversation.user_id,
            "total_messages": conversation.message_count,
            "user_messages": user_messages,
            "agent_messages": agent_messages,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat()
        }
    
    def format_for_system_prompt(self, conversation_id: str) -> str:
        """
        Format conversation history for inclusion in system prompt.
        
        Creates a compact representation suitable for the agent's
        system prompt, showing recent context without overwhelming
        the prompt with full history.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            Formatted string for system prompt
        """
        conversation = chat_history_service.get_conversation(conversation_id)
        
        if not conversation or conversation.message_count == 0:
            return "This is a new conversation. No previous context."
        
        # Get last 10 messages for context
        recent_messages = conversation.messages[-10:]
        
        lines = ["=== RECENT CONVERSATION HISTORY ==="]
        
        for msg in recent_messages:
            role = "User" if msg.role.value == "user" else "Assistant"
            lines.append(f"{role}: {msg.content}")
        
        lines.append("=== END OF HISTORY ===")
        
        return "\n".join(lines)


# Singleton instance
chat_history_context = ChatHistoryContext()

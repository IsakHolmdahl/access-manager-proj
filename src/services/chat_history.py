"""
Chat history management service.
Handles ephemeral chat session storage per page load (no persistent sessions).
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from src.models.chat_message import ChatMessage, ConversationHistory, MessageRole

logger = logging.getLogger(__name__)


class ChatHistoryService:
    """
    Service for managing ephemeral chat conversations.
    
    This service implements the requirement for non-persistent chat sessions.
    Each page load creates a new conversation with no history preserved
    from previous sessions. This simplifies backend state management and
    eliminates session cleanup requirements.
    """
    
    def __init__(self):
        """Initialize the chat history service."""
        # In-memory storage for ephemeral conversations
        # Key: conversation_id, Value: ConversationHistory
        self._conversations: Dict[str, ConversationHistory] = {}
        
        logger.info("ChatHistoryService initialized (ephemeral sessions)")
    
    def create_conversation(self, user_id: int, username: str) -> ConversationHistory:
        """
        Create a new ephemeral conversation.
        
        This method generates a new conversation with a unique ID and
        initializes it with system and welcome messages.
        
        Args:
            user_id: ID of the authenticated user
            username: Username for personalization
            
        Returns:
            ConversationHistory object for the new conversation
        """
        conversation_id = str(uuid.uuid4())
        
        # Create welcome message
        welcome_message = ChatMessage(
            role=MessageRole.AGENT,
            content=self._generate_welcome_message(username),
            message_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        
        conversation = ConversationHistory(
            conversation_id=conversation_id,
            user_id=user_id,
            messages=[welcome_message],
            message_count=1
        )
        
        # Store in ephemeral storage
        self._conversations[conversation_id] = conversation
        
        logger.info(f"Created new conversation {conversation_id} for user {user_id}")
        return conversation
    
    def get_conversation(self, conversation_id: str) -> Optional[ConversationHistory]:
        """
        Retrieve an existing conversation by ID.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            ConversationHistory if found, None otherwise
        """
        conversation = self._conversations.get(conversation_id)
        
        if conversation:
            logger.debug(f"Retrieved conversation {conversation_id}")
        else:
            logger.debug(f"Conversation {conversation_id} not found")
        
        return conversation
    
    def add_user_message(
        self, 
        conversation_id: str, 
        content: str
    ) -> Optional[ChatMessage]:
        """
        Add a user message to a conversation.
        
        Args:
            conversation_id: Unique conversation identifier
            content: Message content from the user
            
        Returns:
            ChatMessage if successful, None if conversation not found
        """
        conversation = self._conversations.get(conversation_id)
        
        if not conversation:
            logger.warning(f"Cannot add message - conversation {conversation_id} not found")
            return None
        
        message = ChatMessage(
            role=MessageRole.USER,
            content=content,
            message_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        
        conversation.add_message(message)
        
        logger.debug(f"Added user message to conversation {conversation_id}")
        return message
    
    def add_agent_message(
        self, 
        conversation_id: str, 
        content: str
    ) -> Optional[ChatMessage]:
        """
        Add an agent message to a conversation.
        
        Args:
            conversation_id: Unique conversation identifier
            content: Response content from the agent
            
        Returns:
            ChatMessage if successful, None if conversation not found
        """
        conversation = self._conversations.get(conversation_id)
        
        if not conversation:
            logger.warning(f"Cannot add agent message - conversation {conversation_id} not found")
            return None
        
        message = ChatMessage(
            role=MessageRole.AGENT,
            content=content,
            message_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        
        conversation.add_message(message)
        
        logger.debug(f"Added agent message to conversation {conversation_id}")
        return message
    
    def get_conversation_history(
        self, 
        conversation_id: str
    ) -> Optional[ConversationHistory]:
        """
        Get the complete conversation history for agent context.
        
        This method retrieves all messages in a conversation, formatted
        for injection into the agent's context.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            ConversationHistory with all messages if found
        """
        return self.get_conversation(conversation_id)
    
    def format_history_for_agent(self, conversation_id: str) -> str:
        """
        Format conversation history as a string for agent context.
        
        Creates a readable transcript of the conversation that can be
        included in the agent's system prompt or context.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            Formatted string representation of conversation history
        """
        conversation = self._conversations.get(conversation_id)
        
        if not conversation:
            return "No conversation history available."
        
        lines = ["=== Conversation History ==="]
        
        for msg in conversation.messages:
            role_label = "User" if msg.role == MessageRole.USER else "Agent"
            timestamp = msg.timestamp.strftime("%H:%M:%S")
            lines.append(f"[{timestamp}] {role_label}: {msg.content}")
        
        lines.append("=== End of History ===")
        
        return "\n".join(lines)
    
    def get_message_count(self, conversation_id: str) -> int:
        """
        Get the number of messages in a conversation.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            Message count, 0 if conversation not found
        """
        conversation = self._conversations.get(conversation_id)
        return conversation.message_count if conversation else 0
    
    def conversation_exists(self, conversation_id: str) -> bool:
        """
        Check if a conversation exists.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            True if conversation exists, False otherwise
        """
        return conversation_id in self._conversations
    
    def cleanup_conversation(self, conversation_id: str) -> bool:
        """
        Remove a conversation from ephemeral storage.
        
        This method removes a conversation when it is no longer needed,
        typically when the user navigates away from the page.
        
        Args:
            conversation_id: Unique conversation identifier
            
        Returns:
            True if conversation was deleted, False if not found
        """
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
            logger.info(f"Cleaned up conversation {conversation_id}")
            return True
        
        return False
    
    def cleanup_all_user_conversations(self, user_id: int) -> int:
        """
        Remove all conversations for a specific user.
        
        This method cleans up all ephemeral sessions for a user,
        useful for logout or session reset scenarios.
        
        Args:
            user_id: ID of the user whose conversations should be cleaned
            
        Returns:
            Number of conversations cleaned up
        """
        conversation_ids_to_delete = [
            conv_id for conv_id, conv in self._conversations.items()
            if conv.user_id == user_id
        ]
        
        for conv_id in conversation_ids_to_delete:
            del self._conversations[conv_id]
        
        logger.info(f"Cleaned up {len(conversation_ids_to_delete)} conversations for user {user_id}")
        return len(conversation_ids_to_delete)
    
    def _generate_welcome_message(self, username: str) -> str:
        """
        Generate a personalized welcome message.
        
        Creates a welcoming message that introduces the agent and
        indicates readiness to help with access management.
        """
        return (
            f"Hello {username}! I'm your access management assistant. "
            "I can help you understand what accesses you have, explore available accesses, "
            "and request new accesses for your account. "
            "What would you like to know about your accesses today?"
        )
    
    @property
    def active_conversation_count(self) -> int:
        """Get the number of currently active conversations."""
        return len(self._conversations)


# Singleton instance for service reuse
chat_history_service = ChatHistoryService()

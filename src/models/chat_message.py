"""
Chat message models for the chat interface.
Defines Pydantic models for chat request/response validation and conversation tracking.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional
from enum import Enum


class MessageRole(str, Enum):
    """Role of the message sender."""
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """Single chat message in a conversation."""
    role: MessageRole = Field(..., description="Whether message is from user or agent")
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message creation time")
    message_id: Optional[str] = Field(None, description="Unique message identifier")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "role": "user",
                "content": "What accesses do I have?",
                "timestamp": "2026-02-13T10:30:00Z",
                "message_id": "msg_123"
            }
        }
    )


class ChatRequest(BaseModel):
    """Request to send a message to the agent."""
    message: str = Field(
        ..., 
        min_length=1, 
        max_length=10000,
        description="User's message to send to the agent"
    )
    conversation_id: Optional[str] = Field(
        None, 
        description="Optional conversation ID for continuing sessions"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "What accesses do I have?",
                "conversation_id": "conv_456"
            }
        }
    )


class ChatResponse(BaseModel):
    """Response from the agent."""
    response: str = Field(..., description="Agent's response message")
    conversation_id: str = Field(..., description="Conversation identifier for this session")
    message_id: str = Field(..., description="Unique message ID for this response")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "response": "You currently have READ_DOCUMENTS and WRITE_DOCUMENTS accesses.",
                "conversation_id": "conv_456",
                "message_id": "msg_789",
                "timestamp": "2026-02-13T10:30:05Z"
            }
        }
    )


class ConversationHistory(BaseModel):
    """Complete conversation history for agent context."""
    conversation_id: str = Field(..., description="Unique conversation identifier")
    user_id: int = Field(..., description="Authenticated user ID")
    messages: List[ChatMessage] = Field(default_factory=list, description="All messages in conversation")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Conversation creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")
    message_count: int = Field(default=0, description="Number of messages in conversation")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "conversation_id": "conv_456",
                "user_id": 1,
                "messages": [
                    {
                        "role": "user",
                        "content": "What accesses do I have?",
                        "timestamp": "2026-02-13T10:30:00Z",
                        "message_id": "msg_123"
                    },
                    {
                        "role": "agent",
                        "content": "You currently have READ_DOCUMENTS and WRITE_DOCUMENTS accesses.",
                        "timestamp": "2026-02-13T10:30:05Z",
                        "message_id": "msg_789"
                    }
                ],
                "created_at": "2026-02-13T10:30:00Z",
                "updated_at": "2026-02-13T10:30:05Z",
                "message_count": 2
            }
        }
    )

    def add_message(self, message: ChatMessage) -> None:
        """Add a message to the conversation."""
        self.messages.append(message)
        self.message_count = len(self.messages)
        self.updated_at = datetime.utcnow()


class ChatInitialization(BaseModel):
    """Response when starting a new chat conversation."""
    conversation_id: str = Field(..., description="New conversation identifier")
    welcome_message: str = Field(..., description="Initial welcome message from agent")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Initialization timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "conversation_id": "conv_new_123",
                "welcome_message": "Hello! I'm your access management assistant. How can I help you today?",
                "timestamp": "2026-02-13T10:30:00Z"
            }
        }
    )


class UserContext(BaseModel):
    """User context information for agent operations."""
    user_id: int = Field(..., description="Authenticated user ID")
    username: str = Field(..., description="Username for display purposes")
    email: Optional[str] = Field(None, description="User email for personalization")
    current_accesses: List[str] = Field(default_factory=list, description="List of current access names")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "username": "john_doe",
                "email": "john.doe@example.com",
                "current_accesses": ["READ_DOCUMENTS", "WRITE_DOCUMENTS"]
            }
        }
    )

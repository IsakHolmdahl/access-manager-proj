"""
Pydantic models for the Access Management Agent API.
Defines ChatRequest, ChatResponse, and StreamEvent for API communication.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """
    Represents an incoming chat message from a user.
    
    Attributes:
        message: The user's natural language message describing their access needs
        session_id: Optional session ID for conversation continuity
        user_id: ID of the authenticated user making the request
        username: Username for backend API authentication
    """
    
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's natural language message",
        examples=["I need access to the production database"]
    )
    
    session_id: Optional[str] = Field(
        default=None,
        description="Session ID for conversation continuity (optional)"
    )
    
    user_id: int = Field(
        ...,
        ge=1,
        description="ID of the authenticated user"
    )
    
    username: str = Field(
        ...,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Username for backend API authentication",
        examples=["john_doe"]
    )
    
    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        """Ensure message is not just whitespace."""
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()


class ChatResponse(BaseModel):
    """
    Represents the agent's response to a user message.
    
    Attributes:
        response: The agent's natural language response
        session_id: Session ID for conversation continuity
        tools_used: Names of tools the agent called
        accesses_granted: Names of accesses granted in this turn
    """
    
    response: str = Field(
        ...,
        description="The agent's natural language response",
        examples=["I've granted you READ_DOCUMENTS access."]
    )
    
    session_id: Optional[str] = Field(
        default=None,
        description="Session ID for conversation continuity"
    )
    
    tools_used: List[str] = Field(
        default_factory=list,
        description="Names of tools the agent called",
        examples=[["list_available_accesses", "grant_access_to_user"]]
    )
    
    accesses_granted: List[str] = Field(
        default_factory=list,
        description="Names of accesses granted in this turn",
        examples=[["READ_DOCUMENTS"]]
    )


class StreamEvent(BaseModel):
    """
    Represents a single event in the streaming response (Server-Sent Events format).
    
    Attributes:
        event_type: Type of event (data, tool_use, tool_result, done, error)
        content: Event content/message
        metadata: Additional event metadata
    """
    
    event_type: str = Field(
        ...,
        description="Type of event",
        examples=["data"]
    )
    
    content: Optional[str] = Field(
        default=None,
        description="Event content/message",
        examples=["I've granted you READ_DOCUMENTS access."]
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional event metadata",
        examples=[{"tool_name": "grant_access_to_user"}]
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "data",
                "content": "I found the following accesses: ",
                "metadata": {}
            }
        }


class ErrorResponse(BaseModel):
    """
    Represents an error response from the API.
    
    Attributes:
        error: Error details object
    """
    
    error: Dict[str, Any] = Field(
        ...,
        description="Error details object"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "message": "Backend API is not responding",
                    "type": "BackendUnavailableError",
                    "details": None
                }
            }
        }


class HealthResponse(BaseModel):
    """
    Represents the health check response.
    
    Attributes:
        status: Service health status
        service: Service name
        version: Service version
        backend_api_status: Status of backend API connection
        bedrock_status: Status of AWS Bedrock connection
    """
    
    status: str = Field(
        ...,
        description="Service health status",
        examples=["healthy"]
    )
    
    service: str = Field(
        ...,
        description="Service name",
        examples=["Access Management Agent"]
    )
    
    version: str = Field(
        ...,
        description="Service version",
        examples=["1.0.0"]
    )
    
    backend_api_status: str = Field(
        ...,
        description="Status of backend API connection",
        examples=["reachable"]
    )
    
    bedrock_status: str = Field(
        ...,
        description="Status of AWS Bedrock connection",
        examples=["configured"]
    )

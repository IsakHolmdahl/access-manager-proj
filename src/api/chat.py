"""
Chat API endpoints for the embedded agent.
Provides REST endpoints for chat interaction with the Strands agent.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import Optional
from src.models.chat_message import (
    ChatRequest,
    ChatResponse,
    ChatInitialization,
    ConversationHistory,
)
from src.services.chat_history import chat_history_service
from src.services.user_context import user_context_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/init", response_model=ChatInitialization)
async def initialize_chat(request: Request):
    """
    Initialize a new chat conversation.
    
    Creates a new ephemeral conversation with a unique ID and returns
    a welcome message from the agent. Each page load should call this
    endpoint to start a fresh conversation.
    
    Returns:
        ChatInitialization with conversation ID and welcome message
    """
    logger.info("Initializing new chat conversation")
    
    # Extract user context from authenticated session
    try:
        user_context = await user_context_service.get_current_user_context(request)
    except Exception as e:
        logger.error(f"Error getting user context: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User must be authenticated to use chat"
        )
    
    # Create new ephemeral conversation
    conversation = chat_history_service.create_conversation(
        user_id=user_context.user_id,
        username=user_context.username
    )
    
    logger.info(f"Created conversation {conversation.conversation_id} for user {user_context.user_id}")
    
    # Extract welcome message from conversation
    welcome_message = conversation.messages[0].content if conversation.messages else "Hello! How can I help you?"
    
    return ChatInitialization(
        conversation_id=conversation.conversation_id,
        welcome_message=welcome_message
    )


@router.post("/message", response_model=ChatResponse)
async def send_message(request: Request, chat_request: ChatRequest):
    """
    Send a message to the agent and receive a response.
    
    Processes a user message, maintains conversation context, and returns
    the agent's response. The entire conversation history is provided to
    the agent for context.
    
    Args:
        chat_request: ChatRequest containing user message and conversation ID
        
    Returns:
        ChatResponse with agent's message
    """
    logger.info(f"Received message for conversation {chat_request.conversation_id}")
    
    # Validate conversation exists
    if not chat_request.conversation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation ID is required"
        )
    
    conversation = chat_history_service.get_conversation(chat_request.conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found. Please initialize a new chat."
        )
    
    # Get user context
    try:
        user_context = await user_context_service.get_current_user_context(request)
    except Exception as e:
        logger.error(f"Error getting user context: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User must be authenticated to use chat"
        )
    
    # Validate user owns this conversation
    if conversation.user_id != user_context.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This conversation belongs to another user"
        )
    
    # Add user message to history
    user_message = chat_history_service.add_user_message(
        chat_request.conversation_id,
        chat_request.message
    )
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add message to conversation"
        )
    
    try:
        # Get formatted conversation history for agent
        history_text = chat_history_service.format_history_for_agent(
            chat_request.conversation_id
        )
        
        # Call the embedded agent with user message and context
        from src.agent.embedded_agent import embedded_agent
        
        agent_response = await embedded_agent.process_message(
            message=chat_request.message,
            user_context=user_context,
            conversation_history=history_text,
            conversation_id=chat_request.conversation_id
        )
        
        # Add agent response to history
        agent_message = chat_history_service.add_agent_message(
            chat_request.conversation_id,
            agent_response
        )
        if not agent_message:
            logger.warning(f"Failed to add agent message to conversation {chat_request.conversation_id}")
        
        logger.info(f"Processed message for conversation {chat_request.conversation_id}")
        
        return ChatResponse(
            response=agent_response,
            conversation_id=chat_request.conversation_id,
            message_id=agent_message.message_id if agent_message else "unknown",
            timestamp=agent_message.timestamp if agent_message else __import__('datetime').datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )


@router.get("/history/{conversation_id}", response_model=ConversationHistory)
async def get_conversation_history(conversation_id: str, request: Request):
    """
    Get the complete conversation history.
    
    Retrieves all messages in a conversation, useful for debugging or
    restoring conversation state.
    
    Args:
        conversation_id: Unique conversation identifier
        
    Returns:
        ConversationHistory with all messages
    """
    logger.info(f"Getting history for conversation {conversation_id}")
    
    # Get conversation
    conversation = chat_history_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify user owns this conversation
    try:
        user_context = await user_context_service.get_current_user_context(request)
        if conversation.user_id != user_context.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This conversation belongs to another user"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User must be authenticated"
        )
    
    return conversation


@router.delete("/conversation/{conversation_id}")
async def end_conversation(conversation_id: str, request: Request):
    """
    End and cleanup a conversation.
    
    Removes the conversation from ephemeral storage. This is called when
    the user navigates away from the page.
    
    Args:
        conversation_id: Unique conversation identifier
        
    Returns:
        Success message
    """
    logger.info(f"Ending conversation {conversation_id}")
    
    # Get conversation
    conversation = chat_history_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Verify user owns this conversation
    try:
        user_context = await user_context_service.get_current_user_context(request)
        if conversation.user_id != user_context.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This conversation belongs to another user"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User must be authenticated"
        )
    
    # Cleanup conversation
    chat_history_service.cleanup_conversation(conversation_id)
    
    return {"message": "Conversation ended successfully"}


@router.get("/status/{conversation_id}")
async def get_conversation_status(conversation_id: str, request: Request):
    """
    Get conversation status and message count.
    
    Returns basic information about a conversation without the full history.
    
    Args:
        conversation_id: Unique conversation identifier
        
    Returns:
        Conversation status information
    """
    conversation = chat_history_service.get_conversation(conversation_id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return {
        "conversation_id": conversation_id,
        "message_count": conversation.message_count,
        "created_at": conversation.created_at.isoformat(),
        "updated_at": conversation.updated_at.isoformat()
    }

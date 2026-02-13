"""
FastAPI application for the Access Management Agent.
Provides REST API endpoints for agent interaction.
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .config import get_config
from .models.chat import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    ErrorResponse
)
from .agent import create_azure_openai_client
from .tools.http_client import BackendAPIClient, BackendAPIError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for agent and client
azure_client = None
backend_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup and shutdown)."""
    global azure_client, backend_client

    # Startup
    logger.info("Starting Access Management Agent...")

    # Load configuration
    config = get_config()
    logger.info(f"Loaded configuration: backend_api_url={config.backend_api_url}")

    # Initialize Azure OpenAI client
    if config.is_azure_configured:
        try:
            azure_client = create_azure_openai_client(
                endpoint=config.azure_openai_endpoint,
                api_key=config.azure_openai_api_key,
                deployment=config.azure_openai_deployment,
                api_version=config.azure_openai_api_version
            )
            if azure_client.check_connection():
                logger.info("Azure OpenAI client connected successfully")
            else:
                logger.warning("Azure OpenAI client connection check failed - will retry on first use")
        except Exception as e:
            logger.warning(f"Failed to initialize Azure OpenAI client: {e}")
    else:
        logger.warning("Azure OpenAI not configured - agent will run in placeholder mode")

    # Initialize backend API client
    backend_client = BackendAPIClient(
        base_url=config.backend_api_url,
        admin_key=config.backend_admin_key
    )
    logger.info(f"Backend API client initialized: {config.backend_api_url}")

    yield

    # Shutdown
    logger.info("Shutting down Access Management Agent...")
    if backend_client:
        await backend_client.close()


# Create FastAPI app
app = FastAPI(
    title="Access Management Agent API",
    description="Conversational AI agent for requesting and discovering accesses through natural language",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/agent/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Check if the agent service is healthy and responsive.

    Returns:
        HealthResponse with service status
    """
    config = get_config()

    # Check backend API connection
    backend_status = "reachable"
    try:
        if backend_client:
            await backend_client.get("/admin/accesses?limit=1")
    except Exception:
        backend_status = "unreachable"

    # Check Azure OpenAI connection
    azure_status = "not_configured"
    if config.is_azure_configured:
        if azure_client:
            if azure_client.check_connection():
                azure_status = "configured"
            else:
                azure_status = "connection_failed"
        else:
            azure_status = "not_initialized"
    else:
        azure_status = "not_configured"

    return HealthResponse(
        status="healthy",
        service="Access Management Agent",
        version="1.0.0",
        backend_api_status=backend_status,
        azure_openai_status=azure_status
    )


@app.post("/agent/chat", response_model=ChatResponse, tags=["Agent"])
async def chat_endpoint(request: ChatRequest):
    """
    Chat with the agent (non-streaming).

    Send a message to the agent and receive a complete response.

    Args:
        request: ChatRequest with message, session_id, user_id, username

    Returns:
        ChatResponse with agent's response
    """
    # Placeholder response until agent is fully implemented
    logger.info(f"Chat request from user {request.user_id} ({request.username})")
    logger.info(f"Message: {request.message[:100]}...")

    # TODO: Implement actual agent logic
    # For now, return a placeholder response
    return ChatResponse(
        response=f"I understand you need: {request.message}. This is a placeholder response - full agent implementation pending.",
        session_id=request.session_id,
        tools_used=[],
        accesses_granted=[]
    )


# Error handlers
@app.exception_handler(BackendAPIError)
async def backend_api_error_handler(request: Request, exc: BackendAPIError):
    """Handle backend API errors."""
    logger.error(f"Backend API error: {exc.message}")

    return JSONResponse(
        status_code=exc.status_code or 503,
        content={
            "error": {
                "message": exc.message,
                "type": exc.__class__.__name__,
                "details": exc.details
            }
        }
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "An unexpected error occurred",
                "type": "InternalServerError",
                "details": {"error": str(exc)} if len(str(exc)) < 200 else None
            }
        }
    )


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    return app


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )

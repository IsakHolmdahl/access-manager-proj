"""
AWS Bedrock client initialization and Strands Agent setup for the Access Management Agent.
"""

import logging
from typing import Optional
from contextlib import asynccontextmanager

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class BedrockClient:
    """Client for AWS Bedrock service."""
    
    def __init__(
        self,
        region: str = "us-west-2",
        model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0"
    ):
        """
        Initialize the Bedrock client.
        
        Args:
            region: AWS region for Bedrock service
            model_id: Model ID to use for inference
        """
        self.region = region
        self.model_id = model_id
        
        # Configure the boto3 client with retry logic
        config = Config(
            region_name=region,
            retries={"max_attempts": 3, "mode": "adaptive"}
        )
        
        self.client = boto3.client("bedrock-runtime", config=config)
    
    def check_connection(self) -> bool:
        """
        Check if the Bedrock client can connect to the service.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to invoke the model with a simple test prompt
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body='{"prompt": "Hello", "maxTokens": 10}'
            )
            response.close()
            return True
        except ClientError as e:
            logger.error(f"Bedrock connection check failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Bedrock connection check error: {e}")
            return False
    
    def get_model_id(self) -> str:
        """Get the configured model ID."""
        return self.model_id


def create_bedrock_client(
    region: str = "us-west-2",
    model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0"
) -> BedrockClient:
    """
    Create a Bedrock client instance.
    
    Args:
        region: AWS region for Bedrock service
        model_id: Model ID to use for inference
        
    Returns:
        BedrockClient instance
    """
    return BedrockClient(region=region, model_id=model_id)


# Strands Agent initialization
# Note: Full Strands SDK integration requires strands-agents package to be installed
# This section provides the structure for agent initialization

try:
    from strands import Agent
    from strands.models import BedrockModel
    from .tools.access_tools import list_available_accesses, grant_access_to_user
    from .tools.user_tools import get_user_accesses
    from .prompts.system_prompt import build_system_prompt
    from .config import get_config
    
    STRANDS_AVAILABLE = True
except ImportError:
    STRANDS_AVAILABLE = False
    logger.warning("Strands SDK not available - agent functionality will be limited")


def create_agent(
    system_prompt: str,
    model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0"
):
    """
    Create and configure the Strands Agent.
    
    Args:
        system_prompt: Complete system prompt for the agent
        model_id: Bedrock model ID to use
        
    Returns:
        Configured Agent instance or None if strands is not available
    """
    if not STRANDS_AVAILABLE:
        logger.error("Cannot create agent: Strands SDK not available")
        return None
    
    try:
        # Create the Bedrock model
        model = BedrockModel(
            model_id=model_id,
            temperature=0.1,  # Low temperature for consistent, focused responses
            max_tokens=2000
        )
        
        # Create the agent with tools
        agent = Agent(
            model=model,
            system_prompt=system_prompt,
            tools=[
                list_available_accesses,
                get_user_accesses,
                grant_access_to_user
            ]
        )
        
        logger.info("Strands Agent created successfully")
        return agent
        
    except Exception as e:
        logger.error(f"Failed to create Strands Agent: {e}", exc_info=True)
        return None


async def initialize_agent() -> Optional:
    """
    Initialize the Strands Agent with proper configuration.
    
    This function:
    1. Loads the configuration
    2. Builds the system prompt from documentation
    3. Creates the agent with all tools
    
    Returns:
        Initialized Agent instance or None if initialization fails
    """
    if not STRANDS_AVAILABLE:
        logger.error("Strands SDK not available")
        return None
    
    try:
        # Load configuration
        config = get_config()
        
        # Build system prompt
        system_prompt, error = build_system_prompt(config.documentation_path)
        if error:
            logger.error(f"Failed to build system prompt: {error}")
            # Use a basic system prompt as fallback
            system_prompt = """You are an Access Assistant that helps users request and discover access permissions.
            
            You have access to tools that can:
            - List available accesses
            - Check what accesses a user currently has
            - Grant accesses to users
            
            Always confirm before granting access and be helpful in explaining what each access enables.
            """
        
        # Create the agent
        agent = create_agent(
            system_prompt=system_prompt,
            model_id=config.bedrock_model_id
        )
        
        if agent:
            logger.info("Agent initialized successfully")
        else:
            logger.error("Failed to initialize agent")
        
        return agent
        
    except Exception as e:
        logger.error(f"Error initializing agent: {e}", exc_info=True)
        return None

"""
Azure OpenAI client initialization and Strands Agent setup for the Access Management Agent.
"""

import logging
from typing import Optional
from contextlib import asynccontextmanager

from openai import AzureOpenAI
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class AzureOpenAIClient:
    """Client for Azure OpenAI service."""

    def __init__(
        self,
        endpoint: str,
        api_key: str,
        deployment: str = "gpt-4o",
        api_version: str = "2024-02-15-preview"
    ):
        """
        Initialize the Azure OpenAI client.

        Args:
            endpoint: Azure OpenAI endpoint URL
            api_key: Azure OpenAI API key
            deployment: Model deployment name
            api_version: API version to use
        """
        self.endpoint = endpoint
        self.deployment = deployment
        self.api_version = api_version

        self.client = AzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version
        )

    def check_connection(self) -> bool:
        """
        Check if the Azure OpenAI client can connect to the service.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to invoke the model with a simple test prompt
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Hello"}
                ],
                max_tokens=10
            )
            return bool(response)
        except ClientError as e:
            logger.error(f"Azure OpenAI connection check failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Azure OpenAI connection check error: {e}")
            return False

    def get_deployment_name(self) -> str:
        """Get the configured deployment name."""
        return self.deployment


def create_azure_openai_client(
    endpoint: str,
    api_key: str,
    deployment: str = "gpt-4o",
    api_version: str = "2024-02-15-preview"
) -> AzureOpenAIClient:
    """
    Create an Azure OpenAI client instance.

    Args:
        endpoint: Azure OpenAI endpoint URL
        api_key: Azure OpenAI API key
        deployment: Model deployment name
        api_version: API version to use

    Returns:
        AzureOpenAIClient instance
    """
    return AzureOpenAIClient(
        endpoint=endpoint,
        api_key=api_key,
        deployment=deployment,
        api_version=api_version
    )


# Strands Agent initialization
# Note: Full Strands SDK integration requires strands-agents package to be installed
# This section provides the structure for agent initialization

try:
    from strands import Agent
    from strands.models.openai import OpenAIModel
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
    deployment: str = "gpt-4o",
    endpoint: str = "",
    api_key: str = ""
):
    """
    Create and configure the Strands Agent with Azure OpenAI.

    Args:
        system_prompt: Complete system prompt for the agent
        deployment: Azure OpenAI deployment name
        endpoint: Azure OpenAI endpoint URL
        api_key: Azure OpenAI API key

    Returns:
        Configured Agent instance or None if strands is not available
    """
    if not STRANDS_AVAILABLE:
        logger.error("Cannot create agent: Strands SDK not available")
        return None

    try:
        # Create the Azure OpenAI model configuration
        client_args = {
            "api_key": api_key,
        }

        # Add base_url for Azure
        if endpoint:
            client_args["base_url"] = f"{endpoint.rstrip('/')}/openai/"

        # Create the OpenAI model (compatible with Azure)
        model = OpenAIModel(
            client_args=client_args,
            model_id=deployment,
            params={
                "temperature": 0.1,  # Low temperature for consistent, focused responses
                "max_tokens": 2000
            }
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

        logger.info("Strands Agent created successfully with Azure OpenAI")
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
            deployment=config.azure_openai_deployment,
            endpoint=config.azure_openai_endpoint,
            api_key=config.azure_openai_api_key
        )

        if agent:
            logger.info("Agent initialized successfully with Azure OpenAI")
        else:
            logger.error("Failed to initialize agent")

        return agent

    except Exception as e:
        logger.error(f"Error initializing agent: {e}", exc_info=True)
        return None

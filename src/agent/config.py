"""
Configuration loader for the Access Management Agent.
Loads environment variables and provides configuration to the agent.
"""

import os
from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentConfig(BaseSettings):
    """
    Configuration for the Access Management Agent.

    Attributes:
        backend_api_url: URL of the existing access management API
        azure_openai_endpoint: Azure OpenAI endpoint URL
        azure_openai_api_key: Azure OpenAI API key
        azure_openai_deployment: Azure OpenAI deployment name (model name)
        azure_openai_api_version: Azure OpenAI API version
        documentation_path: Path to access documentation markdown file
        max_conversation_turns: Maximum turns per session
        session_timeout_minutes: Session inactivity timeout in minutes
    """

    backend_api_url: str = Field(
        default="http://localhost:8000",
        description="URL of the existing access management API"
    )

    backend_admin_key: str = Field(
        default="",
        description="Admin key for backend API authentication"
    )

    azure_openai_endpoint: str = Field(
        default="",
        description="Azure OpenAI endpoint URL (e.g., https://my-resource.openai.azure.com/)"
    )

    azure_openai_api_key: str = Field(
        default="",
        description="Azure OpenAI API key"
    )

    azure_openai_deployment: str = Field(
        default="gpt-4o",
        description="Azure OpenAI deployment name (model deployment ID)"
    )

    azure_openai_api_version: str = Field(
        default="2024-02-15-preview",
        description="Azure OpenAI API version"
    )

    documentation_path: str = Field(
        default="./docs/accesses.md",
        description="Path to access documentation markdown file"
    )

    max_conversation_turns: int = Field(
        default=10,
        description="Maximum conversation turns per session"
    )

    session_timeout_minutes: int = Field(
        default=30,
        description="Session inactivity timeout in minutes"
    )

    model_config = SettingsConfigDict(
        env_prefix="AGENT_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @classmethod
    def from_env(cls) -> "AgentConfig":
        """Load configuration from environment variables."""
        return cls()

    @property
    def documentation_exists(self) -> bool:
        """Check if the documentation file exists."""
        return Path(self.documentation_path).exists()

    def get_documentation_path(self) -> Path:
        """Get the absolute path to the documentation file."""
        return Path(self.documentation_path).resolve()

    @property
    def is_azure_configured(self) -> bool:
        """Check if Azure OpenAI is properly configured."""
        return bool(
            self.azure_openai_endpoint and
            self.azure_openai_api_key and
            self.azure_openai_deployment
        )


def get_config() -> AgentConfig:
    """
    Get the agent configuration.

    Returns:
        AgentConfig: The agent configuration loaded from environment.
    """
    return AgentConfig.from_env()

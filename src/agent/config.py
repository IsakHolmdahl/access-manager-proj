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
        bedrock_model_id: AWS Bedrock model identifier
        bedrock_region: AWS region for Bedrock service
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
    
    bedrock_model_id: str = Field(
        default="anthropic.claude-sonnet-4-20250514-v1:0",
        description="AWS Bedrock model identifier"
    )
    
    bedrock_region: str = Field(
        default="us-west-2",
        description="AWS region for Bedrock service"
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


def get_config() -> AgentConfig:
    """
    Get the agent configuration.
    
    Returns:
        AgentConfig: The agent configuration loaded from environment.
    """
    return AgentConfig.from_env()

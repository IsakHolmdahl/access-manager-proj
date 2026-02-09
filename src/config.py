"""
Application configuration using pydantic-settings.
Loads settings from environment variables with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    All settings can be overridden via environment variables or .env file.
    """
    
    # Admin Authentication
    admin_secret_key: str = "your-secret-admin-key-change-this-in-production"
    
    # Database Configuration
    duckdb_path: str = "./data/database/access_management.duckdb"
    parquet_path: str = "./data/parquet"
    temp_directory: str = "./data/temp"
    
    # Application Configuration
    app_environment: Literal["development", "staging", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    
    # API Configuration
    api_title: str = "Access Management API"
    api_version: str = "1.0.0"
    api_description: str = "REST API for managing individual user accesses"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Global settings instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """
    Get or create the global settings instance.
    
    This function ensures settings are loaded only once and reused.
    Useful as a FastAPI dependency.
    
    Returns:
        Settings: The application settings instance
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

"""
Pytest configuration and shared fixtures for testing.

This module provides reusable fixtures for database, API client, and test data.
"""

import pytest
import duckdb
from pathlib import Path
from fastapi.testclient import TestClient

from src.api.main import app
from src.config import Settings, get_settings
from src.database.connection import DatabaseConnection
from src.database.migrations import run_migrations


# ============================================================================
# Test Settings
# ============================================================================

@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """
    Override application settings for testing.
    
    Uses in-memory database and test configuration.
    """
    return Settings(
        admin_secret_key="test-admin-key",
        duckdb_path=":memory:",  # Use in-memory database for tests
        parquet_path="./test_data/parquet",
        temp_directory="./test_data/temp",
        app_environment="testing",
        log_level="DEBUG"
    )


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_db(test_settings: Settings) -> duckdb.DuckDBPyConnection:
    """
    Provide a fresh test database for each test.
    
    Creates an in-memory database with schema initialized.
    Database is destroyed after test completes.
    
    Yields:
        DuckDBPyConnection: Test database connection
    """
    # Create in-memory database
    conn = duckdb.connect(":memory:")
    
    # Run migrations to create schema
    run_migrations(conn)
    
    yield conn
    
    # Cleanup
    conn.close()


@pytest.fixture(scope="function")
def test_db_with_data(test_db: duckdb.DuckDBPyConnection) -> duckdb.DuckDBPyConnection:
    """
    Provide a test database with sample data.
    
    Includes sample users and accesses for testing.
    
    Yields:
        DuckDBPyConnection: Test database with sample data
    """
    from src.database.migrations import seed_database
    
    # Seed database with sample data
    seed_database(test_db)
    
    yield test_db


# ============================================================================
# API Client Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def client(test_settings: Settings) -> TestClient:
    """
    Provide a test client for API testing.
    
    Uses dependency override to inject test settings and database.
    
    Yields:
        TestClient: FastAPI test client
    """
    # Override get_settings dependency
    app.dependency_overrides[get_settings] = lambda: test_settings
    
    client = TestClient(app)
    
    yield client
    
    # Cleanup overrides
    app.dependency_overrides.clear()


# ============================================================================
# Authentication Fixtures
# ============================================================================

@pytest.fixture
def admin_headers(test_settings: Settings) -> dict[str, str]:
    """
    Provide headers with admin authentication.
    
    Returns:
        dict: Headers with X-Admin-Key
    """
    return {"X-Admin-Key": test_settings.admin_secret_key}


@pytest.fixture
def user_headers() -> dict[str, str]:
    """
    Provide headers with user authentication.
    
    Returns:
        dict: Headers with X-Username
    """
    return {"X-Username": "test_user"}


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def sample_user_data() -> dict:
    """
    Provide sample user data for testing.
    
    Returns:
        dict: User creation data
    """
    return {
        "username": "john_doe",
        "password": "SecurePass123!"
    }


@pytest.fixture
def sample_access_data() -> dict:
    """
    Provide sample access data for testing.
    
    Returns:
        dict: Access creation data
    """
    return {
        "name": "TEST_ACCESS",
        "description": "Test access for automated testing",
        "renewal_period": 30
    }


# ============================================================================
# Pytest Configuration
# ============================================================================

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "api: mark test as an API test"
    )

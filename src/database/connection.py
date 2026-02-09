"""
DuckDB connection management with persistent file storage.

This module handles database connections, initialization, and provides
FastAPI dependency functions for database access.
"""

import duckdb
from pathlib import Path
from typing import Generator
from contextlib import contextmanager

from src.config import get_settings


class DatabaseConnection:
    """
    Manages DuckDB database connections with file-based persistence.
    
    Ensures the database directory exists and handles connection lifecycle.
    """
    
    def __init__(self, db_path: str):
        """
        Initialize database connection manager.
        
        Args:
            db_path: Path to DuckDB database file
        """
        self.db_path = Path(db_path)
        self._ensure_directory_exists()
        self._connection: duckdb.DuckDBPyConnection | None = None
    
    def _ensure_directory_exists(self) -> None:
        """Create database directory if it doesn't exist."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
    
    def get_connection(self) -> duckdb.DuckDBPyConnection:
        """
        Get or create a database connection.
        
        DuckDB uses a single-writer model, so we reuse the same connection.
        
        Returns:
            DuckDBPyConnection: Active database connection
        """
        if self._connection is None:
            self._connection = duckdb.connect(str(self.db_path))
        return self._connection
    
    def close(self) -> None:
        """Close the database connection if open."""
        if self._connection is not None:
            self._connection.close()
            self._connection = None
    
    @contextmanager
    def transaction(self):
        """
        Context manager for database transactions.
        
        Automatically commits on success, rolls back on exception.
        
        Yields:
            DuckDBPyConnection: Database connection within transaction
        """
        conn = self.get_connection()
        try:
            conn.execute("BEGIN TRANSACTION")
            yield conn
            conn.execute("COMMIT")
        except Exception:
            conn.execute("ROLLBACK")
            raise


# Global database connection instance
_db_connection: DatabaseConnection | None = None


def get_connection() -> DatabaseConnection:
    """
    Get the global database connection manager.
    
    Returns:
        DatabaseConnection: The database connection manager instance
    """
    global _db_connection
    if _db_connection is None:
        settings = get_settings()
        _db_connection = DatabaseConnection(settings.duckdb_path)
    return _db_connection


def get_db() -> Generator[duckdb.DuckDBPyConnection, None, None]:
    """
    FastAPI dependency for database access.
    
    Provides a database connection to route handlers.
    The connection is managed globally and reused.
    
    Yields:
        DuckDBPyConnection: Database connection for the request
        
    Example:
        @app.get("/users")
        def list_users(db: duckdb.DuckDBPyConnection = Depends(get_db)):
            result = db.execute("SELECT * FROM users").fetchall()
            return result
    """
    db_manager = get_connection()
    conn = db_manager.get_connection()
    try:
        yield conn
    finally:
        # Connection is reused, not closed per request
        pass


def init_database() -> None:
    """
    Initialize the database schema if not exists.
    
    This function should be called on application startup to ensure
    the database schema is created.
    """
    from src.database.migrations import run_migrations
    run_migrations()

"""
Database migration management.

Handles running SQL migrations to initialize or update the database schema.
"""

from pathlib import Path
import duckdb


def run_migrations(conn: duckdb.DuckDBPyConnection | None = None) -> None:
    """
    Run database migrations to initialize schema.
    
    Executes the init_schema.sql file to create tables and indexes.
    Safe to run multiple times (uses IF NOT EXISTS).
    
    Args:
        conn: Optional database connection. If None, creates a new connection.
    """
    from src.database.connection import get_connection
    
    if conn is None:
        db_manager = get_connection()
        conn = db_manager.get_connection()
    
    # Get path to migrations directory
    migrations_dir = Path(__file__).parent
    schema_file = migrations_dir / "init_schema.sql"
    
    # Read and execute schema migration
    with open(schema_file, 'r') as f:
        schema_sql = f.read()
    
    # Execute the schema creation
    conn.execute(schema_sql)
    conn.commit()


def seed_database(conn: duckdb.DuckDBPyConnection | None = None) -> None:
    """
    Seed the database with initial data.
    
    Creates sample accesses and an admin user for development/testing.
    Only seeds if tables are empty.
    
    Args:
        conn: Optional database connection. If None, creates a new connection.
    """
    from src.database.connection import get_connection
    
    if conn is None:
        db_manager = get_connection()
        conn = db_manager.get_connection()
    
    # Check if data already exists
    result = conn.execute("SELECT COUNT(*) FROM accesses").fetchone()
    if result and result[0] > 0:
        # Data already seeded
        return
    
    # Get path to seed data file
    migrations_dir = Path(__file__).parent
    seed_file = migrations_dir / "seed_data.sql"
    
    # Read and execute seed data
    if seed_file.exists():
        with open(seed_file, 'r') as f:
            seed_sql = f.read()
        
        conn.execute(seed_sql)
        conn.commit()

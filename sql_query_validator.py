"""
SQL Query Validator for Safe SELECT-only Query Execution

This module provides production-ready validation for SQL queries to ensure
only SELECT statements are executed, blocking potentially dangerous operations
like UPDATE, DELETE, DROP, INSERT, ALTER, etc.

Recommended Library: sqlglot
- More comprehensive than sqlparse (has AST-based validation)
- Better dialect support including DuckDB
- Active development and maintenance
- Can detect nested dangerous operations in CTEs and subqueries

Usage:
    from sql_query_validator import SafeQueryValidator, QueryValidationError
    
    validator = SafeQueryValidator()
    
    try:
        # Validate the query
        validator.validate(user_query)
        
        # If validation passes, execute safely
        result = conn.execute(user_query).fetchall()
    except QueryValidationError as e:
        return {"error": str(e)}, 400
"""

import re
from typing import List, Set, Tuple, Optional
from enum import Enum

try:
    import sqlglot
    from sqlglot import parse_one, exp
    from sqlglot.errors import ParseError
    SQLGLOT_AVAILABLE = True
except ImportError:
    SQLGLOT_AVAILABLE = False
    # Fallback to basic regex validation if sqlglot not available


class QueryValidationError(Exception):
    """Raised when a query fails validation checks."""
    pass


class DangerousOperation(Enum):
    """Enumeration of dangerous SQL operations to block."""
    # Data Modification Language (DML)
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    MERGE = "MERGE"
    REPLACE = "REPLACE"
    TRUNCATE = "TRUNCATE"
    
    # Data Definition Language (DDL)
    CREATE = "CREATE"
    ALTER = "ALTER"
    DROP = "DROP"
    RENAME = "RENAME"
    
    # Data Control Language (DCL)
    GRANT = "GRANT"
    REVOKE = "REVOKE"
    
    # Transaction Control
    COMMIT = "COMMIT"
    ROLLBACK = "ROLLBACK"
    SAVEPOINT = "SAVEPOINT"
    
    # System/Administrative
    CALL = "CALL"
    EXECUTE = "EXECUTE"
    EXEC = "EXEC"
    COPY = "COPY"
    LOAD = "LOAD"
    INSTALL = "INSTALL"
    ATTACH = "ATTACH"
    DETACH = "DETACH"
    PRAGMA = "PRAGMA"
    SET = "SET"
    
    # DuckDB-specific potentially dangerous operations
    CHECKPOINT = "CHECKPOINT"
    VACUUM = "VACUUM"
    ANALYZE = "ANALYZE"
    EXPORT = "EXPORT"
    IMPORT = "IMPORT"


class SafeQueryValidator:
    """
    Validates SQL queries to ensure only SELECT statements are allowed.
    
    Features:
    - AST-based validation using sqlglot (primary)
    - Regex-based validation (fallback)
    - Detects dangerous operations in CTEs, subqueries, and nested statements
    - DuckDB dialect support
    - User-friendly error messages
    """
    
    def __init__(self, dialect: str = "duckdb", strict_mode: bool = True):
        """
        Initialize the validator.
        
        Args:
            dialect: SQL dialect to parse (default: "duckdb")
            strict_mode: If True, rejects any ambiguous or unparseable queries
        """
        self.dialect = dialect
        self.strict_mode = strict_mode
        
        # Get all dangerous operation keywords
        self.dangerous_keywords: Set[str] = {op.value for op in DangerousOperation}
        
        # Compile regex patterns for fallback validation
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile regex patterns for dangerous operations detection."""
        # Pattern to match dangerous keywords at statement boundaries
        keywords = '|'.join(re.escape(kw) for kw in self.dangerous_keywords)
        
        # Match keywords at the start of a statement or after semicolons
        self.dangerous_pattern = re.compile(
            rf'\b(?:{keywords})\b',
            re.IGNORECASE | re.MULTILINE
        )
        
        # Pattern to detect multiple statements (semicolons)
        self.multi_statement_pattern = re.compile(r';\s*\w', re.MULTILINE)
    
    def validate(self, query: str) -> None:
        """
        Validate that a query is a safe SELECT statement.
        
        Args:
            query: SQL query string to validate
            
        Raises:
            QueryValidationError: If the query contains dangerous operations
        """
        if not query or not query.strip():
            raise QueryValidationError("Empty query provided")
        
        query = query.strip()
        
        # Try AST-based validation first (most reliable)
        if SQLGLOT_AVAILABLE:
            self._validate_with_sqlglot(query)
        else:
            # Fall back to regex-based validation
            self._validate_with_regex(query)
    
    def _validate_with_sqlglot(self, query: str) -> None:
        """
        Validate query using sqlglot AST parsing.
        
        This is the most reliable method as it understands SQL structure.
        """
        try:
            # Parse the query into an AST
            parsed = parse_one(query, dialect=self.dialect)
        except ParseError as e:
            if self.strict_mode:
                raise QueryValidationError(
                    f"Query parsing failed: {str(e)}. "
                    "Please check your SQL syntax."
                )
            # In non-strict mode, fall back to regex validation
            self._validate_with_regex(query)
            return
        
        # Check if the root statement is a SELECT
        if not isinstance(parsed, exp.Select):
            statement_type = type(parsed).__name__
            raise QueryValidationError(
                f"Only SELECT queries are allowed. "
                f"Found: {statement_type} statement. "
                "Please modify your query to only retrieve data."
            )
        
        # Traverse the AST to check for dangerous operations in subqueries/CTEs
        self._check_ast_for_dangerous_operations(parsed)
    
    def _check_ast_for_dangerous_operations(self, node: exp.Expression) -> None:
        """
        Recursively check AST nodes for dangerous operations.
        
        This catches dangerous operations hidden in:
        - Common Table Expressions (CTEs)
        - Subqueries
        - Nested SELECT statements
        """
        # Define dangerous expression types to block
        dangerous_types = (
            exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Create,
            exp.Alter, exp.Merge, exp.Truncate, exp.Grant, exp.Revoke,
            exp.Command,  # Catches COPY, LOAD, INSTALL, etc.
        )
        
        # Check if current node is dangerous
        if isinstance(node, dangerous_types):
            operation = type(node).__name__
            raise QueryValidationError(
                f"Dangerous operation detected: {operation}. "
                "Only SELECT queries are permitted. "
                "Please remove any data modification statements."
            )
        
        # Check for function calls that might be dangerous
        if isinstance(node, exp.Anonymous):
            func_name = node.this.upper() if hasattr(node, 'this') else ''
            if func_name in self.dangerous_keywords:
                raise QueryValidationError(
                    f"Dangerous function call detected: {func_name}(). "
                    "This function is not allowed in queries."
                )
        
        # Recursively check all child nodes
        for child in node.iter_expressions():
            self._check_ast_for_dangerous_operations(child)
    
    def _validate_with_regex(self, query: str) -> None:
        """
        Validate query using regex patterns (fallback method).
        
        This is less reliable than AST parsing but works without sqlglot.
        """
        # Remove SQL comments to avoid false positives
        query_no_comments = self._remove_sql_comments(query)
        
        # Check for multiple statements
        if self.multi_statement_pattern.search(query_no_comments):
            raise QueryValidationError(
                "Multiple SQL statements detected (semicolon found). "
                "Only single SELECT queries are allowed."
            )
        
        # Check for dangerous keywords
        match = self.dangerous_pattern.search(query_no_comments)
        if match:
            keyword = match.group(0).upper()
            raise QueryValidationError(
                f"Dangerous SQL operation detected: {keyword}. "
                "Only SELECT queries are allowed. "
                "Please remove any data modification or administrative commands."
            )
        
        # Ensure query starts with SELECT (after whitespace)
        first_keyword = self._get_first_keyword(query_no_comments)
        if first_keyword != "SELECT":
            raise QueryValidationError(
                f"Query must start with SELECT. Found: {first_keyword or 'unknown'}. "
                "Only data retrieval queries are permitted."
            )
    
    def _remove_sql_comments(self, query: str) -> str:
        """Remove SQL comments from query to avoid false positives."""
        # Remove single-line comments (-- style)
        query = re.sub(r'--[^\n]*', '', query)
        
        # Remove multi-line comments (/* */ style)
        query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
        
        return query
    
    def _get_first_keyword(self, query: str) -> Optional[str]:
        """Extract the first SQL keyword from a query."""
        # Match first word after optional whitespace
        match = re.match(r'\s*(\w+)', query, re.IGNORECASE)
        return match.group(1).upper() if match else None
    
    def validate_and_explain(self, query: str) -> Tuple[bool, Optional[str]]:
        """
        Validate a query and return detailed result.
        
        Args:
            query: SQL query to validate
            
        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if query is safe, False otherwise
            - error_message: None if valid, error description if invalid
        """
        try:
            self.validate(query)
            return (True, None)
        except QueryValidationError as e:
            return (False, str(e))


# ============================================================================
# DuckDB-specific Safe Query Executor
# ============================================================================

class SafeDuckDBExecutor:
    """
    Safe executor for DuckDB queries with built-in validation.
    
    Usage:
        import duckdb
        
        conn = duckdb.connect("access_data.db")
        executor = SafeDuckDBExecutor(conn)
        
        try:
            result = executor.execute_safe_query(user_query)
            # Process result
        except QueryValidationError as e:
            # Handle validation error
    """
    
    def __init__(self, connection, validator: Optional[SafeQueryValidator] = None):
        """
        Initialize the safe executor.
        
        Args:
            connection: DuckDB connection object
            validator: Optional custom validator (uses default if None)
        """
        self.connection = connection
        self.validator = validator or SafeQueryValidator(dialect="duckdb")
    
    def execute_safe_query(self, query: str, params: Optional[dict] = None):
        """
        Execute a validated SELECT query safely.
        
        Args:
            query: SQL query to execute
            params: Optional parameters for parameterized queries
            
        Returns:
            Query result (DuckDB relation or result set)
            
        Raises:
            QueryValidationError: If query validation fails
        """
        # Validate the query first
        self.validator.validate(query)
        
        # Execute the validated query
        try:
            if params:
                # Use parameterized query if params provided
                return self.connection.execute(query, params).fetchall()
            else:
                return self.connection.execute(query).fetchall()
        except Exception as e:
            # Wrap DuckDB execution errors with context
            raise Exception(f"Query execution failed: {str(e)}") from e
    
    def execute_safe_query_to_df(self, query: str):
        """
        Execute a validated query and return as pandas DataFrame.
        
        Args:
            query: SQL query to execute
            
        Returns:
            pandas DataFrame with query results
        """
        self.validator.validate(query)
        
        try:
            return self.connection.execute(query).df()
        except Exception as e:
            raise Exception(f"Query execution failed: {str(e)}") from e


# ============================================================================
# Example Usage and Tests
# ============================================================================

def example_usage():
    """Example usage of the validator."""
    validator = SafeQueryValidator()
    
    # Valid SELECT queries
    valid_queries = [
        "SELECT * FROM users",
        "SELECT name, email FROM users WHERE active = true",
        """
        WITH recent_users AS (
            SELECT * FROM users WHERE created_at > '2024-01-01'
        )
        SELECT * FROM recent_users
        """,
        "SELECT COUNT(*) FROM access_logs WHERE timestamp > '2024-01-01'",
    ]
    
    # Invalid queries
    invalid_queries = [
        "DELETE FROM users WHERE id = 1",
        "UPDATE users SET active = false WHERE id = 1",
        "DROP TABLE users",
        "INSERT INTO users (name) VALUES ('hacker')",
        "SELECT * FROM users; DROP TABLE users;",
        """
        WITH evil AS (
            DELETE FROM users WHERE TRUE
        )
        SELECT * FROM evil
        """,
        "CREATE TABLE hackers (id INT)",
        "ALTER TABLE users ADD COLUMN hacked BOOLEAN",
    ]
    
    print("=" * 60)
    print("VALID QUERIES")
    print("=" * 60)
    for query in valid_queries:
        is_valid, error = validator.validate_and_explain(query)
        status = "✓ PASS" if is_valid else f"✗ FAIL: {error}"
        print(f"\nQuery: {query[:50]}...")
        print(f"Status: {status}")
    
    print("\n" + "=" * 60)
    print("INVALID QUERIES")
    print("=" * 60)
    for query in invalid_queries:
        is_valid, error = validator.validate_and_explain(query)
        status = "✓ PASS" if is_valid else f"✗ FAIL: {error}"
        print(f"\nQuery: {query[:50]}...")
        print(f"Status: {status}")


def example_duckdb_integration():
    """Example of integrating with DuckDB."""
    try:
        import duckdb
    except ImportError:
        print("DuckDB not installed. Install with: pip install duckdb")
        return
    
    # Create in-memory database with sample data
    conn = duckdb.connect(":memory:")
    conn.execute("""
        CREATE TABLE users (
            id INTEGER,
            name VARCHAR,
            email VARCHAR,
            active BOOLEAN
        )
    """)
    conn.execute("""
        INSERT INTO users VALUES
            (1, 'Alice', 'alice@example.com', true),
            (2, 'Bob', 'bob@example.com', true),
            (3, 'Charlie', 'charlie@example.com', false)
    """)
    
    # Create safe executor
    executor = SafeDuckDBExecutor(conn)
    
    # Safe query execution
    print("\n" + "=" * 60)
    print("SAFE DUCKDB EXECUTION EXAMPLES")
    print("=" * 60)
    
    try:
        # Valid query
        print("\n1. Valid SELECT query:")
        result = executor.execute_safe_query("SELECT * FROM users WHERE active = true")
        print(f"   Result: {result}")
        
        # Invalid query (should fail)
        print("\n2. Invalid DELETE query:")
        result = executor.execute_safe_query("DELETE FROM users WHERE id = 1")
        print(f"   Result: {result}")
    except QueryValidationError as e:
        print(f"   ✓ Correctly blocked: {e}")
    except Exception as e:
        print(f"   Error: {e}")


if __name__ == "__main__":
    print("SQL Query Validator - Production Ready Implementation\n")
    
    if not SQLGLOT_AVAILABLE:
        print("WARNING: sqlglot not installed. Using fallback regex validation.")
        print("Install with: pip install sqlglot\n")
    
    example_usage()
    example_duckdb_integration()

"""
Test Suite for SQL Query Validator

This file contains comprehensive tests for the SafeQueryValidator
and SafeDuckDBExecutor classes.

Run tests with:
    python -m pytest test_sql_validator.py -v

Or run directly:
    python test_sql_validator.py
"""

import sys
import pytest
from sql_query_validator import (
    SafeQueryValidator,
    SafeDuckDBExecutor,
    QueryValidationError,
    DangerousOperation
)


class TestSafeQueryValidator:
    """Test cases for SafeQueryValidator."""
    
    @pytest.fixture
    def validator(self):
        """Create a validator instance for testing."""
        return SafeQueryValidator(dialect="duckdb", strict_mode=True)
    
    # ========================================================================
    # Valid SELECT Queries
    # ========================================================================
    
    def test_basic_select(self, validator):
        """Test basic SELECT query."""
        validator.validate("SELECT * FROM users")
        validator.validate("SELECT id, name FROM users")
        validator.validate("select * from users")  # lowercase
    
    def test_select_with_where(self, validator):
        """Test SELECT with WHERE clause."""
        validator.validate("SELECT * FROM users WHERE active = true")
        validator.validate("SELECT * FROM users WHERE id IN (1, 2, 3)")
        validator.validate("SELECT * FROM users WHERE name LIKE '%admin%'")
    
    def test_select_with_join(self, validator):
        """Test SELECT with JOINs."""
        validator.validate("""
            SELECT u.name, l.timestamp
            FROM users u
            JOIN logs l ON u.id = l.user_id
        """)
        
        validator.validate("""
            SELECT *
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            INNER JOIN products p ON o.product_id = p.id
        """)
    
    def test_select_with_aggregation(self, validator):
        """Test SELECT with aggregate functions."""
        validator.validate("SELECT COUNT(*) FROM users")
        validator.validate("SELECT AVG(price), SUM(quantity) FROM orders")
        validator.validate("""
            SELECT category, COUNT(*), AVG(price)
            FROM products
            GROUP BY category
            HAVING COUNT(*) > 10
        """)
    
    def test_select_with_order_limit(self, validator):
        """Test SELECT with ORDER BY and LIMIT."""
        validator.validate("SELECT * FROM users ORDER BY created_at DESC")
        validator.validate("SELECT * FROM users LIMIT 100")
        validator.validate("SELECT * FROM users ORDER BY name LIMIT 10 OFFSET 20")
    
    def test_select_with_cte(self, validator):
        """Test SELECT with Common Table Expressions."""
        validator.validate("""
            WITH recent_users AS (
                SELECT * FROM users WHERE created_at > '2024-01-01'
            )
            SELECT * FROM recent_users
        """)
        
        validator.validate("""
            WITH 
                active_users AS (SELECT * FROM users WHERE active = true),
                recent_orders AS (SELECT * FROM orders WHERE date > '2024-01-01')
            SELECT u.name, o.total
            FROM active_users u
            JOIN recent_orders o ON u.id = o.user_id
        """)
    
    def test_select_with_subquery(self, validator):
        """Test SELECT with subqueries."""
        validator.validate("""
            SELECT * FROM users
            WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)
        """)
        
        validator.validate("""
            SELECT u.name, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
            FROM users u
        """)
    
    # ========================================================================
    # Invalid Queries - DML Operations
    # ========================================================================
    
    def test_reject_insert(self, validator):
        """Test that INSERT is blocked."""
        with pytest.raises(QueryValidationError, match="INSERT|Dangerous"):
            validator.validate("INSERT INTO users (name) VALUES ('hacker')")
        
        with pytest.raises(QueryValidationError):
            validator.validate("INSERT INTO users SELECT * FROM temp_users")
    
    def test_reject_update(self, validator):
        """Test that UPDATE is blocked."""
        with pytest.raises(QueryValidationError, match="UPDATE|Dangerous"):
            validator.validate("UPDATE users SET active = false WHERE id = 1")
        
        with pytest.raises(QueryValidationError):
            validator.validate("UPDATE users SET password = 'hacked'")
    
    def test_reject_delete(self, validator):
        """Test that DELETE is blocked."""
        with pytest.raises(QueryValidationError, match="DELETE|Dangerous"):
            validator.validate("DELETE FROM users WHERE id = 1")
        
        with pytest.raises(QueryValidationError):
            validator.validate("DELETE FROM users")
    
    def test_reject_merge(self, validator):
        """Test that MERGE is blocked."""
        with pytest.raises(QueryValidationError, match="MERGE|Dangerous"):
            validator.validate("""
                MERGE INTO users USING temp_users ON users.id = temp_users.id
                WHEN MATCHED THEN UPDATE SET name = temp_users.name
            """)
    
    def test_reject_truncate(self, validator):
        """Test that TRUNCATE is blocked."""
        with pytest.raises(QueryValidationError, match="TRUNCATE|Dangerous"):
            validator.validate("TRUNCATE TABLE users")
    
    # ========================================================================
    # Invalid Queries - DDL Operations
    # ========================================================================
    
    def test_reject_create(self, validator):
        """Test that CREATE is blocked."""
        with pytest.raises(QueryValidationError, match="CREATE|Dangerous"):
            validator.validate("CREATE TABLE hackers (id INT)")
        
        with pytest.raises(QueryValidationError):
            validator.validate("CREATE VIEW admin_view AS SELECT * FROM users")
    
    def test_reject_alter(self, validator):
        """Test that ALTER is blocked."""
        with pytest.raises(QueryValidationError, match="ALTER|Dangerous"):
            validator.validate("ALTER TABLE users ADD COLUMN hacked BOOLEAN")
        
        with pytest.raises(QueryValidationError):
            validator.validate("ALTER TABLE users DROP COLUMN password")
    
    def test_reject_drop(self, validator):
        """Test that DROP is blocked."""
        with pytest.raises(QueryValidationError, match="DROP|Dangerous"):
            validator.validate("DROP TABLE users")
        
        with pytest.raises(QueryValidationError):
            validator.validate("DROP VIEW admin_view")
        
        with pytest.raises(QueryValidationError):
            validator.validate("DROP DATABASE production")
    
    # ========================================================================
    # Invalid Queries - Administrative Operations
    # ========================================================================
    
    def test_reject_grant_revoke(self, validator):
        """Test that GRANT/REVOKE are blocked."""
        with pytest.raises(QueryValidationError, match="GRANT|REVOKE|Dangerous"):
            validator.validate("GRANT ALL ON users TO hacker")
        
        with pytest.raises(QueryValidationError):
            validator.validate("REVOKE SELECT ON users FROM public")
    
    def test_reject_execute_call(self, validator):
        """Test that EXECUTE/CALL are blocked."""
        with pytest.raises(QueryValidationError, match="EXECUTE|CALL|Dangerous"):
            validator.validate("EXECUTE dangerous_procedure()")
        
        with pytest.raises(QueryValidationError):
            validator.validate("CALL malicious_function()")
    
    # ========================================================================
    # Invalid Queries - DuckDB-Specific Operations
    # ========================================================================
    
    def test_reject_copy(self, validator):
        """Test that COPY is blocked."""
        with pytest.raises(QueryValidationError, match="COPY|Dangerous"):
            validator.validate("COPY users TO '/tmp/stolen_data.csv'")
    
    def test_reject_load_install(self, validator):
        """Test that LOAD/INSTALL are blocked."""
        with pytest.raises(QueryValidationError, match="LOAD|INSTALL|Dangerous"):
            validator.validate("LOAD 'malicious_extension'")
        
        with pytest.raises(QueryValidationError):
            validator.validate("INSTALL malicious_extension")
    
    def test_reject_attach_detach(self, validator):
        """Test that ATTACH/DETACH are blocked."""
        with pytest.raises(QueryValidationError, match="ATTACH|DETACH|Dangerous"):
            validator.validate("ATTACH 'other_db.duckdb' AS other")
        
        with pytest.raises(QueryValidationError):
            validator.validate("DETACH other")
    
    def test_reject_pragma(self, validator):
        """Test that PRAGMA is blocked."""
        with pytest.raises(QueryValidationError, match="PRAGMA|SET|Dangerous"):
            validator.validate("PRAGMA threads=100")
    
    # ========================================================================
    # Invalid Queries - Multiple Statements
    # ========================================================================
    
    def test_reject_multiple_statements(self, validator):
        """Test that multiple statements are blocked."""
        with pytest.raises(QueryValidationError):
            validator.validate("SELECT * FROM users; DROP TABLE users;")
        
        with pytest.raises(QueryValidationError):
            validator.validate("SELECT * FROM users; DELETE FROM users;")
    
    # ========================================================================
    # Invalid Queries - Nested Dangerous Operations
    # ========================================================================
    
    def test_reject_dangerous_in_cte(self, validator):
        """Test that dangerous operations in CTEs are blocked."""
        with pytest.raises(QueryValidationError, match="Dangerous"):
            validator.validate("""
                WITH evil AS (
                    DELETE FROM users WHERE TRUE
                )
                SELECT * FROM evil
            """)
        
        with pytest.raises(QueryValidationError):
            validator.validate("""
                WITH evil AS (
                    UPDATE users SET admin = TRUE
                )
                SELECT * FROM users
            """)
    
    def test_reject_dangerous_in_subquery(self, validator):
        """Test that dangerous operations in subqueries are blocked."""
        with pytest.raises(QueryValidationError):
            validator.validate("""
                SELECT * FROM (
                    INSERT INTO users VALUES (1, 'hacker')
                )
            """)
    
    # ========================================================================
    # Edge Cases
    # ========================================================================
    
    def test_empty_query(self, validator):
        """Test that empty queries are rejected."""
        with pytest.raises(QueryValidationError, match="Empty"):
            validator.validate("")
        
        with pytest.raises(QueryValidationError):
            validator.validate("   ")
    
    def test_case_insensitive(self, validator):
        """Test that validation is case-insensitive."""
        # Valid
        validator.validate("select * from users")
        validator.validate("SeLeCt * FrOm users")
        
        # Invalid
        with pytest.raises(QueryValidationError):
            validator.validate("delete from users")
        
        with pytest.raises(QueryValidationError):
            validator.validate("DeLeTe FrOm users")
    
    def test_comments(self, validator):
        """Test queries with comments."""
        # Comments should not affect validation
        validator.validate("-- This is a comment\nSELECT * FROM users")
        validator.validate("/* Multi-line\n   comment */\nSELECT * FROM users")
        
        # Dangerous operations in comments should not be blocked
        # (but the actual operation should be blocked if present)
        validator.validate("SELECT * FROM users -- DELETE FROM users")
    
    # ========================================================================
    # Validation Explanation Tests
    # ========================================================================
    
    def test_validate_and_explain_valid(self, validator):
        """Test validate_and_explain for valid queries."""
        is_valid, error = validator.validate_and_explain("SELECT * FROM users")
        assert is_valid is True
        assert error is None
    
    def test_validate_and_explain_invalid(self, validator):
        """Test validate_and_explain for invalid queries."""
        is_valid, error = validator.validate_and_explain("DELETE FROM users")
        assert is_valid is False
        assert error is not None
        assert "DELETE" in error or "Dangerous" in error


class TestSafeDuckDBExecutor:
    """Test cases for SafeDuckDBExecutor with actual DuckDB."""
    
    @pytest.fixture
    def duckdb_conn(self):
        """Create an in-memory DuckDB connection with test data."""
        try:
            import duckdb
        except ImportError:
            pytest.skip("DuckDB not installed")
        
        conn = duckdb.connect(":memory:")
        
        # Create test table
        conn.execute("""
            CREATE TABLE users (
                id INTEGER,
                name VARCHAR,
                email VARCHAR,
                active BOOLEAN
            )
        """)
        
        # Insert test data
        conn.execute("""
            INSERT INTO users VALUES
                (1, 'Alice', 'alice@example.com', true),
                (2, 'Bob', 'bob@example.com', true),
                (3, 'Charlie', 'charlie@example.com', false)
        """)
        
        return conn
    
    @pytest.fixture
    def executor(self, duckdb_conn):
        """Create a SafeDuckDBExecutor instance."""
        return SafeDuckDBExecutor(duckdb_conn)
    
    def test_execute_valid_query(self, executor):
        """Test executing a valid SELECT query."""
        result = executor.execute_safe_query("SELECT * FROM users")
        assert len(result) == 3
    
    def test_execute_with_filter(self, executor):
        """Test executing SELECT with WHERE clause."""
        result = executor.execute_safe_query("SELECT * FROM users WHERE active = true")
        assert len(result) == 2
    
    def test_execute_aggregation(self, executor):
        """Test executing aggregation query."""
        result = executor.execute_safe_query("SELECT COUNT(*) as count FROM users")
        assert result[0][0] == 3
    
    def test_reject_dangerous_query(self, executor):
        """Test that dangerous queries are rejected."""
        with pytest.raises(QueryValidationError):
            executor.execute_safe_query("DELETE FROM users WHERE id = 1")
    
    def test_execute_to_df(self, executor):
        """Test executing query and returning DataFrame."""
        try:
            df = executor.execute_safe_query_to_df("SELECT * FROM users")
            assert len(df) == 3
            assert 'name' in df.columns
        except ImportError:
            pytest.skip("Pandas not installed")


# ============================================================================
# Manual Test Runner (for running without pytest)
# ============================================================================

def run_manual_tests():
    """Run tests manually without pytest."""
    print("=" * 70)
    print("SQL QUERY VALIDATOR TEST SUITE")
    print("=" * 70)
    
    validator = SafeQueryValidator()
    
    test_cases = [
        # Valid queries
        ("Valid: Basic SELECT", "SELECT * FROM users", True),
        ("Valid: SELECT with WHERE", "SELECT * FROM users WHERE active = true", True),
        ("Valid: SELECT with JOIN", "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id", True),
        ("Valid: SELECT with CTE", "WITH t AS (SELECT * FROM users) SELECT * FROM t", True),
        
        # Invalid queries
        ("Invalid: DELETE", "DELETE FROM users WHERE id = 1", False),
        ("Invalid: UPDATE", "UPDATE users SET active = false", False),
        ("Invalid: DROP", "DROP TABLE users", False),
        ("Invalid: INSERT", "INSERT INTO users VALUES (1, 'hacker')", False),
        ("Invalid: Multiple statements", "SELECT * FROM users; DROP TABLE users;", False),
        ("Invalid: Dangerous in CTE", "WITH evil AS (DELETE FROM users) SELECT * FROM evil", False),
    ]
    
    passed = 0
    failed = 0
    
    for name, query, should_be_valid in test_cases:
        is_valid, error = validator.validate_and_explain(query)
        
        if is_valid == should_be_valid:
            status = "✓ PASS"
            passed += 1
        else:
            status = "✗ FAIL"
            failed += 1
        
        print(f"\n{status} - {name}")
        print(f"  Query: {query[:60]}...")
        if not is_valid:
            print(f"  Error: {error}")
    
    print("\n" + "=" * 70)
    print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    print("=" * 70)
    
    return failed == 0


if __name__ == "__main__":
    # If pytest is available, use it
    try:
        import pytest
        sys.exit(pytest.main([__file__, "-v"]))
    except ImportError:
        # Otherwise run manual tests
        print("pytest not installed. Running manual tests...\n")
        success = run_manual_tests()
        sys.exit(0 if success else 1)

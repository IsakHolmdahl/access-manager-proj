"""
Complete Working Example: Safe SQL Query Execution System

This file demonstrates a complete, production-ready implementation
of safe SQL query execution with validation, error handling, and
user-friendly responses.

Run this file to see the validator in action:
    python example_complete.py
"""

# ============================================================================
# Part 1: Simple Validation Example
# ============================================================================

def simple_validation_example():
    """Demonstrate basic query validation."""
    from sql_query_validator import SafeQueryValidator, QueryValidationError
    
    print("=" * 70)
    print("SIMPLE VALIDATION EXAMPLE")
    print("=" * 70)
    
    validator = SafeQueryValidator()
    
    # Test queries
    queries = {
        "Valid SELECT": "SELECT * FROM users WHERE active = true",
        "Invalid DELETE": "DELETE FROM users WHERE id = 1",
        "Invalid with semicolon": "SELECT * FROM users; DROP TABLE users;",
    }
    
    for name, query in queries.items():
        print(f"\n{name}:")
        print(f"  Query: {query}")
        
        try:
            validator.validate(query)
            print("  ✓ Result: VALID - Safe to execute")
        except QueryValidationError as e:
            print(f"  ✗ Result: BLOCKED - {e}")


# ============================================================================
# Part 2: DuckDB Integration Example
# ============================================================================

def duckdb_integration_example():
    """Demonstrate safe query execution with DuckDB."""
    try:
        import duckdb
    except ImportError:
        print("\nDuckDB not installed. Skipping DuckDB example.")
        print("Install with: pip install duckdb")
        return
    
    from sql_query_validator import SafeDuckDBExecutor, QueryValidationError
    
    print("\n\n" + "=" * 70)
    print("DUCKDB INTEGRATION EXAMPLE")
    print("=" * 70)
    
    # Create in-memory database with sample data
    conn = duckdb.connect(":memory:")
    conn.execute("""
        CREATE TABLE access_logs (
            id INTEGER,
            user_id INTEGER,
            action VARCHAR,
            resource VARCHAR,
            timestamp TIMESTAMP
        )
    """)
    
    conn.execute("""
        INSERT INTO access_logs VALUES
            (1, 101, 'view', '/dashboard', '2024-01-15 10:30:00'),
            (2, 102, 'edit', '/settings', '2024-01-15 11:00:00'),
            (3, 101, 'delete', '/file.txt', '2024-01-15 11:30:00'),
            (4, 103, 'view', '/dashboard', '2024-01-15 12:00:00'),
            (5, 102, 'view', '/reports', '2024-01-15 12:30:00')
    """)
    
    # Create safe executor
    executor = SafeDuckDBExecutor(conn)
    
    # Test queries
    test_queries = [
        ("Count all logs", "SELECT COUNT(*) as total FROM access_logs"),
        ("Filter by user", "SELECT * FROM access_logs WHERE user_id = 101"),
        ("Group by action", "SELECT action, COUNT(*) as count FROM access_logs GROUP BY action"),
        ("Attempt DELETE", "DELETE FROM access_logs WHERE id = 1"),
    ]
    
    for name, query in test_queries:
        print(f"\n{name}:")
        print(f"  Query: {query}")
        
        try:
            result = executor.execute_safe_query(query)
            print(f"  ✓ Success: {len(result)} rows returned")
            if len(result) <= 5:
                for row in result:
                    print(f"    {row}")
        except QueryValidationError as e:
            print(f"  ✗ Blocked: {e}")
        except Exception as e:
            print(f"  ✗ Error: {e}")


# ============================================================================
# Part 3: API Endpoint Simulation
# ============================================================================

def api_endpoint_simulation():
    """Simulate an API endpoint handling user queries."""
    try:
        import duckdb
    except ImportError:
        print("\nDuckDB not installed. Skipping API example.")
        return
    
    from sql_query_validator import SafeDuckDBExecutor, QueryValidationError
    import json
    
    print("\n\n" + "=" * 70)
    print("API ENDPOINT SIMULATION")
    print("=" * 70)
    
    # Setup database
    conn = duckdb.connect(":memory:")
    conn.execute("CREATE TABLE users (id INT, name VARCHAR, email VARCHAR, active BOOL)")
    conn.execute("""
        INSERT INTO users VALUES
            (1, 'Alice', 'alice@example.com', true),
            (2, 'Bob', 'bob@example.com', true),
            (3, 'Charlie', 'charlie@example.com', false)
    """)
    
    executor = SafeDuckDBExecutor(conn)
    
    def handle_query_request(query: str) -> dict:
        """Simulate API endpoint handling a query request."""
        try:
            # Validate and execute
            result = executor.execute_safe_query(query)
            
            # Convert result to serializable format
            data = [list(row) for row in result]
            
            return {
                "success": True,
                "data": data,
                "row_count": len(result),
                "message": "Query executed successfully"
            }
            
        except QueryValidationError as e:
            return {
                "success": False,
                "error": "Validation Error",
                "message": str(e),
                "code": "QUERY_VALIDATION_FAILED"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "Execution Error",
                "message": str(e),
                "code": "QUERY_EXECUTION_FAILED"
            }
    
    # Simulate API requests
    requests = [
        "SELECT * FROM users WHERE active = true",
        "SELECT COUNT(*) FROM users",
        "DELETE FROM users WHERE id = 1",
    ]
    
    for i, query in enumerate(requests, 1):
        print(f"\nRequest #{i}:")
        print(f"  Query: {query}")
        
        response = handle_query_request(query)
        print(f"  Response: {json.dumps(response, indent=4)}")


# ============================================================================
# Part 4: Advanced Validation Examples
# ============================================================================

def advanced_validation_examples():
    """Demonstrate advanced validation scenarios."""
    from sql_query_validator import SafeQueryValidator, QueryValidationError
    
    print("\n\n" + "=" * 70)
    print("ADVANCED VALIDATION EXAMPLES")
    print("=" * 70)
    
    validator = SafeQueryValidator()
    
    # Complex queries that should be ALLOWED
    print("\n1. ALLOWED: Complex SELECT Queries")
    print("-" * 70)
    
    allowed_queries = [
        ("CTE with multiple selects", """
            WITH active_users AS (
                SELECT * FROM users WHERE active = true
            ),
            recent_logs AS (
                SELECT * FROM logs WHERE timestamp > '2024-01-01'
            )
            SELECT u.name, COUNT(l.id) as log_count
            FROM active_users u
            LEFT JOIN recent_logs l ON u.id = l.user_id
            GROUP BY u.name
        """),
        
        ("Nested subqueries", """
            SELECT *
            FROM users
            WHERE id IN (
                SELECT user_id 
                FROM orders 
                WHERE total > (SELECT AVG(total) FROM orders)
            )
        """),
        
        ("Window functions", """
            SELECT 
                name,
                salary,
                ROW_NUMBER() OVER (ORDER BY salary DESC) as rank
            FROM employees
        """),
    ]
    
    for name, query in allowed_queries:
        try:
            validator.validate(query)
            print(f"✓ {name}")
        except QueryValidationError as e:
            print(f"✗ {name}: {e}")
    
    # Sneaky attempts that should be BLOCKED
    print("\n2. BLOCKED: Sneaky Attack Attempts")
    print("-" * 70)
    
    blocked_queries = [
        ("DELETE in CTE", """
            WITH evil AS (DELETE FROM users RETURNING *)
            SELECT * FROM evil
        """),
        
        ("UPDATE in subquery", """
            SELECT * FROM (
                UPDATE users SET admin = true RETURNING *
            ) as evil
        """),
        
        ("Multiple statements", """
            SELECT * FROM users;
            DROP TABLE users;
        """),
        
        ("SQL injection attempt", """
            SELECT * FROM users WHERE name = 'admin' OR '1'='1';
            DROP TABLE users; --
        """),
    ]
    
    for name, query in blocked_queries:
        try:
            validator.validate(query)
            print(f"✗ {name}: SHOULD HAVE BEEN BLOCKED!")
        except QueryValidationError as e:
            print(f"✓ {name}: Correctly blocked")


# ============================================================================
# Part 5: Performance Test
# ============================================================================

def performance_test():
    """Test validation performance."""
    from sql_query_validator import SafeQueryValidator
    import time
    
    print("\n\n" + "=" * 70)
    print("PERFORMANCE TEST")
    print("=" * 70)
    
    validator = SafeQueryValidator()
    
    queries = [
        "SELECT * FROM users",
        "SELECT * FROM users WHERE active = true",
        "SELECT COUNT(*) FROM logs WHERE date > '2024-01-01'",
        """
        WITH recent AS (SELECT * FROM logs WHERE date > '2024-01-01')
        SELECT user_id, COUNT(*) FROM recent GROUP BY user_id
        """,
    ]
    
    iterations = 1000
    
    print(f"\nValidating {iterations} queries...")
    
    for query in queries:
        start_time = time.time()
        
        for _ in range(iterations):
            try:
                validator.validate(query)
            except Exception:
                pass
        
        elapsed = time.time() - start_time
        avg_time_ms = (elapsed / iterations) * 1000
        
        print(f"\n  Query: {query[:50]}...")
        print(f"  Average time: {avg_time_ms:.2f}ms per validation")
        print(f"  Total time: {elapsed:.2f}s for {iterations} validations")


# ============================================================================
# Part 6: User Guide
# ============================================================================

def print_user_guide():
    """Print a user guide for the validation system."""
    print("\n\n" + "=" * 70)
    print("USER GUIDE: What Queries Are Allowed?")
    print("=" * 70)
    
    print("""
    ✅ ALLOWED QUERIES (SELECT operations):
    
    • Basic SELECT:
      SELECT * FROM table
      SELECT column1, column2 FROM table
    
    • Filtering:
      SELECT * FROM table WHERE column = value
      SELECT * FROM table WHERE id IN (1, 2, 3)
      SELECT * FROM table WHERE name LIKE '%pattern%'
    
    • Joins:
      SELECT * FROM t1 JOIN t2 ON t1.id = t2.id
      SELECT * FROM t1 LEFT JOIN t2 ON t1.id = t2.id
    
    • Aggregations:
      SELECT COUNT(*) FROM table
      SELECT AVG(price), SUM(quantity) FROM table
      SELECT category, COUNT(*) FROM table GROUP BY category
    
    • Ordering & Limiting:
      SELECT * FROM table ORDER BY column DESC
      SELECT * FROM table LIMIT 100
      SELECT * FROM table LIMIT 10 OFFSET 20
    
    • Common Table Expressions (CTEs):
      WITH temp AS (SELECT * FROM table)
      SELECT * FROM temp
    
    • Subqueries:
      SELECT * FROM table WHERE id IN (SELECT id FROM other_table)
    
    ❌ BLOCKED QUERIES:
    
    • Data Modification:
      INSERT, UPDATE, DELETE, TRUNCATE, MERGE
    
    • Schema Changes:
      CREATE, ALTER, DROP, RENAME
    
    • Administrative:
      GRANT, REVOKE, EXECUTE, CALL, COPY, LOAD
    
    • Multiple Statements:
      Any query with semicolons (;)
    
    • Dangerous operations in CTEs/subqueries
    """)


# ============================================================================
# Main Execution
# ============================================================================

def main():
    """Run all examples."""
    print("\n")
    print("*" * 70)
    print("*" + " " * 68 + "*")
    print("*" + "  SAFE SQL QUERY EXECUTION SYSTEM - COMPLETE EXAMPLE  ".center(68) + "*")
    print("*" + " " * 68 + "*")
    print("*" * 70)
    
    try:
        # Run all examples
        simple_validation_example()
        duckdb_integration_example()
        api_endpoint_simulation()
        advanced_validation_examples()
        performance_test()
        print_user_guide()
        
        print("\n" + "=" * 70)
        print("ALL EXAMPLES COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print("""
        Next Steps:
        1. Review the code above to understand the implementation
        2. Read SQL_QUERY_VALIDATION_RESEARCH.md for detailed information
        3. Check QUICK_START.md for integration guide
        4. Run test_sql_validator.py to see comprehensive tests
        5. Integrate into your application
        """)
        
    except ImportError as e:
        print(f"\n\nError: Missing dependency - {e}")
        print("\nInstall required packages:")
        print("  pip install sqlglot duckdb")
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

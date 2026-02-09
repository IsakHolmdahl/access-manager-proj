# SQL Query Validation Research: Safe SELECT-Only Execution

## Executive Summary

This document provides research and recommendations for safely allowing custom SELECT queries in Python while blocking dangerous SQL operations (UPDATE, DELETE, DROP, etc.) to prevent SQL injection and unauthorized data modification.

**Recommended Approach:** Use **sqlglot** for AST-based validation with regex fallback

---

## 1. Library Comparison

### sqlglot (RECOMMENDED) ⭐

**Pros:**
- AST-based parsing - understands SQL structure, not just keywords
- Excellent dialect support (31+ dialects including DuckDB)
- Can detect dangerous operations in CTEs, subqueries, and nested statements
- Active development (2M+ downloads/month)
- Production-ready (used by Apache Superset, Dagster, Ibis)
- Can transpile between dialects if needed
- Zero dependencies

**Cons:**
- Slightly larger package (~1MB)
- May need error handling for very complex or invalid SQL

**Installation:**
```bash
pip install sqlglot
```

**Key Features:**
- Parse SQL into Abstract Syntax Tree (AST)
- Traverse tree to detect dangerous operations
- Type checking: `isinstance(node, exp.Select)`
- Catches nested dangerous statements

---

### sqlparse (ALTERNATIVE)

**Pros:**
- Lightweight (BSD license)
- Simple token-based parsing
- Good for basic SQL formatting
- Stable (been around since 2009)

**Cons:**
- ⚠️ NOT a true parser - uses tokenization only
- Cannot understand SQL structure (no AST)
- Misses dangerous operations in subqueries/CTEs
- No dialect-specific handling
- "Non-validating" by design

**Not Recommended for Security:** sqlparse cannot reliably detect all dangerous operations because it doesn't understand SQL semantics.

---

### Other Options

- **sqloxide** (Rust-based, very fast, but limited Python integration)
- **pglast** (PostgreSQL-specific, not suitable for DuckDB)
- **mo-sql-parsing** (Mozilla's parser, less maintained)

---

## 2. Validation Approaches

### Approach A: AST-Based Validation (RECOMMENDED)

Use sqlglot to parse SQL into an AST and check node types:

```python
import sqlglot
from sqlglot import parse_one, exp

def validate_select_only(query: str) -> bool:
    """Validate using AST parsing."""
    parsed = parse_one(query, dialect="duckdb")
    
    # Check root is SELECT
    if not isinstance(parsed, exp.Select):
        raise ValueError("Only SELECT allowed")
    
    # Check all subqueries/CTEs
    for node in parsed.walk():
        if isinstance(node, (exp.Insert, exp.Update, exp.Delete, 
                           exp.Drop, exp.Create, exp.Alter)):
            raise ValueError(f"Dangerous operation: {type(node).__name__}")
    
    return True
```

**Advantages:**
- Catches hidden operations in nested queries
- Understands SQL structure
- Dialect-aware

**Example Caught:**
```sql
WITH evil AS (DELETE FROM users) SELECT * FROM evil
```
This would bypass regex but sqlglot catches it.

---

### Approach B: Whitelist Keywords

Only allow queries starting with SELECT and containing safe keywords:

```python
ALLOWED_KEYWORDS = {
    "SELECT", "FROM", "WHERE", "JOIN", "ON", "GROUP", "BY",
    "HAVING", "ORDER", "LIMIT", "OFFSET", "WITH", "AS",
    "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN", "IS", "NULL"
}

def validate_whitelist(query: str) -> bool:
    """Check all keywords are in whitelist."""
    tokens = re.findall(r'\b[A-Z_]+\b', query.upper())
    for token in tokens:
        if token not in ALLOWED_KEYWORDS and not token.isdigit():
            raise ValueError(f"Keyword not allowed: {token}")
```

**Advantages:**
- Very restrictive (safest)
- Easy to understand

**Disadvantages:**
- May block legitimate queries
- Requires maintenance as SQL evolves
- Can't use functions like `CAST`, `COALESCE`, etc.

---

### Approach C: Blacklist Dangerous Keywords

Block known dangerous operations:

```python
DANGEROUS_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER",
    "TRUNCATE", "MERGE", "GRANT", "REVOKE", "EXECUTE"
]

def validate_blacklist(query: str) -> bool:
    """Block dangerous keywords."""
    query_upper = query.upper()
    for keyword in DANGEROUS_KEYWORDS:
        if re.search(rf'\b{keyword}\b', query_upper):
            raise ValueError(f"Operation not allowed: {keyword}")
```

**Advantages:**
- Simple to implement
- Allows most SELECT features

**Disadvantages:**
- Can be bypassed (comments, obfuscation)
- May miss dialect-specific operations
- Requires comprehensive list

---

### Approach D: Hybrid (PRODUCTION RECOMMENDATION)

Combine AST validation with blacklist fallback:

```python
def validate_hybrid(query: str, dialect: str = "duckdb") -> bool:
    """Use AST validation with regex fallback."""
    try:
        # Try AST parsing first
        parsed = parse_one(query, dialect=dialect)
        validate_ast(parsed)
    except ParseError:
        # Fall back to regex if parsing fails
        validate_blacklist(query)
    
    return True
```

This provides defense-in-depth.

---

## 3. DuckDB-Specific Considerations

### DuckDB Security Features

DuckDB has built-in security features:

1. **Read-only connections:**
   ```python
   conn = duckdb.connect("data.db", read_only=True)
   ```
   Even if validation fails, write operations will fail.

2. **No EXECUTE/CALL for UDFs by default**
   DuckDB doesn't allow arbitrary code execution without explicit registration.

3. **Extension loading requires explicit permission:**
   ```python
   conn = duckdb.connect(config={'allow_unsigned_extensions': 'false'})
   ```

### DuckDB-Specific Dangerous Operations

In addition to standard SQL, block these DuckDB operations:

- `COPY` - Can write files to disk
- `LOAD` / `INSTALL` - Load extensions
- `ATTACH` / `DETACH` - Attach other databases
- `PRAGMA` - Change configuration
- `CHECKPOINT` - Force write to disk
- `EXPORT` / `IMPORT` - Export/import database
- `VACUUM` - Reclaim space

---

## 4. Error Handling and User Feedback

### User-Friendly Error Messages

```python
ERROR_MESSAGES = {
    "DELETE": "Data deletion is not allowed. This endpoint only supports data retrieval.",
    "UPDATE": "Data modification is not allowed. Please use SELECT queries only.",
    "DROP": "Cannot drop tables or databases. Read-only access only.",
    "INSERT": "Cannot insert data. This endpoint is for querying existing data.",
    "MULTIPLE_STATEMENTS": "Only single SELECT queries are allowed. Remove semicolons.",
}

def format_error(operation: str) -> dict:
    """Return API-friendly error response."""
    return {
        "error": "Query Validation Failed",
        "message": ERROR_MESSAGES.get(operation, "Operation not allowed"),
        "allowed_operations": ["SELECT with WHERE, JOIN, GROUP BY, etc."],
        "documentation_url": "/docs/custom-queries"
    }
```

### Example API Response

```json
{
  "error": "Query Validation Failed",
  "message": "Data deletion is not allowed. This endpoint only supports data retrieval.",
  "details": {
    "detected_operation": "DELETE",
    "query_preview": "DELETE FROM users WHERE..."
  },
  "allowed_operations": [
    "SELECT with WHERE, JOIN, GROUP BY, ORDER BY",
    "Common Table Expressions (WITH)",
    "Aggregate functions (COUNT, SUM, AVG, etc.)"
  ],
  "examples": [
    "SELECT * FROM access_logs WHERE user_id = 123",
    "SELECT COUNT(*) FROM access_logs GROUP BY resource"
  ]
}
```

---

## 5. Production Implementation Pattern

### Flask/FastAPI Endpoint Example

```python
from flask import Flask, request, jsonify
import duckdb
from sql_query_validator import SafeDuckDBExecutor, QueryValidationError

app = Flask(__name__)

# Create read-only connection
db_conn = duckdb.connect("access_data.db", read_only=True)
executor = SafeDuckDBExecutor(db_conn)

@app.route("/api/custom-query", methods=["POST"])
def execute_custom_query():
    """Execute user-provided SELECT query."""
    query = request.json.get("query")
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        # Validate and execute
        result = executor.execute_safe_query(query)
        
        return jsonify({
            "success": True,
            "data": result,
            "row_count": len(result)
        })
        
    except QueryValidationError as e:
        # Validation failed - user error
        return jsonify({
            "error": "Query Validation Failed",
            "message": str(e),
            "query": query[:100]  # Preview only
        }), 400
        
    except Exception as e:
        # Execution failed - may be syntax error
        return jsonify({
            "error": "Query Execution Failed",
            "message": str(e),
            "hint": "Check your SQL syntax"
        }), 400

@app.route("/api/custom-query/validate", methods=["POST"])
def validate_query():
    """Validate query without executing."""
    query = request.json.get("query")
    
    validator = SafeQueryValidator()
    is_valid, error = validator.validate_and_explain(query)
    
    if is_valid:
        return jsonify({"valid": True, "message": "Query is safe to execute"})
    else:
        return jsonify({"valid": False, "error": error}), 400
```

---

## 6. Additional Security Layers

### Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route("/api/custom-query", methods=["POST"])
@limiter.limit("10 per minute")
def execute_custom_query():
    # ... implementation
```

### Query Timeout

```python
def execute_with_timeout(conn, query, timeout_seconds=30):
    """Execute query with timeout."""
    # DuckDB way
    conn.execute(f"SET max_memory='1GB'")
    conn.execute(f"SET threads=1")  # Limit resources
    
    # Use threading for timeout
    import threading
    result = [None]
    error = [None]
    
    def run_query():
        try:
            result[0] = conn.execute(query).fetchall()
        except Exception as e:
            error[0] = e
    
    thread = threading.Thread(target=run_query)
    thread.start()
    thread.join(timeout=timeout_seconds)
    
    if thread.is_alive():
        raise TimeoutError("Query exceeded time limit")
    
    if error[0]:
        raise error[0]
    
    return result[0]
```

### Resource Limits

```python
# Configure DuckDB with resource limits
conn = duckdb.connect("data.db", config={
    'max_memory': '1GB',
    'threads': 1,
    'max_expression_depth': 100
})
```

### Row Limit

```python
def execute_with_row_limit(query: str, max_rows: int = 10000):
    """Automatically limit result size."""
    # Check if query already has LIMIT
    if re.search(r'\bLIMIT\b', query, re.IGNORECASE):
        # User specified limit, respect it but cap at max
        # This requires parsing to modify LIMIT clause safely
        pass
    else:
        # Append LIMIT clause
        query = f"{query.rstrip(';')} LIMIT {max_rows}"
    
    return executor.execute_safe_query(query)
```

---

## 7. Testing Strategy

### Test Cases

```python
def test_validator():
    validator = SafeQueryValidator()
    
    # Test valid queries
    assert validator.validate("SELECT * FROM users")
    assert validator.validate("SELECT COUNT(*) FROM logs WHERE date > '2024-01-01'")
    assert validator.validate("""
        WITH recent AS (SELECT * FROM logs WHERE date > '2024-01-01')
        SELECT COUNT(*) FROM recent
    """)
    
    # Test invalid queries
    with pytest.raises(QueryValidationError):
        validator.validate("DELETE FROM users")
    
    with pytest.raises(QueryValidationError):
        validator.validate("SELECT * FROM users; DROP TABLE users;")
    
    with pytest.raises(QueryValidationError):
        validator.validate("""
            WITH evil AS (UPDATE users SET admin = TRUE)
            SELECT * FROM evil
        """)
    
    # Test edge cases
    with pytest.raises(QueryValidationError):
        validator.validate("SELECT * FROM users WHERE name = 'x'; DELETE FROM users")
    
    with pytest.raises(QueryValidationError):
        validator.validate("/* DELETE */ SELECT * FROM users")  # Should pass
```

### Fuzzing

```python
import random
import string

def fuzz_test_validator():
    """Test validator against random SQL-like strings."""
    validator = SafeQueryValidator()
    
    dangerous_keywords = ["DELETE", "DROP", "UPDATE", "INSERT"]
    
    for _ in range(1000):
        # Generate random query-like string
        query = "SELECT * FROM users WHERE " + ''.join(
            random.choices(string.ascii_letters, k=20)
        )
        
        # Occasionally inject dangerous keyword
        if random.random() < 0.1:
            keyword = random.choice(dangerous_keywords)
            query += f"; {keyword} FROM users"
        
        try:
            validator.validate(query)
        except QueryValidationError:
            # Good - caught dangerous operation
            pass
```

---

## 8. Deployment Checklist

- [ ] Install sqlglot: `pip install sqlglot`
- [ ] Create SafeQueryValidator instance with DuckDB dialect
- [ ] Use read-only database connections when possible
- [ ] Implement rate limiting on query endpoint
- [ ] Add query timeout (e.g., 30 seconds)
- [ ] Set resource limits (max_memory, threads)
- [ ] Add row limit (e.g., 10,000 rows)
- [ ] Log all query attempts (for security monitoring)
- [ ] Test with comprehensive test suite
- [ ] Document allowed query patterns for users
- [ ] Set up monitoring/alerting for validation failures
- [ ] Consider adding query caching for repeated queries

---

## 9. Conclusion

**Recommended Production Stack:**

1. **Primary Validation:** sqlglot AST-based parsing
2. **Fallback:** Regex blacklist validation
3. **Database Layer:** DuckDB read-only connection
4. **Application Layer:** Rate limiting + query timeout
5. **Monitoring:** Log all queries and validation failures

This provides defense-in-depth with multiple security layers. Even if validation is bypassed (unlikely with sqlglot), the read-only connection prevents data modification.

**Installation:**
```bash
pip install sqlglot duckdb flask-limiter
```

**Key Files:**
- `sql_query_validator.py` - Core validation logic
- See implementation for production-ready code

---

## References

- [sqlglot Documentation](https://sqlglot.com/sqlglot.html)
- [sqlglot GitHub](https://github.com/tobymao/sqlglot)
- [DuckDB Python API](https://duckdb.org/docs/api/python/overview)
- [DuckDB Security](https://duckdb.org/docs/operations_manual/securing_duckdb/overview)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

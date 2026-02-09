# Quick Start Guide: Safe SQL Query Execution

## Installation

```bash
# Install required dependencies
pip install sqlglot duckdb

# Optional: for Flask API integration
pip install flask flask-limiter
```

## Basic Usage

### 1. Simple Validation

```python
from sql_query_validator import SafeQueryValidator, QueryValidationError

# Create validator
validator = SafeQueryValidator()

# Validate a query
try:
    validator.validate("SELECT * FROM users WHERE active = true")
    print("✓ Query is safe!")
except QueryValidationError as e:
    print(f"✗ Blocked: {e}")
```

### 2. DuckDB Integration

```python
import duckdb
from sql_query_validator import SafeDuckDBExecutor, QueryValidationError

# Connect to database (read-only recommended)
conn = duckdb.connect("access_data.db", read_only=True)

# Create safe executor
executor = SafeDuckDBExecutor(conn)

# Execute user query safely
user_query = "SELECT * FROM access_logs WHERE user_id = 123"

try:
    result = executor.execute_safe_query(user_query)
    print(f"Success! Got {len(result)} rows")
    print(result)
except QueryValidationError as e:
    print(f"Validation failed: {e}")
except Exception as e:
    print(f"Execution failed: {e}")
```

### 3. Flask API Endpoint

```python
from flask import Flask, request, jsonify
import duckdb
from sql_query_validator import SafeDuckDBExecutor, QueryValidationError

app = Flask(__name__)

# Initialize database connection
db_conn = duckdb.connect("access_data.db", read_only=True)
executor = SafeDuckDBExecutor(db_conn)

@app.route("/api/query", methods=["POST"])
def execute_query():
    """Execute user-provided SELECT query."""
    data = request.get_json()
    query = data.get("query")
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    try:
        # Validate and execute
        result = executor.execute_safe_query(query)
        
        return jsonify({
            "success": True,
            "data": result,
            "row_count": len(result)
        })
        
    except QueryValidationError as e:
        return jsonify({
            "error": "Query validation failed",
            "message": str(e)
        }), 400
        
    except Exception as e:
        return jsonify({
            "error": "Query execution failed",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True)
```

### 4. Testing Queries

```python
from sql_query_validator import SafeQueryValidator

validator = SafeQueryValidator()

# Test different queries
test_queries = {
    "Valid SELECT": "SELECT * FROM users",
    "Valid with WHERE": "SELECT * FROM users WHERE active = true",
    "Valid with JOIN": """
        SELECT u.name, l.timestamp 
        FROM users u 
        JOIN logs l ON u.id = l.user_id
    """,
    "Invalid DELETE": "DELETE FROM users WHERE id = 1",
    "Invalid UPDATE": "UPDATE users SET active = false",
    "Invalid with semicolon": "SELECT * FROM users; DROP TABLE users;",
}

for name, query in test_queries.items():
    is_valid, error = validator.validate_and_explain(query)
    print(f"\n{name}:")
    print(f"  Query: {query[:60]}...")
    if is_valid:
        print("  ✓ Valid")
    else:
        print(f"  ✗ Blocked: {error}")
```

## What Queries Are Allowed?

### ✅ Allowed (SELECT operations)

- Basic SELECT: `SELECT * FROM table`
- Filtering: `SELECT * FROM table WHERE column = value`
- Joins: `SELECT * FROM t1 JOIN t2 ON t1.id = t2.id`
- Aggregations: `SELECT COUNT(*), AVG(price) FROM orders`
- Grouping: `SELECT category, COUNT(*) FROM products GROUP BY category`
- Ordering: `SELECT * FROM users ORDER BY created_at DESC`
- Limiting: `SELECT * FROM logs LIMIT 100`
- CTEs: `WITH temp AS (SELECT * FROM table) SELECT * FROM temp`
- Subqueries: `SELECT * FROM (SELECT * FROM table) sub`

### ❌ Blocked (Dangerous operations)

- **Data Modification:**
  - `INSERT INTO users VALUES (...)`
  - `UPDATE users SET column = value`
  - `DELETE FROM users WHERE condition`
  - `TRUNCATE TABLE users`
  - `MERGE INTO ...`

- **Schema Changes:**
  - `CREATE TABLE new_table (...)`
  - `ALTER TABLE users ADD COLUMN ...`
  - `DROP TABLE users`
  - `RENAME TABLE old TO new`

- **Administrative:**
  - `GRANT/REVOKE permissions`
  - `CALL stored_procedure()`
  - `EXECUTE ...`
  - `COPY table TO 'file.csv'`
  - `LOAD/INSTALL extensions`
  - `ATTACH/DETACH databases`
  - `PRAGMA settings`

- **Multiple statements:**
  - `SELECT * FROM users; DROP TABLE users;`

## API Request Examples

### Valid Request

```bash
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM access_logs WHERE timestamp > '\''2024-01-01'\'' LIMIT 10"
  }'
```

Response:
```json
{
  "success": true,
  "data": [
    {"id": 1, "user_id": 123, "action": "login", "timestamp": "2024-01-02"},
    {"id": 2, "user_id": 456, "action": "view", "timestamp": "2024-01-03"}
  ],
  "row_count": 2
}
```

### Invalid Request

```bash
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "DELETE FROM access_logs WHERE id = 1"
  }'
```

Response:
```json
{
  "error": "Query validation failed",
  "message": "Dangerous operation detected: Delete. Only SELECT queries are permitted."
}
```

## Advanced Configuration

### Custom Validator Settings

```python
from sql_query_validator import SafeQueryValidator

# Strict mode: reject unparseable queries
validator = SafeQueryValidator(
    dialect="duckdb",
    strict_mode=True
)

# Non-strict mode: fall back to regex if parsing fails
validator = SafeQueryValidator(
    dialect="duckdb",
    strict_mode=False
)
```

### DuckDB Connection Options

```python
import duckdb

# Read-only connection (recommended)
conn = duckdb.connect("data.db", read_only=True)

# In-memory with resource limits
conn = duckdb.connect(":memory:", config={
    'max_memory': '1GB',
    'threads': 1,
    'max_expression_depth': 100
})

# With custom timeout
conn.execute("SET statement_timeout='30s'")
```

### Rate Limiting (Flask)

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route("/api/query", methods=["POST"])
@limiter.limit("10 per minute")
def execute_query():
    # ... implementation
```

## Troubleshooting

### Issue: "sqlglot not found"

```bash
pip install sqlglot
```

If sqlglot is not available, the validator will fall back to regex-based validation (less secure).

### Issue: "Query parsing failed"

This means your SQL syntax is invalid. Check for:
- Missing closing parentheses
- Typos in keywords
- Invalid table/column names

### Issue: "Dangerous operation detected"

Your query contains a blocked operation. Only SELECT queries are allowed. Common mistakes:
- Using INSERT, UPDATE, DELETE
- Multiple statements with semicolons
- Dangerous operations in CTEs/subqueries

### Issue: "Query execution failed"

The query is valid but DuckDB couldn't execute it:
- Table doesn't exist
- Column doesn't exist
- Type mismatch
- Permission denied (if not using read-only mode)

## Security Best Practices

1. **Use read-only connections:**
   ```python
   conn = duckdb.connect("data.db", read_only=True)
   ```

2. **Add rate limiting:**
   - Prevent abuse and DoS attacks

3. **Set query timeouts:**
   ```python
   conn.execute("SET statement_timeout='30s'")
   ```

4. **Limit result size:**
   - Automatically add LIMIT clause
   - Prevent huge result sets

5. **Log all queries:**
   - Monitor for suspicious patterns
   - Debug issues

6. **Validate before executing:**
   - Always validate user input
   - Never trust client-side validation

7. **Use prepared statements when possible:**
   ```python
   executor.execute_safe_query(
       "SELECT * FROM users WHERE id = ?",
       params=[user_id]
   )
   ```

## Next Steps

1. Review `sql_query_validator.py` for implementation details
2. Read `SQL_QUERY_VALIDATION_RESEARCH.md` for in-depth research
3. Customize error messages for your use case
4. Add monitoring and alerting
5. Write integration tests
6. Deploy with proper security controls

## Support

For issues or questions:
1. Check the research document for detailed explanations
2. Review the example code in `sql_query_validator.py`
3. Test with the provided examples

## License

This code is provided as-is for research and implementation purposes.

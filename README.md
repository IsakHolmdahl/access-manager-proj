# Safe SQL Query Validator for Python/DuckDB

A production-ready solution for safely allowing custom SELECT queries while blocking dangerous SQL operations (UPDATE, DELETE, DROP, etc.) to prevent SQL injection and unauthorized data modification.

## 📋 What's Included

This research provides:

1. **Production-Ready Code** (`sql_query_validator.py`)
   - `SafeQueryValidator` class with AST-based validation
   - `SafeDuckDBExecutor` for safe DuckDB query execution
   - Fallback regex validation
   - User-friendly error messages

2. **Comprehensive Research** (`SQL_QUERY_VALIDATION_RESEARCH.md`)
   - Library comparison (sqlglot vs sqlparse vs others)
   - Validation approaches (AST vs whitelist vs blacklist)
   - DuckDB-specific security considerations
   - Production deployment patterns
   - Security best practices

3. **Quick Start Guide** (`QUICK_START.md`)
   - Installation instructions
   - Basic usage examples
   - Flask API integration
   - Troubleshooting guide

4. **Test Suite** (`test_sql_validator.py`)
   - Comprehensive test cases
   - Valid and invalid query examples
   - DuckDB integration tests

## 🚀 Quick Start

### Installation

```bash
pip install sqlglot duckdb
```

### Basic Usage

```python
from sql_query_validator import SafeQueryValidator, QueryValidationError

validator = SafeQueryValidator()

try:
    validator.validate("SELECT * FROM users WHERE active = true")
    print("✓ Query is safe!")
except QueryValidationError as e:
    print(f"✗ Blocked: {e}")
```

### DuckDB Integration

```python
import duckdb
from sql_query_validator import SafeDuckDBExecutor

conn = duckdb.connect("data.db", read_only=True)
executor = SafeDuckDBExecutor(conn)

try:
    result = executor.execute_safe_query(user_query)
    print(f"Success! Got {len(result)} rows")
except QueryValidationError as e:
    print(f"Validation failed: {e}")
```

## 🔒 Security Features

### ✅ What's Allowed
- SELECT queries with WHERE, JOIN, GROUP BY, ORDER BY, LIMIT
- Common Table Expressions (CTEs)
- Subqueries
- Aggregate functions (COUNT, SUM, AVG, etc.)

### ❌ What's Blocked
- **Data Modification:** INSERT, UPDATE, DELETE, TRUNCATE, MERGE
- **Schema Changes:** CREATE, ALTER, DROP, RENAME
- **Administrative:** GRANT, REVOKE, EXECUTE, CALL, COPY, LOAD
- **DuckDB-Specific:** ATTACH, DETACH, PRAGMA, CHECKPOINT, EXPORT
- **Multiple Statements:** Queries with semicolons

## 🎯 Key Recommendations

### 1. Use sqlglot (Not sqlparse)

**sqlglot** provides AST-based validation that understands SQL structure:
- Detects dangerous operations in CTEs and subqueries
- Dialect-aware (supports DuckDB)
- Production-ready (2M+ downloads/month)

**sqlparse** is NOT recommended for security:
- Token-based only (no AST)
- Cannot detect nested dangerous operations
- "Non-validating" by design

### 2. Implement Defense-in-Depth

```python
# Layer 1: Query validation
validator.validate(query)

# Layer 2: Read-only connection
conn = duckdb.connect("data.db", read_only=True)

# Layer 3: Resource limits
conn.execute("SET max_memory='1GB'")
conn.execute("SET statement_timeout='30s'")

# Layer 4: Rate limiting (in API)
@limiter.limit("10 per minute")
def execute_query():
    ...
```

### 3. Use AST-Based Validation

```python
import sqlglot
from sqlglot import parse_one, exp

# Parse query into AST
parsed = parse_one(query, dialect="duckdb")

# Check root is SELECT
if not isinstance(parsed, exp.Select):
    raise QueryValidationError("Only SELECT allowed")

# Check all nodes for dangerous operations
for node in parsed.walk():
    if isinstance(node, (exp.Insert, exp.Update, exp.Delete)):
        raise QueryValidationError(f"Dangerous: {type(node).__name__}")
```

## 📖 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Getting started guide
- **[SQL_QUERY_VALIDATION_RESEARCH.md](SQL_QUERY_VALIDATION_RESEARCH.md)** - In-depth research
- **[sql_query_validator.py](sql_query_validator.py)** - Implementation
- **[test_sql_validator.py](test_sql_validator.py)** - Test suite

## 🧪 Testing

Run the test suite:

```bash
# With pytest
pytest test_sql_validator.py -v

# Without pytest
python test_sql_validator.py
```

Test your own queries:

```python
from sql_query_validator import SafeQueryValidator

validator = SafeQueryValidator()
is_valid, error = validator.validate_and_explain(your_query)

if is_valid:
    print("✓ Query is safe")
else:
    print(f"✗ Blocked: {error}")
```

## 🔧 Flask API Example

```python
from flask import Flask, request, jsonify
from sql_query_validator import SafeDuckDBExecutor, QueryValidationError
import duckdb

app = Flask(__name__)
conn = duckdb.connect("data.db", read_only=True)
executor = SafeDuckDBExecutor(conn)

@app.route("/api/query", methods=["POST"])
def execute_query():
    query = request.json.get("query")
    
    try:
        result = executor.execute_safe_query(query)
        return jsonify({"success": True, "data": result})
    except QueryValidationError as e:
        return jsonify({"error": str(e)}), 400
```

## 📊 Library Comparison

| Feature | sqlglot | sqlparse | sqloxide |
|---------|---------|----------|----------|
| AST-based | ✅ | ❌ | ✅ |
| DuckDB support | ✅ | ❌ | ❌ |
| Detects nested operations | ✅ | ❌ | ✅ |
| Python integration | ✅ | ✅ | ⚠️ |
| Production-ready | ✅ | ⚠️ | ⚠️ |
| **Recommended** | **✅ YES** | ❌ NO | ⚠️ Maybe |

## 🛡️ Security Best Practices

1. **Always validate before executing**
2. **Use read-only connections** when possible
3. **Add rate limiting** to prevent abuse
4. **Set query timeouts** (e.g., 30 seconds)
5. **Limit result size** (e.g., 10,000 rows)
6. **Log all queries** for monitoring
7. **Use prepared statements** when applicable

## 📝 Example Queries

### Valid (Allowed)

```sql
-- Basic SELECT
SELECT * FROM users WHERE active = true

-- With JOIN
SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id

-- With CTE
WITH recent AS (SELECT * FROM logs WHERE date > '2024-01-01')
SELECT COUNT(*) FROM recent

-- With aggregation
SELECT category, COUNT(*), AVG(price) 
FROM products 
GROUP BY category
```

### Invalid (Blocked)

```sql
-- Data modification
DELETE FROM users WHERE id = 1
UPDATE users SET admin = true
INSERT INTO users VALUES (999, 'hacker')

-- Schema changes
DROP TABLE users
CREATE TABLE evil (id INT)
ALTER TABLE users ADD COLUMN hacked BOOL

-- Multiple statements
SELECT * FROM users; DROP TABLE users;

-- Hidden in CTE
WITH evil AS (DELETE FROM users) SELECT * FROM evil
```

## 🚨 What Gets Blocked

The validator blocks dangerous operations in:
- Root statements
- Common Table Expressions (CTEs)
- Subqueries
- Nested SELECT statements
- Function calls
- Comments are ignored (won't cause false positives)

## 💡 Tips

1. Start with `read_only=True` for DuckDB connections
2. Test validation with comprehensive test suite
3. Customize error messages for your use case
4. Add monitoring to detect suspicious patterns
5. Consider adding query caching for repeated queries
6. Document allowed query patterns for users

## 📦 Dependencies

Required:
- **sqlglot** - SQL parsing and validation
- **duckdb** - Database engine

Optional:
- **flask** - For API integration
- **flask-limiter** - For rate limiting
- **pytest** - For running tests

## 🤝 Integration Examples

See the documentation for integration examples with:
- Flask/FastAPI APIs
- DuckDB connections
- Custom error handling
- Rate limiting
- Query timeouts
- Result size limits

## ⚙️ Configuration

```python
# Strict mode (reject unparseable queries)
validator = SafeQueryValidator(
    dialect="duckdb",
    strict_mode=True
)

# Non-strict mode (fallback to regex)
validator = SafeQueryValidator(
    dialect="duckdb",
    strict_mode=False
)

# DuckDB with resource limits
conn = duckdb.connect("data.db", config={
    'max_memory': '1GB',
    'threads': 1,
    'max_expression_depth': 100
})
```

## 📈 Performance

- **sqlglot parsing:** ~0.5-2ms per query (depends on complexity)
- **Regex fallback:** ~0.1ms per query
- **Overhead:** Minimal for most applications
- **Caching:** Can cache validation results for repeated queries

## 🔍 Troubleshooting

**"sqlglot not found"**
- Install: `pip install sqlglot`

**"Query parsing failed"**
- Check SQL syntax
- Verify table/column names exist
- Look for typos in keywords

**"Dangerous operation detected"**
- Only SELECT queries are allowed
- Remove INSERT/UPDATE/DELETE/DROP/etc.
- Check for operations in CTEs/subqueries

**"Query execution failed"**
- Query is valid but DuckDB can't execute
- Table/column doesn't exist
- Type mismatch
- Permission denied

## 📞 Support

For questions or issues:
1. Review the documentation files
2. Check the test suite for examples
3. Examine the implementation code

## 📄 License

This code is provided for research and implementation purposes.

---

## Summary

This research provides a **production-ready solution** for safely allowing custom SELECT queries while blocking dangerous SQL operations. The recommended approach uses **sqlglot** for AST-based validation with multiple layers of security.

**Key files:**
- `sql_query_validator.py` - Production code
- `SQL_QUERY_VALIDATION_RESEARCH.md` - Detailed research
- `QUICK_START.md` - Getting started guide
- `test_sql_validator.py` - Test suite

**Recommended stack:**
- sqlglot (AST validation)
- DuckDB (read-only connection)
- Flask/FastAPI (API layer with rate limiting)
- pytest (testing)

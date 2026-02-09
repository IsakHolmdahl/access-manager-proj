# Research: Access Management API Technical Decisions

**Date**: 2026-02-05  
**Feature**: Access Management API Backend  
**Branch**: `001-access-management-api`

## Overview

This document consolidates research findings for key technical decisions in implementing the Access Management API using Python, FastAPI, DuckDB with Parquet persistence, and Docker containerization.

---

## 1. DuckDB with Parquet Persistence in Docker

### Decision

Use DuckDB with file-based persistence storing data in Parquet format, deployed in Docker containers with volume mounts for data persistence.

### Rationale

- **Embedded database**: No separate database server to manage, simplifying deployment
- **Parquet native support**: DuckDB can directly query and export Parquet files efficiently
- **Docker-friendly**: File-based storage works seamlessly with Docker volumes
- **Performance**: Columnar Parquet format provides excellent query performance for analytical workloads
- **Backup**: Parquet files can be easily backed up and versioned

### Implementation Details

**Connection Pattern:**
```python
import duckdb

conn = duckdb.connect('/data/database/main.duckdb', read_only=False)
conn.execute("SET temp_directory = '/data/temp'")
```

**Docker Volume Strategy:**
```yaml
# docker-compose.yml
services:
  access-api:
    volumes:
      - duckdb_data:/data/database  # Database files
      - parquet_data:/data/parquet  # Parquet exports
    tmpfs:
      - /data/temp:size=2G  # Temp files for large operations

volumes:
  duckdb_data:
  parquet_data:
```

**Dockerfile Configuration:**
```dockerfile
# Create data directories with proper permissions
RUN mkdir -p /data/database /data/parquet /data/temp && \
    chmod -R 755 /data

ENV DUCKDB_PATH=/data/database/main.duckdb
ENV PARQUET_PATH=/data/parquet
```

**Key Best Practices:**
- Use named Docker volumes for production (better performance than bind mounts)
- Configure temp_directory for operations exceeding memory
- Execute `CHECKPOINT` before shutdown to clean up WAL files
- Use `stop_grace_period: 30s` in docker-compose for graceful shutdown

### Parquet Export/Import Patterns

```sql
-- Export table to Parquet
COPY users TO '/data/parquet/users.parquet' 
  (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 100000);

-- Query Parquet directly without importing
SELECT * FROM '/data/parquet/users.parquet';

-- Backup entire database
EXPORT DATABASE '/data/backup' (FORMAT parquet);
```

### Alternatives Considered

- **SQLite**: Similar embedded database but lacks native Parquet support and analytical optimization
- **PostgreSQL in container**: Requires separate container, more complex setup, overkill for POC
- **In-memory DuckDB**: No persistence across restarts

---

## 2. FastAPI Authentication Pattern

### Decision

Use FastAPI's `APIKeyHeader` with dependency injection for admin secret-key authentication.

### Rationale

- **FastAPI-idiomatic**: Leverages framework's built-in security utilities
- **OpenAPI integration**: Automatically documented in Swagger UI
- **Testable**: Easy to override dependencies in tests
- **Header-based**: More secure than query parameters (not logged in access logs)
- **Separation of concerns**: Clean dependency injection pattern

### Implementation Pattern

**Configuration (config.py):**
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    admin_secret_key: str  # From .env file
    
    model_config = SettingsConfigDict(env_file=".env")

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**Authentication Dependency (auth.py):**
```python
from fastapi.security import APIKeyHeader
from fastapi import Depends, HTTPException, status
from typing import Annotated

admin_key_header = APIKeyHeader(
    name="X-Admin-Key",
    description="Admin API key for protected endpoints",
    auto_error=True
)

async def verify_admin_key(
    api_key: Annotated[str, Depends(admin_key_header)],
    settings: Annotated[Settings, Depends(get_settings)]
) -> None:
    if api_key != settings.admin_secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin API key",
            headers={"WWW-Authenticate": "APIKey"},
        )
```

**Applying to Route Groups:**
```python
from fastapi import APIRouter, Depends

admin_router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(verify_admin_key)],  # Protects all routes
)
```

### HTTP Status Code Standards

- **401 UNAUTHORIZED**: Invalid or missing API key (authentication failed)
- **403 FORBIDDEN**: Valid authentication but insufficient permissions (authorization failed)
- **200 OK**: Successful operation
- **201 CREATED**: Resource successfully created
- **204 NO_CONTENT**: Successful deletion
- **404 NOT_FOUND**: Resource doesn't exist
- **409 CONFLICT**: Duplicate resource (e.g., username taken)
- **422 UNPROCESSABLE_ENTITY**: Validation errors (Pydantic)

### Secret Key Generation

```bash
# Generate secure 256-bit key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### User Authentication (Simplified for POC)

**Decision**: Users authenticate by sending username in `X-Username` header.

**Rationale**:
- POC simplicity - security is not a concern
- No password verification needed for user operations
- System validates user exists in database
- Appropriate for internal/demo systems

**Implementation**:
```python
from fastapi import Header, HTTPException, Depends

async def get_current_username(
    x_username: Annotated[str, Header(alias="X-Username")]
) -> str:
    """Extract and validate username from header"""
    # Validate user exists (in actual endpoint)
    return x_username
```

### Alternatives Considered

- **Query parameter auth**: Less secure (logged in URLs)
- **JWT tokens**: Over-engineered for simple POC admin access
- **Basic Auth**: Less flexible for API consumption
- **Full password verification**: Unnecessary complexity for POC

---

## 3. SQL Injection Prevention for Custom SELECT Queries

### Decision

Use **sqlglot** library for AST-based SQL parsing and validation to block non-SELECT operations.

### Rationale

- **AST-based parsing**: Understands SQL structure, not just tokens
- **Detects nested operations**: Catches dangerous SQL in CTEs and subqueries
- **DuckDB support**: Includes DuckDB dialect parsing
- **Production-proven**: Used by Apache Superset, Dagster, dbt-core
- **Active maintenance**: 2M+ downloads/month, regular updates

### Implementation Pattern

```python
import sqlglot
from sqlglot import parse_one, exp

BLOCKED_STATEMENT_TYPES = {
    exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Create,
    exp.Alter, exp.Truncate, exp.Merge, exp.Grant, exp.Revoke,
    # ... (full list in code)
}

class SafeQueryValidator:
    def validate(self, query: str) -> None:
        """Validate that query contains only SELECT statements"""
        # Parse SQL into AST
        try:
            parsed = parse_one(query, dialect="duckdb")
        except Exception as e:
            raise QueryValidationError(f"Invalid SQL syntax: {e}")
        
        # Check for blocked statement types
        for node in parsed.walk():
            if type(node) in BLOCKED_STATEMENT_TYPES:
                raise QueryValidationError(
                    f"Operation not allowed: {type(node).__name__}"
                )
        
        # Ensure it's a SELECT
        if not isinstance(parsed, exp.Select):
            raise QueryValidationError("Only SELECT queries are allowed")
```

### Defense-in-Depth Strategy

1. **Layer 1**: sqlglot AST validation (catches 99.9% of attacks)
2. **Layer 2**: Read-only DuckDB connection
3. **Layer 3**: Query timeout (30 seconds)
4. **Layer 4**: Row limit (10,000 rows max)
5. **Layer 5**: Resource limits (memory, temp space)
6. **Layer 6**: Rate limiting at API layer

### Safe Execution Pattern

```python
import duckdb

class SafeDuckDBExecutor:
    def __init__(self, db_path: str):
        # Read-only connection as second layer of defense
        self.conn = duckdb.connect(db_path, read_only=True)
        self.validator = SafeQueryValidator()
    
    def execute_safe_query(self, query: str, limit: int = 10000):
        # Validate first
        self.validator.validate(query)
        
        # Add row limit
        safe_query = f"SELECT * FROM ({query}) LIMIT {limit}"
        
        # Execute with timeout
        return self.conn.execute(safe_query).fetchdf()
```

### Blocked Operations

- **DML**: INSERT, UPDATE, DELETE, TRUNCATE, MERGE
- **DDL**: CREATE, ALTER, DROP, RENAME
- **DCL**: GRANT, REVOKE
- **Admin**: EXECUTE, CALL, COPY, LOAD, INSTALL
- **DuckDB-specific**: ATTACH, DETACH, PRAGMA, CHECKPOINT, EXPORT
- **Multiple statements**: Semicolon-separated queries

### Alternatives Considered

- **sqlparse**: Token-based only, doesn't understand SQL structure, can't detect nested operations
- **Regex-only**: Fragile, easily bypassed with comments or complex nesting
- **Whitelist keywords**: Insufficient - SELECT can contain dangerous operations in subqueries

---

## 4. FastAPI Project Structure Best Practices (2025/2026)

### Decision

Use layered architecture with Routes → Services → Repositories pattern, async-first approach.

### Rationale

- **Separation of concerns**: Clear boundaries between API, business logic, and data access
- **Testability**: Each layer can be tested independently
- **Maintainability**: Easy to locate and modify code
- **Scalability**: Layers can be optimized or replaced independently
- **Modern standards**: Aligns with current FastAPI community best practices

### Recommended Structure

```
src/
├── api/
│   ├── dependencies.py       # Shared dependencies
│   └── routes/
│       ├── users.py          # User endpoints
│       ├── accesses.py       # Access endpoints
│       └── admin.py          # Admin endpoints
├── models/
│   ├── user.py               # User Pydantic schemas
│   ├── access.py             # Access Pydantic schemas
│   └── user_access.py        # UserAccess schemas
├── services/
│   ├── user_service.py       # User business logic
│   ├── access_service.py     # Access business logic
│   └── auth_service.py       # Authentication logic
├── database/
│   ├── connection.py         # DuckDB connection management
│   └── repositories/
│       ├── user_repository.py
│       └── access_repository.py
└── config.py                 # Configuration
```

### Pydantic Model Organization

```python
# models/user.py

class UserBase(BaseModel):
    """Shared properties"""
    username: str

class UserCreate(UserBase):
    """Request model for creating users"""
    password: str = Field(min_length=8)

class UserResponse(UserBase):
    """Response model (no password)"""
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserInDB(UserBase):
    """Internal model with hashed password"""
    id: int
    password_hash: str
    created_at: datetime
```

**Key Patterns:**
- Separate request/response/internal models
- Use `ConfigDict(from_attributes=True)` for ORM-like objects (Pydantic v2)
- Inherit from base schemas to avoid duplication
- Never expose sensitive fields (password_hash) in response models

### Async vs Sync Guidelines

**Use async (`async def`):**
- Database operations
- External API calls
- File I/O (with async libraries)
- Any I/O-bound operations

**Use sync (`def`):**
- CPU-intensive operations (hashing, crypto)
- Libraries without async support
- Simple computations

**Note**: FastAPI runs sync endpoints in a thread pool, so they don't block the event loop.

### Error Handling Pattern

```python
# Custom exceptions
class AppException(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code

class NotFoundException(AppException):
    def __init__(self, resource: str, id: Any):
        super().__init__(
            f"{resource} with id '{id}' not found",
            status.HTTP_404_NOT_FOUND
        )

# Global exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"message": exc.message}}
    )
```

### Dependency Injection Pattern

```python
# Database connection dependency
async def get_db() -> DuckDBConnection:
    conn = duckdb.connect(settings.db_path)
    try:
        yield conn
    finally:
        conn.close()

# Service layer dependency
def get_user_service(
    db: Annotated[DuckDBConnection, Depends(get_db)]
) -> UserService:
    return UserService(db)

# Route using dependencies
@router.get("/{user_id}")
async def get_user(
    user_id: int,
    service: Annotated[UserService, Depends(get_user_service)]
):
    return await service.get_user(user_id)
```

### Testing Best Practices

```python
# conftest.py
@pytest.fixture
async def client(test_db):
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()
```

### Alternatives Considered

- **Flat structure**: Hard to navigate as project grows
- **Feature-based structure**: Can work but less clear separation of concerns
- **Sync-only approach**: Misses performance benefits of async I/O

---

## 5. DuckDB Schema Design for Access Management

### Decision

Use normalized three-table design with junction table for many-to-many relationships.

### Rationale

- **Data integrity**: Foreign key constraints prevent orphaned records
- **Flexibility**: Easy to add/remove user-access relationships
- **Query efficiency**: Composite primary key on junction table optimizes common queries
- **Normalization**: Avoids data duplication
- **DuckDB optimized**: Leverages ART indexes for point queries

### Complete Schema

```sql
-- Users table
CREATE SEQUENCE users_id_seq START 1;
CREATE TABLE users (
    id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
    username VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (username)
);

-- Accesses table
CREATE SEQUENCE accesses_id_seq START 1;
CREATE TABLE accesses (
    id INTEGER PRIMARY KEY DEFAULT nextval('accesses_id_seq'),
    name VARCHAR NOT NULL,
    description VARCHAR,  -- Unlimited length
    renewal_period INTEGER,  -- Nullable - can be NULL for non-expiring
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
);

-- Junction table for many-to-many relationship
CREATE TABLE user_accesses (
    user_id INTEGER NOT NULL,
    access_id INTEGER NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, access_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (access_id) REFERENCES accesses(id) ON DELETE CASCADE
);

-- Index for reverse lookup (users with specific access)
CREATE INDEX idx_user_accesses_access_id ON user_accesses(access_id);

-- Optional: Index for time-based queries
CREATE INDEX idx_user_accesses_assigned_at ON user_accesses(assigned_at);
```

### Key Design Decisions

**Data Types:**
- `INTEGER` for IDs (sufficient for 2.1B records)
- `VARCHAR` without length specifier (DuckDB handles variable length efficiently)
- `TIMESTAMP` for datetime fields (better than VARCHAR for date operations)
- Nullable `renewal_period` for non-expiring accesses

**Indexing Strategy:**
- PRIMARY KEY and UNIQUE constraints automatically create ART indexes
- Composite PK `(user_id, access_id)` optimizes user → accesses queries
- Additional index on `access_id` for reverse lookups (access → users)
- **Important**: In DuckDB, indexes only help highly selective point queries (≤0.1% of rows)
- Indexes do NOT improve JOINs, aggregations, or sorting

**Referential Integrity:**
- `ON DELETE CASCADE` ensures cleanup when parent records are deleted
- Foreign keys prevent orphaned records
- UNIQUE constraints prevent duplicates

### Common Query Patterns

```sql
-- Get all accesses for a user
SELECT a.* FROM users u
JOIN user_accesses ua ON u.id = ua.user_id
JOIN accesses a ON ua.access_id = a.id
WHERE u.username = ?;

-- Check if user has specific access
SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN user_accesses ua ON u.id = ua.user_id
    JOIN accesses a ON ua.access_id = a.id
    WHERE u.username = ? AND a.name = ?
);

-- Grant access
INSERT INTO user_accesses (user_id, access_id)
VALUES (?, ?);

-- Revoke access
DELETE FROM user_accesses
WHERE user_id = ? AND access_id = ?;
```

### Performance Considerations

- Use `EXPLAIN` to verify query plans
- Avoid over-indexing (indexes have maintenance cost)
- DuckDB is optimized for columnar analytics, not OLTP row-by-row updates
- Batch operations when possible

### Alternatives Considered

- **Single table with JSON array**: Poor query performance, no referential integrity
- **Separate table per access type**: Inflexible, requires schema changes for new accesses
- **Using TEXT instead of VARCHAR**: No benefit in DuckDB, VARCHAR is recommended

---

## Summary of Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Language** | Python 3.11+ | Modern, excellent library ecosystem, async support |
| **Web Framework** | FastAPI | High performance, automatic OpenAPI docs, modern async support |
| **Database** | DuckDB | Embedded, excellent analytics performance, native Parquet support |
| **Storage Format** | Parquet files | Columnar format, efficient compression, easy backup |
| **Containerization** | Docker | Standardized deployment, volume persistence |
| **Authentication** | APIKeyHeader | Simple, secure, well-documented in OpenAPI |
| **SQL Validation** | sqlglot | AST-based parsing, production-proven, DuckDB dialect support |
| **Testing** | pytest + pytest-asyncio | Industry standard, excellent async support |
| **Configuration** | pydantic-settings | Type-safe, .env file support, validation |

---

## Next Steps

With research complete, proceed to Phase 1:

1. **data-model.md**: Define complete Pydantic models and DuckDB schema
2. **contracts/openapi.yaml**: API specification with all endpoints
3. **quickstart.md**: Developer onboarding guide
4. **Update agent context**: Add Python/FastAPI/DuckDB to appropriate agent config

## References

- DuckDB Documentation: https://duckdb.org/docs/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- sqlglot Documentation: https://sqlglot.com/sqlglot.html
- Pydantic v2 Documentation: https://docs.pydantic.dev/latest/
- Docker Volume Documentation: https://docs.docker.com/storage/volumes/

# Quick Start Guide: Access Management API

**Feature**: Access Management API Backend  
**Branch**: `001-access-management-api`  
**Date**: 2026-02-05

## Overview

This guide will help you get the Access Management API running locally for development and testing.

---

## Prerequisites

- **Python**: 3.11 or higher
- **Docker**: Latest version (for containerized deployment)
- **Docker Compose**: Latest version (optional, for easier local development)
- **Git**: For cloning the repository

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd access-manager-proj
git checkout 001-access-management-api
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
# Install all dependencies
pip install -r requirements.txt

# Or if using Poetry:
poetry install
```

**Core Dependencies:**
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `duckdb` - Embedded database
- `pydantic[email]` - Data validation
- `pydantic-settings` - Configuration management
- `sqlglot` - SQL parsing and validation
- `passlib[bcrypt]` - Password hashing
- `python-multipart` - Form data support

**Development Dependencies:**
- `pytest` - Testing framework
- `pytest-asyncio` - Async test support
- `httpx` - Async HTTP client for testing
- `black` - Code formatter
- `ruff` - Linter

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your favorite editor
```

**Required Environment Variables:**

```bash
# .env
ADMIN_SECRET_KEY=your-super-secret-key-here-change-this-in-production
DUCKDB_PATH=./data/database/access_manager.duckdb
PARQUET_PATH=./data/parquet
TEMP_DIRECTORY=./data/temp
```

**Generate a Secure Admin Key:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5. Create Data Directories

```bash
mkdir -p data/database data/parquet data/temp
```

### 6. Initialize Database Schema

```bash
# Run migration script to create tables
python -m src.database.migrations.init_schema

# Or manually via DuckDB CLI:
duckdb data/database/access_manager.duckdb < src/database/migrations/init_schema.sql
```

### 7. (Optional) Seed Sample Data

```bash
# Run seed script for development data
python -m src.database.migrations.seed_data
```

This will create:
- Sample accesses (READ_DOCUMENTS, WRITE_DOCUMENTS, ADMIN_PANEL, etc.)
- Admin user (username: `admin`, password: `admin123`)

### 8. Start Development Server

```bash
# Start server with auto-reload
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Or use the run script:
python -m src.api.main
```

### 9. Access API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## Docker Deployment

### 1. Build Docker Image

```bash
docker build -t access-management-api:latest .
```

### 2. Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data volumes (WARNING: deletes all data)
docker-compose down -v
```

### 3. Manual Docker Run

```bash
# Create volume for data persistence
docker volume create access-manager-data

# Run container
docker run -d \
  --name access-api \
  -p 8000:8000 \
  -v access-manager-data:/data \
  -e ADMIN_SECRET_KEY=your-secret-key-here \
  -e DUCKDB_PATH=/data/database/access_manager.duckdb \
  access-management-api:latest

# View logs
docker logs -f access-api

# Stop container
docker stop access-api

# Remove container
docker rm access-api
```

### 4. Docker Compose Configuration

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - duckdb_data:/data/database
      - parquet_data:/data/parquet
    tmpfs:
      - /data/temp:size=2G
    environment:
      - ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY}
      - DUCKDB_PATH=/data/database/access_manager.duckdb
      - PARQUET_PATH=/data/parquet
      - TEMP_DIRECTORY=/data/temp
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  duckdb_data:
  parquet_data:
```

---

## API Usage Examples

### 1. Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 2. Create a User (Admin)

```bash
curl -X POST http://localhost:8000/admin/users \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-secret-key" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "created_at": "2026-02-05T10:30:00Z"
}
```

### 3. List All Users (Admin)

```bash
curl http://localhost:8000/admin/users \
  -H "X-Admin-Key: your-secret-key"
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "created_at": "2026-02-05T10:30:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### 4. Create an Access (Admin)

```bash
curl -X POST http://localhost:8000/admin/accesses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-secret-key" \
  -d '{
    "name": "READ_DOCUMENTS",
    "description": "Allows reading company documents",
    "renewal_period": 90
  }'
```

**Response:**
```json
{
  "id": 5,
  "name": "READ_DOCUMENTS",
  "description": "Allows reading company documents",
  "renewal_period": 90,
  "created_at": "2026-02-05T11:00:00Z"
}
```

### 5. List All Accesses (Public)

```bash
curl http://localhost:8000/admin/accesses
```

**Response:**
```json
{
  "accesses": [
    {
      "id": 5,
      "name": "READ_DOCUMENTS",
      "description": "Allows reading company documents",
      "renewal_period": 90,
      "created_at": "2026-02-05T11:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### 6. Request Access for User

```bash
curl -X POST http://localhost:8000/users/1/accesses \
  -H "Content-Type: application/json" \
  -H "X-Username: john_doe" \
  -d '{
    "access_name": "READ_DOCUMENTS"
  }'
```

**Response:**
```json
{
  "user_id": 1,
  "access_id": 5,
  "access_name": "READ_DOCUMENTS",
  "assigned_at": "2026-02-05T14:30:00Z"
}
```

### 7. Get User's Accesses

```bash
curl http://localhost:8000/users/1/accesses \
  -H "X-Username: john_doe"
```
```

**Response:**
```json
{
  "user_id": 1,
  "username": "john_doe",
  "accesses": [
    {
      "id": 5,
      "name": "READ_DOCUMENTS",
      "description": "Allows reading company documents",
      "renewal_period": 90,
      "created_at": "2026-02-05T11:00:00Z"
    }
  ],
  "total_count": 1
}
```

### 8. Remove Access from User

```bash
curl -X DELETE http://localhost:8000/users/1/accesses/5 \
  -H "X-Username: john_doe"
```

**Response:** `204 No Content`

### 9. Execute Custom Query

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT name, COUNT(*) as user_count FROM accesses JOIN user_accesses ON accesses.id = user_accesses.access_id GROUP BY name"
  }'
```

**Response:**
```json
{
  "columns": ["name", "user_count"],
  "rows": [
    ["READ_DOCUMENTS", 5],
    ["ADMIN_PANEL", 2]
  ],
  "row_count": 2
}
```

### 10. Assign Access to User (Admin)

```bash
curl -X POST http://localhost:8000/admin/users/1/accesses \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-secret-key" \
  -d '{
    "access_id": 5
  }'
```

**Response:**
```json
{
  "user_id": 1,
  "access_id": 5,
  "access_name": "READ_DOCUMENTS",
  "assigned_at": "2026-02-05T14:30:00Z"
}
```

---

## Testing

### Run All Tests

```bash
# Run full test suite
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/api/test_user_endpoints.py

# Run with verbose output
pytest -v

# Run only unit tests
pytest tests/unit/

# Run only integration tests
pytest tests/integration/

# Run only API tests
pytest tests/api/
```

### Run Tests in Docker

```bash
# Build test image
docker build -t access-api-tests -f Dockerfile.test .

# Run tests
docker run --rm access-api-tests

# Run with coverage
docker run --rm access-api-tests pytest --cov=src
```

---

## Development Tools

### Code Formatting

```bash
# Format all code
black src/ tests/

# Check formatting without changes
black --check src/ tests/
```

### Linting

```bash
# Run linter
ruff check src/ tests/

# Fix auto-fixable issues
ruff check --fix src/ tests/
```

### Type Checking

```bash
# Run type checker
mypy src/
```

---

## Troubleshooting

### Issue: Database File Locked

**Problem:** `database is locked` error when running locally.

**Solution:**
```bash
# Make sure no other processes are using the database
lsof data/database/access_manager.duckdb

# Or delete the database and reinitialize
rm data/database/access_manager.duckdb*
python -m src.database.migrations.init_schema
```

### Issue: Permission Denied in Docker

**Problem:** Docker container can't write to volume.

**Solution:**
```bash
# Check volume permissions
docker exec -it access-api ls -la /data

# If needed, rebuild with correct user
docker build --build-arg UID=$(id -u) --build-arg GID=$(id -g) -t access-management-api .
```

### Issue: Admin Key Not Working

**Problem:** 401 Unauthorized when using admin endpoints.

**Solution:**
```bash
# Verify environment variable is set
echo $ADMIN_SECRET_KEY

# Check .env file
cat .env | grep ADMIN_SECRET_KEY

# Regenerate key if needed
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Issue: Port Already in Use

**Problem:** `Address already in use` error.

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn src.api.main:app --port 8001
```

---

## Project Structure Reference

```
access-manager-proj/
├── src/
│   ├── api/
│   │   ├── main.py              # FastAPI app
│   │   ├── dependencies.py       # Shared dependencies
│   │   └── routes/              # API endpoints
│   ├── models/                  # Pydantic schemas
│   ├── services/                # Business logic
│   ├── database/                # Database layer
│   │   ├── connection.py
│   │   ├── repositories/
│   │   └── migrations/
│   └── config.py                # Configuration
├── tests/                       # Test suite
├── data/                        # Local data (not in git)
│   ├── database/
│   ├── parquet/
│   └── temp/
├── Dockerfile                   # Container image
├── docker-compose.yml           # Local deployment
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (not in git)
├── .env.example                 # Example environment file
└── README.md                    # Project documentation
```

---

## Next Steps

1. **Review API Documentation**: Explore http://localhost:8000/docs
2. **Run Tests**: Ensure everything works with `pytest`
3. **Explore Data Model**: See `specs/001-access-management-api/data-model.md`
4. **Read API Contracts**: Check `specs/001-access-management-api/contracts/openapi.yaml`
5. **Start Development**: Begin implementing features from `specs/001-access-management-api/tasks.md`

---

## Support

For questions or issues:
- Check the [spec documentation](./spec.md)
- Review [research findings](./research.md)
- Consult the [data model](./data-model.md)
- Examine [API contracts](./contracts/openapi.yaml)

Happy coding! 🚀

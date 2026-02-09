# Implementation Plan: Access Management API

**Branch**: `001-access-management-api` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-access-management-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A REST API backend for managing individual user accesses in a hypothetical system. The service provides endpoints for users to view, request, and remove their own accesses, plus administrative endpoints for managing users and accesses. Built as a Python microservice using DuckDB with Parquet file storage, containerized with Docker for deployment.

**Technical Approach**: 
- Python 3.11+ with FastAPI framework for REST API
- DuckDB for embedded database with Parquet file persistence
- Docker containerization with volume mounts for data persistence
- Simple secret-key authentication for admin endpoints
- Auto-generated OpenAPI/Swagger documentation

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI (web framework), DuckDB (embedded database), Pydantic (data validation), uvicorn (ASGI server)  
**Storage**: DuckDB with Parquet files stored locally in Docker volume  
**Testing**: pytest with pytest-asyncio for async endpoints  
**Target Platform**: Docker container (Linux-based)  
**Project Type**: Single backend service (no frontend)  
**Performance Goals**: 
- Sub-1 second response time for all endpoints under normal load
- Support 100+ concurrent requests
- Handle datasets up to 10,000 users and 50,000 access assignments

**Constraints**: 
- POC simplicity - avoid over-engineering
- Docker container must persist Parquet files across restarts
- Admin authentication via simple secret key (no complex auth system)
- User authentication via username header only (security not a concern for POC)
- Read-only custom SELECT queries (no SQL injection risk from UPDATE/DELETE)

**Scale/Scope**: 
- Small-to-medium POC deployment (< 1000 users initially)
- 4-6 REST endpoints total
- Single-tenant system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASSED - Constitution file is template-only, no project-specific constraints defined yet.

**Note**: This is the first feature in a new project. The constitution.md file contains only template placeholders and no specific architectural constraints have been established. As this is a POC, standard Python/REST API best practices will be followed:
- Clear separation of concerns (routes, services, data access)
- Comprehensive testing (unit, integration, API contract)
- OpenAPI documentation for all endpoints
- Docker containerization for deployment

**Action**: After Phase 1 design, team should consider documenting core architectural principles in constitution.md based on patterns established in this feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-access-management-api/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml     # OpenAPI 3.0 specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single backend service
src/
├── api/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── dependencies.py       # Shared dependencies (DB connection, auth)
│   └── routes/
│       ├── __init__.py
│       ├── users.py          # User endpoints
│       ├── accesses.py       # Access management endpoints
│       └── admin.py          # Admin endpoints
├── models/
│   ├── __init__.py
│   ├── user.py              # User entity and Pydantic models
│   ├── access.py            # Access entity and Pydantic models
│   └── user_access.py       # User-Access relationship
├── services/
│   ├── __init__.py
│   ├── user_service.py      # User business logic
│   ├── access_service.py    # Access business logic
│   └── auth_service.py      # Authentication logic
├── database/
│   ├── __init__.py
│   ├── connection.py        # DuckDB connection management
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   └── access_repository.py
│   └── migrations/
│       └── init_schema.sql  # Initial table definitions
└── config.py                # Configuration (env vars, settings)

tests/
├── conftest.py              # Shared test fixtures
├── unit/
│   ├── test_user_service.py
│   ├── test_access_service.py
│   └── test_auth_service.py
├── integration/
│   ├── test_database.py
│   └── test_repositories.py
└── api/
    ├── test_user_endpoints.py
    ├── test_access_endpoints.py
    └── test_admin_endpoints.py

# Docker configuration
Dockerfile
docker-compose.yml
.dockerignore

# Project configuration
pyproject.toml               # Poetry or pip dependencies
requirements.txt             # Pinned dependencies
.env.example                 # Example environment variables
README.md                    # Project setup and running instructions
```

**Structure Decision**: Single backend service structure selected because:
1. No frontend component in scope (backend-only POC)
2. Single responsibility: access management API
3. Simple deployment model (one Docker container)
4. All code in `src/` with clear separation: API layer, business logic (services), data access (repositories)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified** - constitution is template-only and no project-specific constraints exist yet.

---

# Phase 0: Research & Technical Decisions ✅ COMPLETE

**Status**: Research complete - see [research.md](./research.md) for detailed findings

## Research Tasks (Completed)

### 1. DuckDB Parquet Persistence in Docker
**Question**: How to properly configure DuckDB with Parquet storage in a Docker container to ensure data persists across container restarts?

**Key Areas**:
- DuckDB connection string for file-based database
- Parquet file export/import patterns
- Docker volume mount configuration for data directory
- Best practices for embedded databases in containers

### 2. FastAPI Authentication Patterns
**Question**: What's the best pattern for implementing simple secret-key authentication in FastAPI for admin endpoints?

**Key Areas**:
- FastAPI dependency injection for auth
- Header-based vs query-based secret key
- Separating admin vs user authentication
- Error handling for unauthorized requests

### 3. SQL Injection Prevention for Custom SELECT Queries
**Question**: How to safely allow custom SELECT queries while blocking UPDATE/DELETE/DROP operations?

**Key Areas**:
- SQL parsing and validation libraries in Python
- Whitelist approach for allowed SQL keywords
- DuckDB-specific query restrictions
- Error messages for blocked operations

### 4. Python REST API Best Practices
**Question**: What are current best practices for structuring a production-ready FastAPI application?

**Key Areas**:
- Project structure and layering (routes, services, repositories)
- Error handling and HTTP status codes
- Pydantic model organization
- Async vs sync endpoints for database operations
- OpenAPI documentation generation

### 5. DuckDB Schema Design for Access Management
**Question**: How to structure tables in DuckDB for users, accesses, and their relationships?

**Key Areas**:
- Table design for many-to-many relationship (users ↔ accesses)
- Indexing strategies in DuckDB
- Handling nullable columns (renewal_period)
- VARCHAR vs TEXT for variable-length strings

---

# Phase 1: Design Artifacts ✅ COMPLETE

**Status**: Design complete - all artifacts generated

## Phase 1 Outputs (Completed)

1. **data-model.md**: ✅ Complete entity definitions with:
   - Users table schema
   - Accesses table schema
   - UserAccesses junction table schema
   - Pydantic model definitions
   - Validation rules
   - See: [data-model.md](./data-model.md)

2. **contracts/openapi.yaml**: ✅ OpenAPI 3.0 specification with:
   - All endpoint definitions
   - Request/response schemas
   - Authentication requirements
   - Error responses
   - See: [contracts/openapi.yaml](./contracts/openapi.yaml)

3. **quickstart.md**: ✅ Developer onboarding guide with:
   - Local development setup
   - Docker build and run commands
   - API usage examples (curl commands)
   - Environment variable configuration
   - See: [quickstart.md](./quickstart.md)

4. **Agent context update**: ✅ Technology stack added to AGENTS.md
   - Python 3.11+
   - FastAPI (web framework)
   - DuckDB (embedded database)
   - Pydantic (data validation)
   - uvicorn (ASGI server)
4. **Agent context update**: ✅ Technology stack added to AGENTS.md
   - Python 3.11+
   - FastAPI (web framework)
   - DuckDB (embedded database)
   - Pydantic (data validation)
   - uvicorn (ASGI server)

---

## Constitution Re-Check (Post-Design)

**Status**: ✅ PASSED - No architectural violations identified

The design follows clean architecture principles with clear separation of concerns:
- **API Layer** (routes): HTTP handling and request/response transformation
- **Service Layer**: Business logic and orchestration
- **Repository Layer**: Data access abstraction
- **Database Layer**: DuckDB connection management

No constitution violations - template constitution has no project-specific constraints yet.

---

# Phase 2: Task Breakdown

**Status**: NOT STARTED - Use `/speckit.tasks` command to generate task breakdown

Task breakdown will be created after Phase 0 and Phase 1 are approved. This will break down the implementation into actionable development tasks with priorities and dependencies.

Use the command: `/speckit.tasks`

---

## Implementation Readiness Checklist

- [x] Research complete (Phase 0)
- [x] Data model defined (Phase 1)
- [x] API contracts specified (Phase 1)
- [x] Developer guide created (Phase 1)
- [x] Agent context updated (Phase 1)
- [x] Constitution re-validated (Phase 1)
- [ ] Task breakdown generated (Phase 2 - use `/speckit.tasks`)
- [ ] Implementation started (Phase 3 - after tasks approved)

---

## Next Steps

1. **Review Phase 0 & 1 outputs**:
   - [research.md](./research.md) - Technical decisions and rationale
   - [data-model.md](./data-model.md) - Database schema and Pydantic models
   - [contracts/openapi.yaml](./contracts/openapi.yaml) - API specification
   - [quickstart.md](./quickstart.md) - Developer setup guide

2. **Generate task breakdown**: Run `/speckit.tasks` to create actionable implementation tasks

3. **Begin implementation**: After task approval, start development following the task order

---

## Summary

This implementation plan provides a complete foundation for building the Access Management API:

**Technology Stack**:
- Python 3.11+ with FastAPI
- DuckDB with Parquet persistence
- Docker containerization
- Simple admin key authentication
- SQL query validation with sqlglot

**Architecture**:
- Layered design (Routes → Services → Repositories)
- Async-first approach for I/O operations
- Comprehensive error handling
- Strong type safety with Pydantic

**Deliverables**:
- Complete database schema (3 tables with relationships)
- 10+ REST API endpoints (admin, user, query)
- OpenAPI 3.0 specification
- Docker deployment configuration
- Developer onboarding guide

The system is ready for Phase 2 (task breakdown) and subsequent implementation.

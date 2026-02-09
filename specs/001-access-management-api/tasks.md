# Tasks: Access Management API

**Input**: Design documents from `/specs/001-access-management-api/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/openapi.yaml, research.md  
**Feature**: REST API for managing individual user accesses with DuckDB + Parquet storage

**Tests**: Not explicitly requested in specification - tasks focus on implementation only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single backend service - all paths relative to repository root:
- Source code: `src/`
- Tests: `tests/`
- Docker: repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project directory structure per plan.md (src/, tests/, data/)
- [X] T002 Initialize Python project with pyproject.toml or requirements.txt
- [X] T003 [P] Create .env.example file with ADMIN_SECRET_KEY, DUCKDB_PATH, PARQUET_PATH, TEMP_DIRECTORY
- [X] T004 [P] Create .gitignore for Python (.env, __pycache__, *.pyc, data/, venv/)
- [X] T005 [P] Create .dockerignore file
- [X] T006 [P] Install core dependencies: fastapi, uvicorn[standard], duckdb, pydantic[email], pydantic-settings
- [X] T007 [P] Install additional dependencies: sqlglot, passlib[bcrypt], python-multipart
- [X] T008 [P] Install dev dependencies: pytest, pytest-asyncio, httpx, black, ruff

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create src/config.py with Settings class using pydantic-settings for environment variables
- [X] T010 [P] Create src/database/__init__.py
- [X] T011 Create src/database/connection.py with DuckDB connection management and get_db() dependency
- [X] T012 Create src/database/migrations/init_schema.sql with all table definitions from data-model.md
- [X] T013 [P] Create src/database/migrations/__init__.py with run_migrations() function
- [X] T014 [P] Create src/database/migrations/seed_data.sql with sample accesses and admin user
- [X] T015 [P] Create src/models/__init__.py
- [X] T016 [P] Create src/services/__init__.py  
- [X] T017 [P] Create src/api/__init__.py
- [X] T018 [P] Create src/api/routes/__init__.py
- [X] T019 Create src/api/dependencies.py with get_db, get_settings, and get_current_username dependencies
- [X] T020 Implement admin authentication in src/api/dependencies.py with verify_admin_key() using APIKeyHeader
- [X] T021 Implement user authentication in src/api/dependencies.py with get_current_username() using X-Username header
- [X] T022 [P] Create custom exception classes in src/api/exceptions.py (NotFoundException, ConflictException, ValidationException)
- [X] T023 Create src/api/main.py with FastAPI app initialization and global exception handlers
- [X] T024 [P] Create tests/conftest.py with shared pytest fixtures for test database

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 3 - Administrator Creates New Users (Priority: P1) 🎯 MVP Component

**Goal**: Enable administrators to create user accounts that can then request and manage accesses

**Why P1**: Users must exist before they can view or manage accesses - this is infrastructure

**Independent Test**: Create a user via admin endpoint with X-Admin-Key, verify user exists in database, verify admin operations are blocked without key

### Implementation for User Story 3

- [X] T025 [P] [US3] Create src/models/user.py with UserBase, UserCreate, UserUpdate, UserResponse, UserInDB Pydantic models
- [X] T026 [P] [US3] Create src/database/repositories/__init__.py
- [X] T027 [US3] Create src/database/repositories/user_repository.py with UserRepository class (get, get_by_username, get_multi, create, update, delete)
- [X] T028 [US3] Create src/services/user_service.py with UserService class for user business logic
- [X] T029 [US3] Implement password hashing functions in src/services/user_service.py using passlib bcrypt
- [X] T030 [US3] Create src/api/routes/users.py for admin user management endpoints
- [X] T031 [US3] Implement POST /admin/users endpoint in src/api/routes/users.py with admin auth dependency
- [X] T032 [US3] Implement GET /admin/users endpoint in src/api/routes/users.py with pagination support
- [X] T033 [US3] Implement GET /admin/users/{user_id} endpoint in src/api/routes/users.py
- [X] T034 [US3] Implement PATCH /admin/users/{user_id} endpoint in src/api/routes/users.py
- [X] T035 [US3] Implement DELETE /admin/users/{user_id} endpoint in src/api/routes/users.py
- [X] T036 [US3] Register users router in src/api/main.py with /admin prefix and admin auth dependency
- [X] T037 [US3] Add error handling for duplicate usernames (409 Conflict) in user service

**Checkpoint**: Admins can create, read, update, and delete users. User authentication validates username exists.

---

## Phase 4: User Story 1 - View My Current Accesses (Priority: P1) 🎯 MVP Core

**Goal**: Users can view their assigned accesses - read-only foundation of the system

**Why P1**: Core functionality - users must see what they have before requesting or removing

**Independent Test**: Create a user, manually assign accesses in database, call GET /users/{user_id}/accesses with X-Username header, verify correct access list returned

### Implementation for User Story 1

- [X] T038 [P] [US1] Create src/models/access.py with AccessBase, AccessCreate, AccessUpdate, AccessResponse Pydantic models
- [X] T039 [P] [US1] Create src/models/user_access.py with AccessListResponse, UserAccessResponse Pydantic models
- [X] T040 [US1] Create src/database/repositories/access_repository.py with AccessRepository class (get, get_by_name, get_multi, get_user_accesses, create, update, delete)
- [X] T041 [US1] Create src/services/access_service.py with AccessService class for access business logic
- [X] T042 [US1] Create src/api/routes/accesses.py for access catalog endpoints (public GET endpoints)
- [X] T043 [US1] Implement GET /admin/accesses endpoint in src/api/routes/accesses.py for listing all accesses
- [X] T044 [US1] Implement GET /admin/accesses/{access_id} endpoint in src/api/routes/accesses.py
- [X] T045 [US1] Create src/api/routes/user_accesses.py for user access assignment endpoints
- [X] T046 [US1] Implement GET /users/{user_id}/accesses endpoint in src/api/routes/user_accesses.py with username auth
- [X] T047 [US1] Add validation to ensure X-Username matches user_id being queried in GET /users/{user_id}/accesses
- [X] T048 [US1] Register accesses router in src/api/main.py
- [X] T049 [US1] Register user_accesses router in src/api/main.py

**Checkpoint**: Users can view their current accesses via API. Access catalog is visible to all.

---

## Phase 5: User Story 2 - Remove Access I No Longer Need (Priority: P2)

**Goal**: Users can self-service remove accesses they no longer need

**Why P2**: Builds on US1 (view) - enables users to manage their permissions downward

**Independent Test**: Create user with accesses, call DELETE /users/{user_id}/accesses/{access_id} with X-Username, verify access removed from list

### Implementation for User Story 2

- [ ] T050 [US2] Add remove_user_access() method to AccessRepository in src/database/repositories/access_repository.py
- [ ] T051 [US2] Add has_user_access() method to AccessRepository for checking if user has specific access
- [ ] T052 [US2] Add revoke_access() method to AccessService in src/services/access_service.py
- [ ] T053 [US2] Implement DELETE /users/{user_id}/accesses/{access_id} endpoint in src/api/routes/user_accesses.py
- [ ] T054 [US2] Add validation to ensure X-Username matches user_id when removing access
- [ ] T055 [US2] Add error handling for removing non-existent access assignment (404 Not Found)
- [ ] T056 [US2] Handle edge case of user removing their last access (should succeed)

**Checkpoint**: Users can remove accesses from themselves. User Story 1 (view) and User Story 2 (remove) work together.

---

## Phase 6: User Story 4 - Request and Assign Accesses (Priority: P2)

**Goal**: Users can request accesses for themselves (auto-approved), admins can assign accesses to any user

**Why P2**: Completes the access lifecycle - users can now add accesses to themselves, admins have full control

**Independent Test**: User requests access via POST /users/{user_id}/accesses with access_name, verify immediately appears in their list. Admin assigns access via POST /admin/users/{user_id}/accesses, verify appears in target user's list.

### Implementation for User Story 4

- [ ] T057 [P] [US4] Create src/models/user_access.py with AccessRequestByName Pydantic model
- [ ] T058 [US4] Add assign_access_to_user() method to AccessRepository in src/database/repositories/access_repository.py
- [ ] T059 [US4] Add request_access() method to AccessService in src/services/access_service.py (user self-service)
- [ ] T060 [US4] Add assign_access() method to AccessService for admin assignment
- [ ] T061 [US4] Implement POST /users/{user_id}/accesses endpoint in src/api/routes/user_accesses.py for user requests
- [ ] T062 [US4] Add validation to ensure X-Username matches user_id when requesting access
- [ ] T063 [US4] Implement POST /admin/users/{user_id}/accesses endpoint in src/api/routes/user_accesses.py for admin assignment
- [ ] T064 [US4] Add error handling for duplicate access assignment (409 Conflict)
- [ ] T065 [US4] Add error handling for invalid access names (404 Not Found)
- [ ] T066 [US4] Verify access exists in catalog before allowing assignment in AccessService

**Checkpoint**: Complete access lifecycle implemented - users can view, request, and remove. Admins can create users and assign any access to any user.

---

## Phase 7: Access Catalog Management (Admin Feature)

**Goal**: Administrators can manage the catalog of available accesses

**Why Now**: Builds on existing infrastructure, allows dynamic access management

**Independent Test**: Create/update/delete accesses via admin endpoints, verify changes reflected in catalog and user assignments

### Implementation for Access Catalog Management

- [ ] T067 [P] Implement POST /admin/accesses endpoint in src/api/routes/accesses.py with admin auth
- [ ] T068 [P] Implement PATCH /admin/accesses/{access_id} endpoint in src/api/routes/accesses.py  
- [ ] T069 [P] Implement DELETE /admin/accesses/{access_id} endpoint in src/api/routes/accesses.py
- [ ] T070 Add create_access() method to AccessService in src/services/access_service.py
- [ ] T071 Add update_access() method to AccessService in src/services/access_service.py
- [ ] T072 Add delete_access() method to AccessService in src/services/access_service.py
- [ ] T073 Add error handling for duplicate access names (409 Conflict)
- [ ] T074 Verify CASCADE delete removes access from all users when access is deleted

**Checkpoint**: Full CRUD operations on access catalog. Admins have complete control over available accesses.

---

## Phase 8: Custom Query Endpoint

**Goal**: Allow custom SELECT queries on access management tables with SQL injection protection

**Why Now**: Advanced feature, depends on all tables being in place

**Independent Test**: Execute valid SELECT query via POST /query, verify results. Attempt UPDATE/DELETE, verify blocked with 400 error.

### Implementation for Custom Query Endpoint

- [ ] T075 [P] Create src/models/query.py with CustomQueryRequest and CustomQueryResponse Pydantic models
- [ ] T076 [P] Create src/services/query_service.py with QueryValidationService class
- [ ] T077 Implement SQL validation using sqlglot in QueryValidationService (validate_query method)
- [ ] T078 Add BLOCKED_STATEMENT_TYPES list in QueryValidationService (UPDATE, DELETE, INSERT, DROP, CREATE, etc.)
- [ ] T079 Add execute_safe_query() method to QueryValidationService with row limit (10,000) and timeout (30s)
- [ ] T080 Create src/api/routes/query.py for custom query endpoint
- [ ] T081 Implement POST /query endpoint in src/api/routes/query.py
- [ ] T082 Register query router in src/api/main.py
- [ ] T083 Add error handling for invalid SQL syntax (400 Bad Request)
- [ ] T084 Add error handling for blocked operations (400 Bad Request with specific message)
- [ ] T085 Test query endpoint with various SELECT statements (simple, JOINs, GROUP BY)
- [ ] T086 Test query endpoint blocks dangerous operations (UPDATE, DELETE, DROP)

**Checkpoint**: Custom query endpoint functional with comprehensive SQL injection protection. All table data queryable safely.

---

## Phase 9: Docker & Deployment

**Goal**: Containerize application with persistent data storage

**Why Now**: Application is feature-complete, ready for deployment

**Independent Test**: Build Docker image, run container with volume mounts, verify data persists across restarts, verify all endpoints accessible

### Implementation for Docker

- [ ] T087 [P] Create Dockerfile for Python 3.11+ with FastAPI application
- [ ] T088 [P] Create docker-compose.yml with service definition and volume mounts
- [ ] T089 [P] Create data directories in Dockerfile: /data/database, /data/parquet, /data/temp
- [ ] T090 [P] Configure volume mounts in docker-compose.yml: duckdb_data, parquet_data
- [ ] T091 [P] Configure tmpfs mount for /data/temp in docker-compose.yml
- [ ] T092 Add environment variables to docker-compose.yml from .env file
- [ ] T093 Add healthcheck to docker-compose.yml (curl http://localhost:8000/health)
- [ ] T094 Set stop_grace_period to 30s in docker-compose.yml for graceful shutdown
- [ ] T095 Create startup script in src/api/main.py to run migrations on startup
- [ ] T096 Add database initialization check in connection.py (create if not exists)
- [ ] T097 Test Docker build locally
- [ ] T098 Test Docker container startup and data persistence across restarts

**Checkpoint**: Application containerized and deployable. Data persists in Docker volumes.

---

## Phase 10: Documentation & Polish

**Purpose**: Finalize documentation and validate complete system

- [ ] T099 [P] Create README.md with project overview, features, and quick start
- [ ] T100 [P] Document all environment variables in README.md
- [ ] T101 [P] Add API endpoint examples to README.md from quickstart.md
- [ ] T102 [P] Document Docker deployment in README.md
- [ ] T103 [P] Add troubleshooting section to README.md
- [ ] T104 Verify OpenAPI docs generation at /docs endpoint
- [ ] T105 Verify ReDoc generation at /redoc endpoint
- [ ] T106 Test all admin endpoints with X-Admin-Key header
- [ ] T107 Test all user endpoints with X-Username header
- [ ] T108 Verify error responses match OpenAPI spec (401, 404, 409, 422)
- [ ] T109 Run full manual test following quickstart.md curl examples
- [ ] T110 Verify seed data loads correctly on first run
- [ ] T111 [P] Run code formatter (black) on all Python files
- [ ] T112 [P] Run linter (ruff) and fix any issues

**Checkpoint**: Complete, documented, production-ready POC application.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Story 3 (Phase 3)**: Depends on Foundational completion - Creates users (required for US1, US2, US4)
- **User Story 1 (Phase 4)**: Depends on Foundational completion - Can run after US3 or in parallel if using seeded users
- **User Story 2 (Phase 5)**: Depends on US1 (uses same models and repositories)
- **User Story 4 (Phase 6)**: Depends on US1 (extends access management)
- **Access Catalog (Phase 7)**: Depends on US1 (uses Access models and services)
- **Custom Query (Phase 8)**: Depends on all tables being created (Phase 2)
- **Docker (Phase 9)**: Depends on application being feature-complete (Phase 3-8)
- **Polish (Phase 10)**: Depends on all features being complete

### User Story Dependencies

- **User Story 3 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 1 (P1)**: Can start after Foundational - Needs users to exist (US3) or use seed data
- **User Story 2 (P2)**: Depends on US1 models and repositories
- **User Story 4 (P2)**: Depends on US1 models and repositories

### Recommended Order

1. **Phase 1-2**: Setup + Foundational (critical path)
2. **Phase 3**: User Story 3 - Admin Creates Users (enables other stories)
3. **Phase 4**: User Story 1 - View Accesses (core read functionality)
4. **Phase 5**: User Story 2 - Remove Access (extends US1)
5. **Phase 6**: User Story 4 - Request/Assign Access (completes lifecycle)
6. **Phase 7**: Access Catalog Management (admin tooling)
7. **Phase 8**: Custom Query (advanced feature)
8. **Phase 9**: Docker (deployment)
9. **Phase 10**: Polish (finalization)

### Parallel Opportunities

**Within Phase 1 (Setup):**
- T003, T004, T005 (config files) can run in parallel
- T006, T007, T008 (dependency installation) can run in parallel

**Within Phase 2 (Foundational):**
- T010, T013, T014, T015, T016, T017, T018 (init files) can run in parallel
- T022, T024 (independent modules) can run in parallel

**Within Phase 3 (US3):**
- T025, T026 (independent models and init files) can run in parallel
- T031-T035 (individual endpoints) can run in parallel after service is complete

**Within Phase 4 (US1):**
- T038, T039 (model files) can run in parallel
- T043, T044 (individual endpoints) can run in parallel after service is complete

**Within Phase 7 (Access Catalog):**
- T067, T068, T069 (individual endpoints) can run in parallel after service methods are complete

**Within Phase 8 (Custom Query):**
- T075, T076 (independent modules) can run in parallel

**Within Phase 9 (Docker):**
- T087, T088, T089, T090, T091 (Docker config files) can run in parallel

**Within Phase 10 (Polish):**
- T099, T100, T101, T102, T103 (documentation) can run in parallel
- T111, T112 (formatting/linting) can run in parallel

---

## Parallel Execution Examples

### Phase 2: Foundation Setup

```bash
# Launch all init files together:
Task: "Create src/database/__init__.py"
Task: "Create src/database/migrations/__init__.py"
Task: "Create src/models/__init__.py"
Task: "Create src/services/__init__.py"
Task: "Create src/api/__init__.py"
Task: "Create src/api/routes/__init__.py"
Task: "Create tests/conftest.py"
```

### Phase 4: User Story 1 Models

```bash
# Launch all model files together:
Task: "Create src/models/access.py with Pydantic models"
Task: "Create src/models/user_access.py with Pydantic models"
```

### Phase 7: Access Catalog Endpoints

```bash
# Launch all CRUD endpoints together after service is ready:
Task: "Implement POST /admin/accesses endpoint"
Task: "Implement PATCH /admin/accesses/{access_id} endpoint"
Task: "Implement DELETE /admin/accesses/{access_id} endpoint"
```

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Goal**: Deliver working system with core functionality ASAP

**Scope**: Phase 1-2 (Foundation) + Phase 3 (Create Users) + Phase 4 (View Accesses)

**Timeline**: ~60% of total effort

**Value**: Admins can create users, users can view their accesses

**Test Point**: Seed admin user, create test user, view accesses via API

---

### Incremental Delivery Milestones

**Milestone 1: Foundation Ready**
- Complete Phase 1-2
- Database schema created
- Authentication working
- Test: Admin can authenticate, database accessible

**Milestone 2: MVP (Users + View)**
- Add Phase 3-4
- Users can be created, accesses viewable
- Test: Full user lifecycle from creation to viewing accesses

**Milestone 3: Self-Service (Add Remove)**
- Add Phase 5
- Users can manage their own accesses
- Test: User requests access, views it, removes it

**Milestone 4: Full Lifecycle (Add Request)**
- Add Phase 6
- Complete access management cycle
- Test: User can view, request, and remove; Admin can assign to anyone

**Milestone 5: Complete Features**
- Add Phase 7-8
- Admin catalog management, custom queries
- Test: All functional requirements met

**Milestone 6: Production Ready**
- Add Phase 9-10
- Dockerized, documented, polished
- Test: Deploy in container, run full acceptance test

---

### Parallel Team Strategy

**2-Person Team:**
- **Phase 1-2**: Both work together on foundation (critical path)
- **Phase 3-4**: Split - Person A: US3 (users), Person B: US1 (accesses)
- **Phase 5-6**: Split - Person A: US2 (remove), Person B: US4 (request/assign)
- **Phase 7-8**: Split - Person A: Access catalog, Person B: Custom query
- **Phase 9-10**: Split - Person A: Docker, Person B: Documentation

**3-Person Team:**
- **Phase 1-2**: All three on foundation
- **Phase 3-6**: Person A: US3, Person B: US1+US2, Person C: US4
- **Phase 7-9**: Person A: Access catalog, Person B: Custom query, Person C: Docker
- **Phase 10**: All three on polish and testing

---

## Task Count Summary

- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 16 tasks  
- **Phase 3 (US3 - Create Users)**: 13 tasks
- **Phase 4 (US1 - View Accesses)**: 12 tasks
- **Phase 5 (US2 - Remove Access)**: 7 tasks
- **Phase 6 (US4 - Request/Assign)**: 10 tasks
- **Phase 7 (Access Catalog)**: 8 tasks
- **Phase 8 (Custom Query)**: 12 tasks
- **Phase 9 (Docker)**: 12 tasks
- **Phase 10 (Polish)**: 14 tasks

**Total**: 112 tasks

**MVP Scope** (Phase 1-4): 49 tasks (~44% of total)
**Full Feature Set** (Phase 1-8): 86 tasks (~77% of total)
**Production Ready** (Phase 1-10): 112 tasks (100%)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4)
- Each user story should be independently testable once complete
- Foundational phase (Phase 2) is critical path - blocks all user stories
- User Story 3 (Create Users) should be completed early as it's infrastructure for other stories
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate independently
- Use quickstart.md curl examples for manual testing at each milestone

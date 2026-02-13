# Tasks: Access Management Agent

**Input**: Design documents from `/specs/002-access-agent/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure: `src/agent/`, `src/agent/tools/`, `src/agent/prompts/`, `src/agent/models/`, `tests/agent/`
- [ ] T002 Add dependencies to project: `strands-agents`, `httpx`, `pytest-asyncio` in requirements.txt or pyproject.toml
- [ ] T003 [P] Create `.env.example` with required environment variables: `BACKEND_API_URL`, `BACKEND_ADMIN_KEY`, `BEDROCK_MODEL_ID`, `BEDROCK_REGION`, `DOCUMENTATION_PATH`
- [ ] T004 [P] Create sample documentation file at `docs/accesses.md` with example access descriptions and team structures

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement configuration loader in `src/agent/config.py` - load environment variables into AgentConfig model
- [ ] T006 [P] Create Pydantic models in `src/agent/models/chat.py`: ChatRequest, ChatResponse, StreamEvent
- [ ] T007 [P] Setup HTTP client wrapper in `src/agent/tools/http_client.py` with retry logic and error handling
- [ ] T008 Initialize AWS Bedrock client in `src/agent/agent.py` using boto3 with IAM role authentication
- [ ] T009 Create base FastAPI app in `src/agent/main.py` with health endpoint `/agent/health`
- [ ] T010 Load access documentation at startup in `src/agent/prompts/system_prompt.py` - read from DOCUMENTATION_PATH
- [ ] T011 Build system prompt generator in `src/agent/prompts/system_prompt.py` - embed documentation content and define agent behavior
- [ ] T012 Add documentation file error handling in `src/agent/prompts/system_prompt.py` - graceful startup failure with clear error message if docs/accesses.md is missing, empty, or unreadable

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Request Access Through Natural Language (Priority: P1) 🎯 MVP

**Goal**: Enable users to request and receive accesses by describing their needs in natural language

**Independent Test**: Submit "I need access to the production database" and verify agent identifies correct access, asks for confirmation, and grants it

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement `list_available_accesses()` tool in `src/agent/tools/access_tools.py` - GET /admin/accesses with X-Admin-Key header
- [ ] T014 [P] [US1] Implement `get_user_accesses(user_id, username)` tool in `src/agent/tools/user_tools.py` - GET /users/{user_id}/accesses
- [ ] T015 [P] [US1] Implement `grant_access_to_user(user_id, access_name, username)` tool in `src/agent/tools/access_tools.py` - POST /users/{user_id}/accesses
- [ ] T016 [US1] Initialize Strands Agent in `src/agent/agent.py` with Claude Sonnet 4, system prompt, and register all tools
- [ ] T017 [US1] Implement POST `/agent/chat` endpoint in `src/agent/main.py` - accepts ChatRequest, invokes agent, returns ChatResponse
- [ ] T018 [US1] Add error handling in chat endpoint for backend API failures (503 when backend unavailable)
- [ ] T019 [US1] Add validation in tools to prevent granting access user already has (check with get_user_accesses first)
- [ ] T020 [US1] Add logging for agent tool calls in `src/agent/tools/` - log tool name, parameters, and result status
- [ ] T021 [US1] Add "no matches found" handling in system prompt - agent must communicate clearly when no relevant accesses exist, suggest refining the request or browsing available accesses
- [ ] T022 [US1] Add scope boundary enforcement in system prompt - agent must politely decline requests unrelated to access management (e.g., "I can only help with access requests and discovery")

**Checkpoint**: At this point, User Story 1 should be fully functional - users can request access via chat API and receive immediate grants

---

## Phase 4: User Story 2 - Discover Available Accesses (Priority: P2)

**Goal**: Enable users to explore and browse available accesses without making a specific request

**Independent Test**: Ask "What accesses are available for the engineering team?" and verify agent returns organized list without granting anything

### Implementation for User Story 2

- [ ] T023 [US2] Enhance system prompt in `src/agent/prompts/system_prompt.py` to handle discovery queries (distinguish browse vs request intent)
- [ ] T024 [US2] Add documentation parsing logic to extract team-to-access mappings from markdown (supports flexible formats)
- [ ] T025 [US2] Implement discovery response formatting - present accesses grouped by team or category with descriptions
- [ ] T026 [US2] Add logic to prevent accidental grants during discovery (agent must explicitly confirm before calling grant_access_to_user)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can browse OR request accesses

---

## Phase 5: User Story 3 - Document Updates and Sync (Priority: P3)

**Goal**: Agent stays current with documentation changes without code modifications

**Independent Test**: Update `docs/accesses.md` with new access type, restart agent, verify new access appears in queries

### Implementation for User Story 3

- [ ] T027 [US3] Implement documentation reload mechanism in `src/agent/prompts/system_prompt.py` - reload on file change (use watchdog or startup-only reload for POC)
- [ ] T028 [US3] Add flexible markdown parsing in system prompt builder - handle various formats (lists, tables, paragraphs)
- [ ] T029 [US3] Add deprecation warning logic - detect "deprecated" keyword in documentation and surface warnings to users
- [ ] T030 [US3] Test documentation flexibility - verify agent works with different markdown structures (bullet lists vs tables vs prose)

**Checkpoint**: All user stories should now be independently functional - agent adapts to documentation changes

---

## Phase 6: Streaming and Polish & Cross-Cutting Concerns

**Purpose**: Enhancements and improvements that affect multiple user stories

- [ ] T031 [P] Implement POST `/agent/chat/stream` endpoint in `src/agent/main.py` - Server-Sent Events streaming response
- [ ] T032 [P] Add session timeout handling - expire sessions after 30 minutes of inactivity
- [ ] T033 [P] Add conversation turn limit enforcement - max 10 turns per session (configurable)
- [ ] T034 [P] Implement input sanitization in ChatRequest validation - prevent injection attacks
- [ ] T035 Code cleanup: Add type hints to all functions, run linting (ruff)
- [ ] T036 [P] Create integration tests in `tests/agent/test_agent.py` - test full conversation flows with mock backend
- [ ] T037 [P] Create unit tests for tools in `tests/agent/test_tools.py` - mock HTTP responses
- [ ] T038 [P] Create API endpoint tests in `tests/agent/test_api.py` - test ChatRequest/ChatResponse validation
- [ ] T039 Performance optimization: Add caching for list_available_accesses (5-minute TTL)
- [ ] T040 Security review: Validate all user inputs, ensure no direct database access, verify authentication flows
- [ ] T041 Update quickstart.md with final setup instructions and troubleshooting guide
- [ ] T042 Run quickstart.md validation - follow setup guide from scratch to verify correctness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 (discovery doesn't require grant functionality)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2 (documentation handling is separate concern)

### Within Each User Story

- **US1**: Tools (T013-T015) can be built in parallel, then agent initialization (T016), then endpoint (T017), then enhancements (T018-T022)
- **US2**: All tasks sequential - system prompt first, then parsing, then formatting, then guard logic
- **US3**: All tasks sequential - reload mechanism first, then flexible parsing, then deprecation logic, then testing

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003, T004)
- Foundational tasks T006 and T007 can run in parallel (different files)
- US1 tools T013, T014, T015 can be built in parallel (different functions)
- Polish phase tasks T031-T034, T036-T038 can run in parallel (different files)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)

---

## Parallel Example: User Story 1

```bash
# Launch all tool implementations in parallel:
Task: "Implement list_available_accesses() tool in src/agent/tools/access_tools.py"
Task: "Implement get_user_accesses() tool in src/agent/tools/user_tools.py"
Task: "Implement grant_access_to_user() tool in src/agent/tools/access_tools.py"

# Once tools complete, proceed sequentially:
Task: "Initialize Strands Agent in src/agent/agent.py"
Task: "Implement POST /agent/chat endpoint in src/agent/main.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently with curl/Postman
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add Polish (Phase 6) → Final release
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **MVP Target**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = ~4-6 hours of development
- **Full Feature**: All phases = ~12-16 hours of development
- **Total Tasks**: 42 (4 Setup + 8 Foundational + 10 US1 + 4 US2 + 4 US3 + 12 Polish)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

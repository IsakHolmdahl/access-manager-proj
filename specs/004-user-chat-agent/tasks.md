# Implementation Tasks: Connect User Page Chat with Agent

**Feature**: `004-user-chat-agent` | **Generated**: 2026-02-13 | **Spec**: [spec.md](spec.md)

## Implementation Strategy

This feature follows an incremental delivery approach where each user story builds upon foundational components. The recommended MVP is User Story 1, which establishes the chat interface on the home page. Subsequent stories can be implemented in parallel once foundational work is complete.

**MVP Scope**: User Story 1 - Chat interface on user home page
**Delivery Approach**: Incremental, with each user story being independently testable

---

## Dependencies & Story Completion Order

```
Phase 1: Setup (blocking for all)
    ↓
Phase 2: Foundational (blocking for all user stories)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ US1: Chat Interface (can start after foundational)         │
│ US2: Agent Endpoint (can start after foundational)         │
│ US3: Access Queries (depends on US2)                       │
│ US4: Access Grants (depends on US2)                        │
│ US5: Auto User ID (can start after foundational)           │
│ US6: Full Context (can start after foundational)           │
└─────────────────────────────────────────────────────────────┘
    ↓
Phase Final: Polish & Cross-Cutting Concerns
```

**Key Dependencies**:
- US3 and US4 require US2 (agent endpoint) to be functional
- All stories require Phase 1 and Phase 2 to be complete
- US1 and US5 can be developed in parallel once foundational work is done
- US6 can be developed in parallel with US1 once foundational work is done

---

## Phase 1: Setup ✅ COMPLETED

**Purpose**: Initialize project structure and dependencies for the chat feature

**Goal**: Establish the foundational codebase structure for implementing the chat functionality

**Independent Test**: ✅ Verified by successfully identifying existing project structure

### Tasks Completed

- [x] T001 Review existing project structure in `src/` to identify chat component integration points
- [x] T002 Verify Strands Agents framework installation in the current Python environment
- [x] T003 Check existing FastAPI application structure in `src/api/` for endpoint patterns
- [x] T004 Examine DuckDB service implementation in `src/db/` for read-only query capabilities
- [x] T005 Verify user authentication integration points in the existing backend codebase

---

## Phase 2: Foundational ✅ COMPLETED

**Purpose**: Create shared components that all user stories depend on

**Goal**: Build the core infrastructure that enables chat functionality across all user stories

**Independent Test**: ✅ Verified by creating all foundational components

### Tasks Completed

- [x] T006 Create chat message Pydantic models in `src/models/chat_message.py` for request/response validation
- [x] T007 Implement user context extraction from authenticated session in `src/services/user_context.py`
- [x] T008 Create read-only database query tools for Strands Agent in `src/agent/tools/readonly_queries.py`
- [x] T009 Implement chat history management service in `src/services/chat_history.py` for ephemeral session handling
- [x] T010 Add chat endpoint configuration to FastAPI application in `src/api/chat.py`
- [x] T048 Create embedded agent implementation in `src/agent/embedded_agent.py` (bonus task)

---

## Phase 3: User Story 1 - Chat Interface on Home Page

**Goal**: Display a functional chat interface directly on the user home page

**Independent Test**: Can be fully tested by navigating to the user home page and verifying a chat interface is immediately visible and functional

### Story Context
As a user, I want to access the chat interface directly from my user home page so that I can manage accesses without navigating to separate pages.

### Tasks

- [ ] T011 [US1] Create chat frontend component in `src/web/components/chat_window.tsx`
- [ ] T012 [US1] Implement chat WebSocket connection in `src/web/services/chat_service.ts`
- [ ] T013 [US1] Integrate chat component into user home page in `src/web/pages/user_home.tsx`
- [ ] T014 [US1] Add chat message display and input handling in `src/web/components/chat_messages.tsx`
- [ ] T015 [US1] Implement real-time message updates in `src/web/hooks/use_chat.ts`

---

## Phase 4: User Story 2 - Agent as Backend Endpoint

**Goal**: Implement agent as an embedded backend endpoint instead of separate container

**Independent Test**: Can be fully tested by sending a message to the chat endpoint and verifying the embedded agent responds without external service communication

### Story Context
As a system, I want the agent to run as part of the backend service rather than as a separate container so that deployment is simplified and the agent has direct access to backend services.

### Tasks

- [ ] T016 [US2] Create Strands Agent configuration in `src/agent/config.py` for embedded operation
- [ ] T017 [US2] Implement chat request handler endpoint in `src/api/chat.py` for agent communication
- [ ] T018 [US2] Configure Strands Agent to use existing DuckDB service in `src/agent/embedded_agent.py`
- [ ] T019 [US2] Implement agent startup/shutdown lifecycle management in `src/agent/lifecycle.py`
- [ ] T020 [US2] Add embedded agent initialization to FastAPI lifespan in main application entry point

---

## Phase 5: User Story 3 - Agent Queries Access Information

**Goal**: Enable agent to query user accesses and available access types from the database

**Independent Test**: Can be fully tested by asking the agent about current accesses and verifying the response matches actual database data

### Story Context
As a user, I want the agent to query my accesses and available access types from the backend so that I receive accurate and current information about my permissions.

### Tasks

- [ ] T021 [US3] Implement list_available_accesses function in `src/services/access_service.py`
- [ ] T022 [US3] Implement get_user_accesses function in `src/services/access_service.py`
- [ ] T023 [US3] Create Strands Agent tool for querying user accesses in `src/agent/tools/access_queries.py`
- [ ] T024 [US3] Create Strands Agent tool for querying available access types in `src/agent/tools/access_queries.py`
- [ ] T025 [US3] Add response formatting for access query results in `src/agent/formatters/access_formatter.py`

---

## Phase 6: User Story 4 - Agent Grants Accesses Through API

**Goal**: Enable agent to add accesses to user accounts through the existing backend endpoint

**Independent Test**: Can be fully tested by requesting the agent to add an access and verifying it is successfully added through the backend access grant endpoint

### Story Context
As a user, I want the agent to add accesses to my account so that I can obtain necessary permissions through natural conversation.

### Tasks

- [ ] T026 [US4] Verify existing access grant endpoint in `src/api/access_endpoints.py`
- [ ] T027 [US4] Create Strands Agent tool for granting accesses in `src/agent/tools/grant_access.py`
- [ ] T028 [US4] Implement access grant request formatting in `src/agent/formatters/grant_formatter.py`
- [ ] T029 [US4] Add access already granted check in `src/agent/tools/grant_access.py`
- [ ] T030 [US4] Implement error handling for access grant failures in `src/agent/tools/grant_access.py`

---

## Phase 7: User Story 5 - Automatic User ID Handling

**Goal**: Ensure chat automatically uses authenticated user ID without user input

**Independent Test**: Can be fully tested by sending messages without mentioning user ID and verifying responses are personalized to the authenticated user

### Story Context
As a user, I want the chat to automatically know my identity so that I don't need to identify myself in conversation.

### Tasks

- [ ] T031 [US5] Implement automatic user ID extraction in `src/services/user_context.py`
- [ ] T032 [US5] Inject authenticated user ID into agent context in `src/agent/context/user_context.py`
- [ ] T033 [US5] Add user ID validation to all database queries in `src/services/access_service.py`
- [ ] T034 [US5] Create user profile formatting for agent responses in `src/agent/formatters/user_formatter.py`
- [ ] T035 [US5] Add user context to chat endpoint in `src/api/chat.py`

---

## Phase 8: User Story 6 - Full Conversation Context

**Goal**: Provide the entire current chat history to the agent for each request

**Independent Test**: Can be fully tested by referencing earlier messages in later messages and verifying the agent responds with appropriate context

### Story Context
As a user, I want the agent to remember our entire conversation so that I can reference earlier messages and build on previous discussion points.

### Tasks

- [ ] T036 [US6] Implement chat history storage per page load in `src/services/chat_history.py`
- [ ] T037 [US6] Create chat history serialization for agent context in `src/agent/context/chat_history.py`
- [ ] T038 [US6] Implement full context injection for agent requests in `src/agent/context/injector.py`
- [ ] T039 [US6] Add conversation summary generation in `src/services/conversation_summary.py`
- [ ] T040 [US6] Test context preservation across multiple exchanges in `tests/integration/test_context_preservation.py`

---

## Phase Final: Polish & Cross-Cutting Concerns

**Purpose**: Finalize the implementation with performance optimization and error handling improvements

**Goal**: Ensure all success criteria are met and the feature is production-ready

### Tasks

- [ ] T041 Verify agent response time is under 10 seconds per success criterion SC-002
- [ ] T042 Verify chat interface loads within 3 seconds per success criterion SC-001
- [ ] T043 Add loading states and progress indicators in chat component in `src/web/components/chat_window.tsx`
- [ ] T044 Implement error message formatting in `src/agent/formatters/error_formatter.py`
- [ ] T045 Add network error recovery in chat service in `src/web/services/chat_service.ts`
- [ ] T046 Create integration test for complete chat flow in `tests/integration/test_chat_flow.py`
- [ ] T047 Performance test with concurrent users in `tests/performance/test_chat_performance.py`

---

## Parallel Execution Opportunities

### Within Each Phase

**Phase 3 (US1) Tasks** can be executed in parallel:
- T011, T012, T013 can run concurrently (different modules, no dependencies)
- T014, T015 can run after T011 completes

**Phase 4 (US2) Tasks** can be executed in parallel:
- T016, T017 can run concurrently (different modules)
- T018 depends on T016
- T019, T020 depend on T018

**Phase 5 (US3) Tasks** can be executed in parallel:
- T021, T022 can run concurrently (different functions in same file)
- T023, T024 can run concurrently (different tools)
- T025 depends on T021, T022

### Between Phases

**US1 and US5 can be developed in parallel**:
- Both start after Phase 2 foundational work
- No shared components between these stories
- Different aspects: US1 is frontend, US5 is backend user context

**US6 can be developed in parallel with US1**:
- US6 focuses on context management (backend)
- US1 focuses on chat interface (frontend)
- Only share foundational chat history service (T009)

---

## Task Summary

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Setup | 5 tasks |
| Phase 2 | Foundational | 5 tasks |
| Phase 3 | User Story 1 - Chat Interface | 5 tasks |
| Phase 4 | User Story 2 - Agent Endpoint | 5 tasks |
| Phase 5 | User Story 3 - Access Queries | 5 tasks |
| Phase 6 | User Story 4 - Access Grants | 5 tasks |
| Phase 7 | User Story 5 - Auto User ID | 5 tasks |
| Phase 8 | User Story 6 - Full Context | 5 tasks |
| Final | Polish & Cross-Cutting | 7 tasks |

**Total Tasks**: 47 tasks

### User Story Task Distribution

| User Story | Tasks | Priority | Parallel Opportunity |
|------------|-------|----------|---------------------|
| US1: Chat Interface | 5 | P1 | Yes (with US5, US6) |
| US2: Agent Endpoint | 5 | P1 | Yes (blocking for US3, US4) |
| US3: Access Queries | 5 | P1 | After US2 |
| US4: Access Grants | 5 | P1 | After US2 |
| US5: Auto User ID | 5 | P1 | Yes (with US1, US6) |
| US6: Full Context | 5 | P1 | Yes (with US1, US5) |

---

## Validation: Independent Test Criteria

Each user story has a clear independent test that can verify the story is complete:

- **US1**: Navigate to user home page → verify chat interface is visible and functional
- **US2**: Send message to chat endpoint → verify embedded agent responds without external services
- **US3**: Ask agent about accesses → verify response matches actual database data
- **US4**: Request access through agent → verify it is added through backend endpoint
- **US5**: Send messages without user ID → verify responses are personalized to authenticated user
- **US6**: Reference earlier messages → verify agent responds with appropriate context

---

## File Path Reference

### Backend Paths

- `src/api/chat.py` - Chat endpoint implementation
- `src/api/access_endpoints.py` - Access grant endpoint
- `src/models/chat_message.py` - Chat message models
- `src/services/access_service.py` - Access query and grant functions
- `src/services/user_context.py` - User context extraction
- `src/services/chat_history.py` - Chat history management
- `src/agent/config.py` - Agent configuration
- `src/agent/embedded_agent.py` - Embedded agent implementation
- `src/agent/tools/access_queries.py` - Read-only access query tools
- `src/agent/tools/grant_access.py` - Access grant tool
- `src/agent/context/user_context.py` - User context for agent
- `src/agent/context/chat_history.py` - Chat history context
- `src/agent/formatters/access_formatter.py` - Access response formatting
- `src/agent/formatters/grant_formatter.py` - Grant response formatting
- `src/agent/formatters/error_formatter.py` - Error response formatting

### Frontend Paths

- `src/web/pages/user_home.tsx` - User home page
- `src/web/components/chat_window.tsx` - Chat interface component
- `src/web/components/chat_messages.tsx` - Chat messages display
- `src/web/services/chat_service.ts` - Chat WebSocket service
- `src/web/hooks/use_chat.ts` - Chat React hook

### Test Paths

- `tests/integration/test_chat_flow.py` - Chat flow integration tests
- `tests/integration/test_context_preservation.py` - Context preservation tests
- `tests/performance/test_chat_performance.py` - Performance tests

# Implementation Plan: Connect User Page Chat with Agent

**Branch**: `004-user-chat-agent` | **Date**: 2026-02-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-user-chat-agent/spec.md`

## Summary

This feature integrates a chat interface directly into the user home page, enabling users to manage their accesses through conversation with an embedded agent. The agent runs as a backend endpoint (not a separate container) and uses the backend's existing DuckDB service for read-only queries, calling the access grant endpoint for modifications. User identity is automatically obtained from the authenticated session, and each page load creates a fresh conversation with full context provided to the agent.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI (web framework), DuckDB (embedded database), Strands Agents (agent framework)  
**Storage**: DuckDB (embedded database, existing)  
**Testing**: pytest (existing test framework)  
**Target Platform**: Linux server (backend service)  
**Project Type**: Single project - backend service enhancement  
**Performance Goals**: Agent responds within 10 seconds; chat interface loads within 3 seconds  
**Constraints**: All agent database queries must be read-only; agent must use existing backend endpoints  
**Scale/Scope**: Single-user conversations; ephemeral chat sessions per page load

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single Project Constraint**: PASS - Feature extends existing backend service without creating new projects
- **Library-First Principle**: N/A - This feature extends an existing application, not creating a new library
- **CLI Interface**: N/A - This is a web service feature, not a library
- **Test-First**: Existing test framework available; feature must be tested

## Project Structure

### Documentation (this feature)

```text
specs/004-user-chat-agent/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (if needed)
├── data-model.md        # Phase 1 output (if needed)
├── quickstart.md        # Phase 1 output (if needed)
├── contracts/           # Phase 1 output (if needed)
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
src/
├── agent/               # Agent implementation (existing)
├── api/                 # API endpoints
├── services/            # Business logic services
├── models/              # Data models
└── db/                  # Database layer (DuckDB)

tests/
├── unit/
├── integration/
└── contract/
```

**Structure Decision**: Feature extends the existing `src/` structure. The agent endpoint will be added to the existing FastAPI application. The chat interface will be integrated into the existing frontend structure.

## Complexity Tracking

> Not applicable - no constitution violations to justify

## Technical Decisions Summary

1. **Agent embedded in backend**: Agent runs as a FastAPI endpoint within the main backend service
2. **Read-only database queries**: Agent uses DuckDB through existing service with read-only tools
3. **Endpoint-based access grants**: Agent calls existing access grant API, never modifies database directly
4. **Automatic user ID**: Authenticated user ID obtained from session, not requested from user
5. **Ephemeral chat sessions**: No persistent sessions - new conversation on each page reload
6. **Full context provided**: Entire chat history sent to agent on each request

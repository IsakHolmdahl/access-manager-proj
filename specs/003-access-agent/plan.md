# Implementation Plan: Access Management Agent

**Branch**: `002-access-agent` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-access-agent/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a conversational AI agent using AWS Strands SDK that helps users request and discover accesses through natural language interaction. The agent reads access documentation from a flexible Markdown file, queries the existing backend API to understand available accesses, and immediately grants accesses once user confirms. Implementation uses Python/FastAPI as a separate microservice that integrates with the existing access management API (from feature 001).

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: AWS Strands SDK (strands-agents), FastAPI, httpx (async HTTP client), boto3 (AWS SDK), uvicorn (ASGI server)  
**Storage**: N/A (agent is stateless, conversation state managed by Strands SDK session manager, persistent data in existing DuckDB via API calls)  
**Testing**: pytest (existing), pytest-asyncio (async test support)  
**Target Platform**: Linux server (development: local, production: AWS ECS Fargate or Lambda)  
**Project Type**: Web service (separate microservice from existing backend)  
**Performance Goals**: <2 seconds end-to-end response for straightforward requests, <100ms per backend API call, handle 10 concurrent conversations  
**Constraints**: Must use existing backend API endpoints (no direct database access), must support flexible documentation formats, all accesses granted immediately (no approval workflow)  
**Scale/Scope**: POC with <10 concurrent users, ~10-20 access types in catalog, documentation <5000 words

## Constitution Check

*No project-specific constitution defined - skipping gate validation.*

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── agent/                     # NEW: Agent service code
│   ├── __init__.py
│   ├── main.py               # FastAPI app for agent service
│   ├── agent.py              # Strands Agent initialization
│   ├── tools/                # Agent tools (function-based)
│   │   ├── __init__.py
│   │   ├── access_tools.py  # Tools for access operations
│   │   └── user_tools.py    # Tools for user operations
│   ├── prompts/              # System prompts and templates
│   │   ├── __init__.py
│   │   └── system_prompt.py # System prompt builder
│   └── models/               # Pydantic models for agent API
│       ├── __init__.py
│       └── chat.py          # Chat request/response models
├── api/                       # EXISTING: Access management API
│   ├── main.py
│   ├── routes/
│   └── ...
├── models/                    # EXISTING: Data models
├── services/                  # EXISTING: Business logic
├── database/                  # EXISTING: Database layer
└── config.py                  # EXISTING: Configuration

docs/
└── accesses.md               # NEW: Access documentation (user-provided)

tests/
├── agent/                    # NEW: Agent tests
│   ├── __init__.py
│   ├── test_tools.py        # Unit tests for tools
│   ├── test_agent.py        # Integration tests for agent
│   └── test_api.py          # API endpoint tests
├── contract/                 # EXISTING
├── integration/              # EXISTING
└── unit/                     # EXISTING
```

**Structure Decision**: Single Python project with new `src/agent/` module for agent service. The agent runs as a separate FastAPI application (different port) but shares the same codebase and can import from existing modules. This allows code reuse while maintaining service separation.

## Complexity Tracking

No constitution violations - complexity is justified for POC scope.

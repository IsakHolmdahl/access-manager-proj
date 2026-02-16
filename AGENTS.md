# access-manager-proj Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-06

## Active Technologies
- Python 3.11+ + FastAPI (web framework), DuckDB (embedded database), Strands Agents (agent framework) (004-user-chat-agent)
- DuckDB (embedded database, existing) (004-user-chat-agent)

- Python 3.11+ + FastAPI (web framework), DuckDB (embedded database), Pydantic (data validation), uvicorn (ASGI server) (001-access-management-api)

- Python 3.11+ + AWS Strands SDK (strands-agents), FastAPI, httpx (async HTTP client), boto3 (AWS SDK), uvicorn (ASGI server) (002-access-agent)
- N/A (agent is stateless, conversation state managed by Strands SDK session manager, persistent data in existing DuckDB via API calls) (002-access-agent)
- TypeScript 5.3+, Next.js 14+ (App Router) (002-web-admin-frontend)
- Browser localStorage/sessionStorage for session managemen (002-web-admin-frontend)

## Project Structure

```text
src/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

Python 3.11+: Follow standard conventions

## Recent Changes
- 004-user-chat-agent: Added Python 3.11+ + FastAPI (web framework), DuckDB (embedded database), Strands Agents (agent framework)
- 002-web-admin-frontend: Added TypeScript 5.3+, Next.js 14+ (App Router)

- 002-access-agent: Added Python 3.11+ + AWS Strands SDK (strands-agents), FastAPI, httpx (async HTTP client), boto3 (AWS SDK), uvicorn (ASGI server)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

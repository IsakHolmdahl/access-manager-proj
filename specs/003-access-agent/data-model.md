# Data Model: Access Management Agent

**Feature**: 002-access-agent  
**Date**: 2026-02-11

## Overview

The agent service introduces new data models for conversation management and API interactions. The agent itself is stateless - conversation context is managed by the Strands SDK session manager. This document defines the data structures used by the agent service.

## API Models (Pydantic)

### ChatRequest

Represents an incoming chat message from a user.

**Fields**:
- `message` (str, required): The user's natural language message
- `session_id` (str, optional): Unique identifier for conversation continuity (defaults to None for single-turn)
- `user_id` (int, required): ID of the authenticated user making the request
- `username` (str, required): Username for backend API authentication (X-Username header)

**Validation Rules**:
- `message` must not be empty
- `message` length ≤ 2000 characters
- `user_id` must be positive integer
- `username` must match regex pattern `^[a-zA-Z0-9_-]+$`

**Example**:
```json
{
  "message": "I need access to the production database",
  "session_id": "user-123-session-1",
  "user_id": 1,
  "username": "john_doe"
}
```

---

### ChatResponse

Represents the agent's response to a user message.

**Fields**:
- `response` (str, required): The agent's natural language response
- `session_id` (str, optional): Session ID for conversation continuity
- `tools_used` (list[str], optional): Names of tools the agent called
- `accesses_granted` (list[str], optional): Names of accesses granted in this turn

**Example**:
```json
{
  "response": "I've granted you READ_DOCUMENTS access. You should now be able to view documents in the system.",
  "session_id": "user-123-session-1",
  "tools_used": ["list_available_accesses", "grant_access_to_user"],
  "accesses_granted": ["READ_DOCUMENTS"]
}
```

---

### StreamEvent

Represents a single event in the streaming response (Server-Sent Events format).

**Event Types**:
- `data`: Text chunk from agent response
- `tool_use`: Notification that agent is using a tool
- `tool_result`: Result from tool execution
- `done`: Conversation turn completed
- `error`: Error occurred during processing

**Fields** (JSON payload in SSE `data` field):
- `event_type` (str): Type of event
- `content` (str, optional): Event content/message
- `metadata` (dict, optional): Additional event metadata

**Example** (SSE format):
```
event: tool_use
data: {"event_type": "tool_use", "content": "list_available_accesses", "metadata": {}}

event: data
data: {"event_type": "data", "content": "I found the following accesses: "}

event: done
data: {"event_type": "done"}
```

---

## Tool Data Structures

These are internal data structures used by agent tools when calling the backend API.

### AccessInfo

Represents an access retrieved from the backend API.

**Fields**:
- `id` (int): Access ID
- `name` (str): Access name (e.g., "READ_DOCUMENTS")
- `description` (str): Human-readable description
- `renewal_period` (int | None): Renewal period in days, or None if non-expiring

**Source**: Returned by `list_available_accesses()` tool

---

### UserAccessInfo

Represents a user's current access assignments.

**Fields**:
- `user_id` (int): User ID
- `username` (str): Username
- `accesses` (list[AccessInfo]): List of currently assigned accesses

**Source**: Returned by `get_user_accesses()` tool

---

### GrantAccessResult

Represents the result of granting an access to a user.

**Fields**:
- `success` (bool): Whether grant operation succeeded
- `access` (AccessInfo): The granted access details
- `message` (str): Status message

**Source**: Returned by `grant_access_to_user()` tool

---

## Session Management

The Strands SDK handles conversation session state internally. The agent service does not persist session data - it's managed in-memory by the SDK.

### Session State (Managed by Strands SDK)

**Contents**:
- Conversation history (user messages and agent responses)
- Tool call history
- Conversation context (remembered facts)

**Lifecycle**:
- Created when first message with new `session_id` arrives
- Persisted in-memory for duration of agent process
- Expires after 30 minutes of inactivity (configurable)

**Not Persisted**:
- Sessions are not written to database
- Sessions do not survive agent service restarts
- This is acceptable for POC scope

---

## Configuration Models

### AgentConfig

Configuration for the agent service.

**Fields**:
- `backend_api_url` (str): URL of existing access management API (default: "http://localhost:8000")
- `bedrock_model_id` (str): AWS Bedrock model ID (default: "anthropic.claude-sonnet-4-20250514-v1:0")
- `bedrock_region` (str): AWS region for Bedrock (default: "us-west-2")
- `documentation_path` (str): Path to access documentation markdown file (default: "./docs/accesses.md")
- `max_conversation_turns` (int): Maximum turns per session (default: 10)
- `session_timeout_minutes` (int): Session inactivity timeout (default: 30)

**Source**: Environment variables or `.env` file

---

## Entity Relationships

```
┌─────────────────────┐
│   ChatRequest       │
│  (from user)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Strands Agent      │
│  (Session State)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────────┐
│  Agent Tools        │────>│ Backend API      │
│  - list_accesses    │     │ (HTTP calls)     │
│  - grant_access     │     └──────────────────┘
│  - get_user_access  │              │
└──────────┬──────────┘              │
           │                         ▼
           │                ┌──────────────────┐
           │                │  DuckDB          │
           │                │  (via API)       │
           │                └──────────────────┘
           ▼
┌─────────────────────┐
│   ChatResponse      │
│  (to user)          │
└─────────────────────┘
```

---

## State Transitions

### Conversation Flow

```
[User sends message] 
    → [Agent receives ChatRequest]
    → [Agent loads/creates session from session_id]
    → [Agent processes message with Strands SDK]
    → [Agent calls tools as needed]
    → [Tools make HTTP calls to backend API]
    → [Agent formulates response]
    → [Agent returns ChatResponse]
```

### Tool Call Flow

```
[Agent decides to use tool]
    → [Tool function invoked with parameters]
    → [Tool makes HTTP request to backend API]
    → [Tool validates response]
    → [Tool returns structured result to agent]
    → [Agent incorporates result into response]
```

---

## Data Validation

### Input Validation

- **ChatRequest validation**: Pydantic models enforce type checking and field constraints
- **Tool parameter validation**: Strands SDK validates parameters against type hints
- **Backend API responses**: Tools validate HTTP status codes and response schemas

### Error Handling

- **Invalid input**: Return 422 Unprocessable Entity with validation errors
- **Backend API errors**: Tools catch HTTP errors and return error messages to agent
- **Agent errors**: Return 500 Internal Server Error with error details (development only)

---

## Performance Considerations

### Data Size Limits

- **Message length**: Max 2000 characters per user message
- **Session history**: Max 10 turns per session (configurable)
- **Access catalog**: Assumed <100 accesses (pagination supported via backend API)
- **Documentation**: Assumed <5000 words (~25KB)

### Caching Strategy

- **Access catalog**: Cache for 5 minutes to reduce backend API load
- **Documentation**: Load once at startup, reload on file change (future enhancement)
- **User accesses**: Not cached (always fetch fresh from backend)

---

## Security Considerations

### Authentication

- Agent API requires authenticated user (user_id and username in request)
- Agent uses username from request to authenticate with backend API (X-Username header)
- No passwords or tokens stored in agent service

### Authorization

- Agent tools enforce that users can only request accesses for themselves
- Backend API enforces authorization (agent cannot bypass)
- Admin operations (like listing all accesses) use admin key from environment variable

### Data Privacy

- Conversation history stored in-memory only (not logged or persisted)
- Sensitive data not included in logs (usernames logged, but not access details)
- Sessions expire after 30 minutes of inactivity

---

## Testing Strategy

### Unit Tests

- Test Pydantic model validation
- Test tool functions with mocked HTTP responses
- Test error handling in tools

### Integration Tests

- Test agent with live backend API
- Test conversation flows end-to-end
- Test session management across multiple turns

### Contract Tests

- Verify tool HTTP requests match backend API contracts
- Test response parsing from backend API
- Validate error handling for API failures

---

## Future Enhancements (Out of Scope)

- Persistent session storage (e.g., DynamoDB for multi-instance deployments)
- Conversation analytics (logging, metrics, feedback)
- User preferences and personalization
- Multi-language support
- Audit logging for access grants

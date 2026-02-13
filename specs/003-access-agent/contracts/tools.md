# Agent Tools Contract

**Feature**: 002-access-agent  
**Date**: 2026-02-11

## Overview

This document defines the tools available to the Strands agent. Each tool is a Python function decorated with `@tool` that the agent can call to interact with the backend API.

## Tools

### 1. list_available_accesses

**Purpose**: Retrieve all available accesses from the access catalog.

**Function Signature**:
```python
@tool
async def list_available_accesses() -> list[dict]:
    """
    Retrieve all available accesses from the backend API.
    
    Returns:
        List of access dictionaries with id, name, and description
    """
```

**Backend API Call**:
- **Method**: GET
- **Endpoint**: `/admin/accesses?limit=100&offset=0`
- **Headers**: `X-Admin-Key: <admin_key>`
- **Success Response**: 200 OK

**Response Format**:
```json
{
  "accesses": [
    {
      "id": 1,
      "name": "READ_DOCUMENTS",
      "description": "View documents in the system",
      "renewal_period": null
    },
    {
      "id": 2,
      "name": "WRITE_DOCUMENTS",
      "description": "Create and edit documents",
      "renewal_period": 90
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}
```

**Return Value** (to agent):
```python
[
    {
        "id": 1,
        "name": "READ_DOCUMENTS",
        "description": "View documents in the system"
    },
    {
        "id": 2,
        "name": "WRITE_DOCUMENTS",
        "description": "Create and edit documents"
    }
]
```

**Error Handling**:
- **Backend unavailable**: Return empty list with error message
- **Authentication failed**: Return error message
- **Invalid response**: Return error message

**Usage Examples**:
- "What accesses are available?"
- "Show me all accesses for the engineering team"
- "I need database access" (agent calls this to see what database-related accesses exist)

---

### 2. get_user_accesses

**Purpose**: Get the current accesses assigned to a specific user.

**Function Signature**:
```python
@tool
async def get_user_accesses(user_id: int, username: str) -> dict:
    """
    Get all accesses currently assigned to a user.
    
    Args:
        user_id: ID of the user
        username: Username for authentication
    
    Returns:
        Dict with user_id, username, and list of assigned accesses
    """
```

**Backend API Call**:
- **Method**: GET
- **Endpoint**: `/users/{user_id}/accesses`
- **Headers**: `X-Username: {username}`
- **Success Response**: 200 OK

**Response Format**:
```json
{
  "user_id": 1,
  "username": "john_doe",
  "accesses": [
    {
      "id": 1,
      "name": "READ_DOCUMENTS",
      "description": "View documents in the system",
      "assigned_at": "2026-02-11T10:30:00Z"
    }
  ]
}
```

**Return Value** (to agent):
```python
{
    "user_id": 1,
    "username": "john_doe",
    "accesses": [
        {
            "id": 1,
            "name": "READ_DOCUMENTS",
            "description": "View documents in the system"
        }
    ]
}
```

**Error Handling**:
- **User not found**: Return error message "User not found"
- **Unauthorized**: Return error message "Authentication failed"
- **Backend unavailable**: Return error message "Backend API unavailable"

**Usage Examples**:
- "What accesses do I have?" (agent calls this before presenting options)
- "I need database access" (agent checks if user already has it)
- Before granting access (agent verifies user doesn't already have it)

---

### 3. grant_access_to_user

**Purpose**: Grant a specific access to a user (immediately, no approval workflow).

**Function Signature**:
```python
@tool
async def grant_access_to_user(
    user_id: int,
    access_name: str,
    username: str
) -> dict:
    """
    Grant an access to a user.
    
    Args:
        user_id: ID of the user to grant access to
        access_name: Name of the access to grant (e.g., "READ_DOCUMENTS")
        username: Username for authentication
    
    Returns:
        Dict with success status, access details, and message
    """
```

**Backend API Call**:
- **Method**: POST
- **Endpoint**: `/users/{user_id}/accesses`
- **Headers**: `X-Username: {username}`
- **Request Body**:
  ```json
  {
    "access_name": "READ_DOCUMENTS"
  }
  ```
- **Success Response**: 201 Created

**Response Format**:
```json
{
  "id": 1,
  "name": "READ_DOCUMENTS",
  "description": "View documents in the system",
  "renewal_period": null
}
```

**Return Value** (to agent):
```python
{
    "success": True,
    "access": {
        "id": 1,
        "name": "READ_DOCUMENTS",
        "description": "View documents in the system"
    },
    "message": "Access granted successfully"
}
```

**Error Handling**:
- **Access not found**: Return `{"success": False, "message": "Access not found: {access_name}"}`
- **Already assigned**: Return `{"success": False, "message": "User already has this access"}`
- **Unauthorized**: Return `{"success": False, "message": "Authentication failed"}`
- **Backend unavailable**: Return `{"success": False, "message": "Backend API unavailable"}`

**Usage Examples**:
- User confirms: "Yes, grant me READ_DOCUMENTS" (after agent presents options)
- User confirms: "Yes, that's what I need" (after agent asks for clarification)

---

## Tool Calling Workflow

### Example 1: Simple Access Request

**User**: "I need access to read documents"

**Agent Tool Calls**:
1. `list_available_accesses()` → Returns list including "READ_DOCUMENTS"
2. `get_user_accesses(user_id=1, username="john_doe")` → Check if already has it
3. Agent presents option: "I found READ_DOCUMENTS access. Would you like me to grant it?"
4. **User confirms**: "Yes please"
5. `grant_access_to_user(user_id=1, access_name="READ_DOCUMENTS", username="john_doe")` → Grant access
6. Agent confirms: "I've granted you READ_DOCUMENTS access."

### Example 2: Ambiguous Request (Clarification Needed)

**User**: "I need database access"

**Agent Tool Calls**:
1. `list_available_accesses()` → Returns:
   - "DB_READ_DEV"
   - "DB_READ_STAGING"
   - "DB_READ_PROD"
   - "DB_WRITE_DEV"
   - "DB_WRITE_PROD"
2. Agent asks: "I found multiple database accesses. Which environment do you need: development, staging, or production? And do you need read or write access?"
3. **User clarifies**: "Production, read only"
4. `grant_access_to_user(user_id=1, access_name="DB_READ_PROD", username="john_doe")` → Grant access
5. Agent confirms: "I've granted you DB_READ_PROD access."

### Example 3: Discovery (No Grant)

**User**: "What accesses are available for the engineering team?"

**Agent Tool Calls**:
1. `list_available_accesses()` → Returns all accesses
2. Agent filters/organizes by team (from documentation)
3. Agent presents: "For the engineering team, here are the available accesses: ..."
4. No grant made unless user explicitly requests

---

## Tool Authentication

### Backend API Authentication

All tools use the user's credentials to authenticate with the backend API:
- **User operations**: Use `X-Username` header with user's username
- **Admin operations** (list all accesses): Use `X-Admin-Key` header from environment variable

### Security Considerations

- **Authorization**: Backend API enforces that users can only operate on their own account
- **Admin key**: Stored in environment variable, never exposed to user
- **No privilege escalation**: Agent cannot bypass backend API authorization

---

## Tool Error Handling

### HTTP Error Codes

- **400 Bad Request**: Return error message to agent (e.g., "Invalid access name")
- **403 Forbidden**: Return "You don't have permission for this operation"
- **404 Not Found**: Return "Resource not found" (user or access)
- **409 Conflict**: Return "You already have this access"
- **500 Internal Server Error**: Return "Backend API error, please try again"

### Network Errors

- **Connection timeout**: Return "Backend API is not responding"
- **Connection refused**: Return "Backend API is unavailable"
- **DNS resolution failed**: Return "Cannot reach backend API"

### Tool-Level Validation

- **Empty parameters**: Validate before making API call
- **Invalid formats**: Return validation error to agent
- **Type mismatches**: Caught by Python type hints

---

## Tool Response Time

### Expected Latency

- **list_available_accesses**: ~50-100ms (cached on backend)
- **get_user_accesses**: ~50-100ms (single DB query)
- **grant_access_to_user**: ~100-200ms (DB write + validation)

### Timeout Configuration

- **HTTP request timeout**: 10 seconds per request
- **Retry logic**: Up to 2 retries with exponential backoff
- **Circuit breaker**: After 5 consecutive failures, return cached error

---

## Testing Tools

### Unit Tests

Mock HTTP responses and test tool logic:

```python
@pytest.mark.asyncio
async def test_list_available_accesses_success(httpx_mock):
    httpx_mock.add_response(
        url="http://localhost:8000/admin/accesses",
        json={"accesses": [{"id": 1, "name": "READ_DOCUMENTS", "description": "..."}]}
    )
    
    result = await list_available_accesses()
    assert len(result) == 1
    assert result[0]["name"] == "READ_DOCUMENTS"
```

### Integration Tests

Test tools against live backend API:

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_grant_access_end_to_end():
    # Arrange: Create test user
    user = await create_test_user("test_user")
    
    # Act: Grant access via tool
    result = await grant_access_to_user(
        user_id=user.id,
        access_name="READ_DOCUMENTS",
        username="test_user"
    )
    
    # Assert
    assert result["success"] is True
    assert result["access"]["name"] == "READ_DOCUMENTS"
    
    # Verify via backend API
    accesses = await get_user_accesses(user.id, "test_user")
    assert "READ_DOCUMENTS" in [a["name"] for a in accesses["accesses"]]
```

---

## Future Tool Enhancements (Out of Scope)

- **search_documentation(query: str)**: Semantic search over documentation
- **check_approval_status(request_id: str)**: Check status (if approval workflow added)
- **remove_access(user_id: int, access_name: str)**: Revoke access (currently out of scope)
- **get_team_members(team_name: str)**: List members of a team
- **recommend_accesses(job_role: str)**: AI-powered access recommendations

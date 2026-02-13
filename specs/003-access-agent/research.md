# Research: Access Management Agent

**Date**: 2026-02-11  
**Feature**: 002-access-agent

## Overview

This document consolidates research findings for implementing a conversational AI agent that helps users request and discover accesses through natural language interaction.

## AWS Strands SDK

### Decision

Use **AWS Strands Agents SDK** (not AWS Bedrock Agents) as the framework for building the conversational agent.

### Rationale

1. **Open-source and code-first**: Provides full control over agent logic and behavior
2. **Python-native**: Integrates seamlessly with existing Python/FastAPI backend
3. **Production-ready**: Built by AWS with enterprise features (observability, memory management, error handling)
4. **Model-agnostic**: Can use Amazon Bedrock models (Claude, Nova) or other providers
5. **Tool integration**: Native support for defining custom tools that agents can call
6. **FastAPI compatibility**: Well-documented patterns for exposing agents via REST APIs

### Alternatives Considered

- **AWS Bedrock Agents**: Fully managed service but less flexible; requires AWS console configuration and doesn't offer the same code-level control
- **LangChain**: More complex, heavier dependencies, less AWS-native
- **Custom implementation**: Would require significant effort to replicate conversation management, tool calling, and streaming features

### Key Features

- **Function-based tools**: Simple `@tool` decorator for defining agent capabilities
- **Session management**: Built-in conversation context across multiple turns
- **Streaming responses**: Native async/streaming support for real-time interactions
- **Error handling**: Automatic retries and graceful failure handling
- **Observability**: Integrated metrics, tracing, and debug logging

## Authentication & AWS Integration

### Decision

Use **IAM roles** for production deployment with **boto3 default credentials** in development.

### Rationale

1. **Security**: No hardcoded credentials in code
2. **AWS best practice**: Follows AWS recommended authentication patterns
3. **Simplicity**: boto3 automatically discovers credentials from environment/IAM role
4. **Flexibility**: Works in local dev (AWS CLI config) and production (EC2/ECS/Lambda IAM roles)

### Required AWS Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
```

### Implementation Approach

```python
from strands import Agent
from strands.models import BedrockModel

# boto3 handles credentials automatically
model = BedrockModel(
    model_id="anthropic.claude-sonnet-4-20250514-v1:0",
    region_name="us-west-2"
)

agent = Agent(model=model)
```

## Tool Design Pattern

### Decision

Use **function-based tools** with the `@tool` decorator pattern.

### Rationale

1. **Simplicity**: Cleanest syntax for defining tools
2. **Type safety**: Leverages Python type hints for validation
3. **Documentation**: Docstrings become tool descriptions for the LLM
4. **Testability**: Tools are plain Python functions, easy to unit test

### Implementation Pattern

```python
from strands import Agent, tool
import httpx

@tool
async def list_available_accesses() -> list[dict]:
    """
    Retrieve all available accesses from the backend API.
    
    Returns:
        List of access dictionaries with id, name, and description
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/admin/accesses",
            headers={"X-Admin-Key": os.getenv("ADMIN_KEY")},
            params={"limit": 100}
        )
        data = response.json()
        return data["accesses"]

@tool
async def grant_access_to_user(user_id: int, access_name: str, username: str) -> dict:
    """
    Grant an access to a specific user.
    
    Args:
        user_id: ID of the user to grant access to
        access_name: Name of the access to grant (e.g., "READ_DOCUMENTS")
        username: Username for authentication
    
    Returns:
        Dict with granted access details
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://localhost:8000/users/{user_id}/accesses",
            headers={"X-Username": username},
            json={"access_name": access_name}
        )
        return response.json()
```

## Domain Knowledge Integration

### Decision

Use **system prompt with embedded documentation** for domain knowledge, reading from a Markdown file.

### Rationale

1. **Flexibility**: Supports flexible documentation formats (FR-002 requirement)
2. **No additional infrastructure**: No need for vector databases or Bedrock Knowledge Bases for POC
3. **Real-time updates**: Documentation changes are reflected by reloading the file
4. **Simplicity**: Aligns with POC scope and rapid iteration

### Implementation Approach

```python
def load_access_documentation(file_path: str) -> str:
    """Load access documentation from markdown file."""
    with open(file_path, 'r') as f:
        return f.read()

# Create agent with embedded documentation
docs = load_access_documentation("./docs/accesses.md")

agent = Agent(
    instructions=f"""
    You are an access management assistant for helping users request accesses.
    
    ## Your Capabilities
    - Help users discover what accesses are available
    - Understand user needs and recommend appropriate accesses
    - Grant accesses immediately once confirmed
    
    ## Access Documentation
    {docs}
    
    ## Guidelines
    - Always confirm with user before granting access
    - Ask clarifying questions if request is ambiguous
    - Stay in scope - only help with access requests
    - Be concise and helpful
    """,
    tools=[list_available_accesses, grant_access_to_user, get_user_accesses]
)
```

### Alternative Considered

- **RAG with vector database**: Would be better for large documentation (>10k words) but adds complexity for POC
- **Bedrock Knowledge Base**: Requires AWS setup and doesn't support flexible formats as easily

## System Prompt Design

### Decision

Create a **structured, role-based system prompt** that defines agent personality, capabilities, and behavioral guidelines.

### Key Components

1. **Role definition**: "You are an access management assistant..."
2. **Capabilities**: Clear list of what agent can do
3. **Embedded documentation**: Access catalog and team mappings
4. **Guidelines**: Behavioral rules (confirm before granting, ask clarifying questions, stay in scope)
5. **Examples**: Few-shot examples for common scenarios

### Best Practices Applied

- **Explicit boundaries**: "You only help with access requests, decline unrelated questions"
- **Confirmation flow**: "Always ask user to confirm before granting access"
- **Error handling**: "If backend API fails, inform user politely and suggest retry"
- **Disambiguation**: "If multiple accesses match, present options with descriptions"

## API Design

### Decision

Create a **FastAPI-based REST API** with both streaming and non-streaming endpoints.

### Endpoints

1. **POST /agent/chat** - Non-streaming conversations
2. **POST /agent/chat/stream** - Server-Sent Events streaming
3. **GET /agent/health** - Health check

### Integration with Existing API

- Agent service runs as **separate microservice** alongside existing access management API
- Agent makes HTTP requests to existing API endpoints as tools
- Uses same authentication mechanisms (X-Username header)

### Rationale

1. **Separation of concerns**: Agent logic separate from access management core
2. **Independent scaling**: Can scale agent service independently based on conversation load
3. **Technology isolation**: Agent uses async/streaming features without impacting existing sync API
4. **Future flexibility**: Easy to add multiple agent types or upgrade agent framework

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Future)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Agent Service (FastAPI)       │
│   - /agent/chat                 │
│   - /agent/chat/stream          │
│   ┌──────────────────────────┐  │
│   │  Strands Agent           │  │
│   │  - Tools (@tool)         │  │
│   │  - System Prompt         │  │
│   │  - Session Management    │  │
│   └──────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   Access Management API         │
│   (Existing from 001)           │
│   - GET /admin/accesses         │
│   - GET /users/{id}/accesses    │
│   - POST /users/{id}/accesses   │
└──────────────┬──────────────────┘
               │
               ▼
         ┌───────────┐
         │  DuckDB   │
         └───────────┘

         ┌───────────┐
         │ AWS       │
         │ Bedrock   │
         │ (Claude)  │
         └───────────┘
```

## Testing Strategy

### Unit Tests

- Test individual tools (mock HTTP responses)
- Test documentation parsing
- Test system prompt rendering

### Integration Tests

- Test agent tool calling with live backend API
- Test conversation flows end-to-end
- Test error handling and edge cases

### Contract Tests

- Verify agent tools match backend API contracts
- Test authentication mechanisms
- Validate response formats

## Performance Considerations

### Expected Load

- **POC**: <10 concurrent conversations
- **Latency target**: <2 seconds for simple requests (per SC-005)
- **Model latency**: ~1-2 seconds for Claude Sonnet responses
- **Tool calls**: ~100-200ms per backend API call

### Optimization Strategies

1. **Streaming**: Use streaming responses for better UX
2. **Connection pooling**: Reuse HTTP connections to backend API (httpx.AsyncClient)
3. **Caching**: Cache access catalog for 5 minutes to reduce backend load
4. **Async tools**: All tools are async for non-blocking I/O

## Deployment Considerations

### Development

- Run as local Python process with `uvicorn`
- Use AWS CLI credentials for Bedrock access
- Backend API runs on localhost:8000
- Agent API runs on localhost:8001

### Production (Future)

- Deploy to AWS ECS Fargate or Lambda
- Use IAM role for Bedrock access
- Configure backend API URL via environment variable
- Add CloudWatch logging and metrics
- Consider Amazon Bedrock AgentCore for managed runtime

## Open Questions & Future Enhancements

### Resolved

- ✅ Use AWS Strands SDK (not Bedrock Agents)
- ✅ Function-based tools pattern
- ✅ System prompt with embedded docs
- ✅ Separate microservice architecture

### Future Enhancements (Out of Scope for POC)

- Multi-agent coordination (specialist agents per team/access type)
- Vector search for large documentation (>10k words)
- Conversation analytics and improvement feedback
- Voice/audio interface integration
- Integration with Slack/Teams for native chat experience

## Dependencies

### Python Packages

- `strands-agents` - Core agent framework
- `httpx` - Async HTTP client for tool calls
- `fastapi` - REST API framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation (already in project)
- `boto3` - AWS SDK (for Bedrock auth)

### AWS Services

- **Amazon Bedrock**: LLM hosting (Claude Sonnet 4)
- **IAM**: Authentication and authorization

### External Dependencies

- Existing access management API (feature 001)
- Access documentation markdown file (user-provided)

## References

- [AWS Strands SDK Documentation](https://strandsagents.com/latest/)
- [Python SDK GitHub](https://github.com/strands-agents/sdk-python)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Amazon Bedrock User Guide](https://docs.aws.amazon.com/bedrock/)

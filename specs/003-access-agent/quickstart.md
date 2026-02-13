# Quick Start: Access Management Agent

**Feature**: 002-access-agent  
**Date**: 2026-02-11

## Overview

This guide will help you get the Access Management Agent service up and running in under 10 minutes.

## Prerequisites

- Python 3.11+ installed
- Access Management API running (from feature 001)
- AWS account with Bedrock access
- AWS CLI configured with credentials

## Step 1: Install Dependencies

```bash
# Ensure you're in the project root
cd /path/to/access-manager-proj

# Activate virtual environment (create if needed)
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate.bat  # Windows

# Install agent dependencies
pip install strands-agents httpx python-dotenv
```

## Step 2: Configure AWS Bedrock

### Option A: Use AWS CLI Configuration (Recommended for Development)

```bash
# Configure AWS CLI if not already done
aws configure
# Enter your Access Key ID, Secret Access Key, and default region (us-west-2)

# Enable Bedrock model access (one-time setup)
# Go to AWS Console → Bedrock → Model Access → Request access to:
# - Claude Sonnet 4 (anthropic.claude-sonnet-4-20250514-v1:0)
```

### Option B: Use Environment Variables

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-west-2"
```

## Step 3: Create Configuration

Create a `.env` file in the project root:

```bash
# .env
BACKEND_API_URL=http://localhost:8000
BACKEND_ADMIN_KEY=your-admin-key-here
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
BEDROCK_REGION=us-west-2
DOCUMENTATION_PATH=./docs/accesses.md
```

**Important**: Get `BACKEND_ADMIN_KEY` from the existing API configuration or set a new one.

## Step 4: Create Access Documentation

Create `docs/accesses.md` with your access catalog:

```markdown
# Access Catalog

## Engineering Team

### READ_DOCUMENTS
View documents in the system. Required for all engineers to view project documentation.

### WRITE_DOCUMENTS
Create and edit documents. Granted to senior engineers and tech leads.

### DEPLOY_STAGING
Deploy code to staging environment. Granted to DevOps team members.

### DEPLOY_PROD
Deploy code to production environment. Granted to senior DevOps engineers only.

## Finance Team

### APPROVE_INVOICES
Approve invoices up to $10,000. Granted to finance managers.

### READ_REPORTS
View financial reports. Granted to all finance team members.

## Support Team

### VIEW_TICKETS
View customer support tickets. Granted to all support staff.

### RESOLVE_TICKETS
Mark tickets as resolved. Granted to support staff after training.
```

**Tip**: The documentation format is flexible - use lists, tables, or paragraphs. The agent will parse it.

## Step 5: Start the Backend API (if not running)

```bash
# In a separate terminal
cd /path/to/access-manager-proj
source .venv/bin/activate

# Start the backend API
uvicorn src.api.main:app --reload --port 8000
```

Verify it's running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy", ...}
```

## Step 6: Start the Agent Service

```bash
# In the project root
cd /path/to/access-manager-proj
source .venv/bin/activate

# Start the agent service
uvicorn src.agent.main:app --reload --port 8001
```

Expected output:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Agent service starting...
INFO:     Documentation loaded from ./docs/accesses.md
INFO:     Connected to backend API at http://localhost:8000
INFO:     AWS Bedrock configured with model: anthropic.claude-sonnet-4-20250514-v1:0
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

## Step 7: Test the Agent

### Test 1: Health Check

```bash
curl http://localhost:8001/agent/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Access Management Agent",
  "version": "1.0.0",
  "backend_api_status": "reachable",
  "bedrock_status": "configured"
}
```

### Test 2: Simple Access Request

```bash
curl -X POST http://localhost:8001/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need access to read documents",
    "user_id": 1,
    "username": "test_user"
  }'
```

Expected response:
```json
{
  "response": "I found READ_DOCUMENTS access which allows you to view documents in the system. Would you like me to grant this access to you?",
  "session_id": null,
  "tools_used": ["list_available_accesses"],
  "accesses_granted": []
}
```

### Test 3: Confirm Access Grant

```bash
curl -X POST http://localhost:8001/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Yes please, grant me that access",
    "session_id": "user-1-sess-abc",
    "user_id": 1,
    "username": "test_user"
  }'
```

Expected response:
```json
{
  "response": "I've granted you READ_DOCUMENTS access. You can now view documents in the system.",
  "session_id": "user-1-sess-abc",
  "tools_used": ["grant_access_to_user"],
  "accesses_granted": ["READ_DOCUMENTS"]
}
```

### Test 4: Streaming Response

```bash
curl -X POST http://localhost:8001/agent/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What accesses are available?",
    "user_id": 1,
    "username": "test_user"
  }' \
  --no-buffer
```

Expected output (Server-Sent Events):
```
event: tool_use
data: {"event_type": "tool_use", "content": "list_available_accesses"}

event: data
data: {"event_type": "data", "content": "I found "}

event: data
data: {"event_type": "data", "content": "the following "}

event: data
data: {"event_type": "data", "content": "accesses..."}

event: done
data: {"event_type": "done"}
```

## Step 8: Verify in Backend API

Check that the access was actually granted:

```bash
curl -X GET http://localhost:8000/users/1/accesses \
  -H "X-Username: test_user"
```

Expected response:
```json
{
  "user_id": 1,
  "username": "test_user",
  "accesses": [
    {
      "id": 1,
      "name": "READ_DOCUMENTS",
      "description": "View documents in the system",
      "assigned_at": "2026-02-11T15:30:00Z"
    }
  ]
}
```

## Common Issues & Solutions

### Issue 1: "Backend API unreachable"

**Solution**: Ensure the backend API is running on port 8000:
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, start it
uvicorn src.api.main:app --reload --port 8000
```

### Issue 2: "AWS Bedrock authentication failed"

**Solutions**:
1. Verify AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```
2. Check model access in Bedrock console
3. Verify region is correct in `.env`

### Issue 3: "Documentation file not found"

**Solution**: Ensure `docs/accesses.md` exists:
```bash
ls -la docs/accesses.md
# If not found, create it with sample content (see Step 4)
```

### Issue 4: "Admin key invalid"

**Solution**: Update `BACKEND_ADMIN_KEY` in `.env` to match the backend API configuration:
```bash
# Check backend config
grep ADMIN_KEY src/config.py

# Update .env with correct key
echo "BACKEND_ADMIN_KEY=your-correct-key" >> .env
```

### Issue 5: Agent gives wrong accesses

**Solution**: Check documentation format:
1. Ensure access names match backend API catalog
2. Use consistent naming (READ_DOCUMENTS, not "read documents")
3. Include clear descriptions for each access

## Next Steps

### Development Workflow

1. **Modify system prompt**: Edit `src/agent/prompts/system_prompt.py`
2. **Add new tools**: Create functions in `src/agent/tools/`
3. **Update documentation**: Edit `docs/accesses.md` (agent will reload automatically)
4. **Test changes**: Use curl or write integration tests

### Testing

Run automated tests:
```bash
# Unit tests
pytest tests/agent/test_tools.py -v

# Integration tests (requires backend running)
pytest tests/agent/test_agent.py -v --integration

# All agent tests
pytest tests/agent/ -v
```

### Debugging

Enable debug logging:
```bash
# Add to .env
LOG_LEVEL=DEBUG

# Restart agent service
# You'll see detailed logs of agent reasoning and tool calls
```

### Production Deployment

See [deployment guide](./deployment.md) for:
- AWS ECS Fargate deployment
- Environment variable configuration
- Scaling and monitoring
- Cost optimization

## API Documentation

Once running, view interactive API docs:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **OpenAPI JSON**: http://localhost:8001/openapi.json

## Example Conversation Flows

### Flow 1: Discover and Request

**User**: "What accesses do engineers typically need?"

**Agent**: "Engineers typically need: READ_DOCUMENTS (view project docs), WRITE_DOCUMENTS (edit docs), and DEPLOY_STAGING (deploy to staging). Which of these would you like?"

**User**: "I need read and write for documents"

**Agent**: "I'll grant you both READ_DOCUMENTS and WRITE_DOCUMENTS. Confirm?"

**User**: "Yes"

**Agent**: "Done! You now have READ_DOCUMENTS and WRITE_DOCUMENTS access."

### Flow 2: Ambiguous Request

**User**: "I need database access"

**Agent**: "I found multiple database accesses: DB_READ_DEV, DB_READ_STAGING, DB_READ_PROD. Which environment do you need?"

**User**: "Production, read-only"

**Agent**: "I'll grant you DB_READ_PROD. Confirm?"

**User**: "Yes"

**Agent**: "Done! You now have DB_READ_PROD access."

## Support

- **Documentation**: See `specs/002-access-agent/` for detailed design docs
- **Backend API**: See `specs/001-access-management-api/` for API documentation
- **Issues**: Check logs in console for error messages
- **AWS Bedrock**: See [AWS Bedrock documentation](https://docs.aws.amazon.com/bedrock/)

## Summary

You've successfully:
- ✅ Installed agent dependencies
- ✅ Configured AWS Bedrock
- ✅ Created access documentation
- ✅ Started the agent service
- ✅ Tested basic conversations
- ✅ Verified access grants

The agent is now ready for development and testing!

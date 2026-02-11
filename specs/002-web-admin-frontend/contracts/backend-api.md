# Backend API Integration Contract

**Feature**: 002-web-admin-frontend  
**Date**: 2026-02-09  
**Backend Service**: Access Management API (Feature 001)

## Overview

This document maps the existing FastAPI backend endpoints to the frontend integration requirements. The Next.js API routes will call these backend endpoints.

---

## Backend Base URL

**Development**: `http://localhost:8090`  
**Docker**: `http://backend:8000` (internal service name)  
**Production**: Configured via `BACKEND_URL` environment variable

---

## Authentication Headers

### User Authentication

```
X-Username: <userId>
```

Used for all user-specific endpoints. The userId is extracted from the frontend session cookie.

### Admin Authentication

```
X-Admin-Secret: <admin_secret_key>
```

Used for all admin endpoints. The secret is stored in backend environment variables.

---

## Backend Endpoints Used by Frontend

### 1. User Access Management

#### GET /users/{user_id}/accesses

Retrieves all accesses assigned to a specific user.

**Frontend API Route**: `GET /api/accesses/user`

**Request**:
```
GET /users/{user_id}/accesses
Headers:
  X-Username: {user_id}
```

**Response** (200 OK):
```json
{
  "user_id": "string",
  "username": "string",
  "accesses": [
    {
      "access_id": "string",
      "access_name": "string",
      "granted_at": "2026-02-09T10:00:00Z"
    }
  ],
  "count": 3
}
```

**Mapping to Frontend**:
```typescript
// Backend → Frontend
{
  "access_id" → "id",
  "access_name" → "name",
  "granted_at" → "created_at"
}
```

**Error Responses**:
- 401: Invalid X-Username header
- 404: User not found

---

### 2. Admin - User Management

#### GET /admin/users

Retrieves all users in the system (admin only).

**Frontend API Route**: `GET /api/admin/users`

**Request**:
```
GET /admin/users
Headers:
  X-Admin-Secret: {admin_secret_key}
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "user_id": "string",
      "username": "string",
      "created_at": "2026-02-09T10:00:00Z",
      "accesses_count": 5
    }
  ],
  "count": 10
}
```

**Mapping to Frontend**:
```typescript
// Backend → Frontend
{
  "user_id" → "id",
  "username" → "username",
  "created_at" → "created_at",
  "accesses_count" → "access_count"
}
```

**Error Responses**:
- 401: Invalid admin secret

---

#### POST /admin/users

Creates a new user (admin only).

**Frontend API Route**: `POST /api/admin/users`

**Request**:
```
POST /admin/users
Headers:
  X-Admin-Secret: {admin_secret_key}
  Content-Type: application/json
Body:
{
  "username": "string",
  "password": "string"
}
```

**Response** (201 Created):
```json
{
  "user_id": "string",
  "username": "string",
  "created_at": "2026-02-09T10:00:00Z"
}
```

**Mapping to Frontend**:
```typescript
// Backend → Frontend
{
  "user_id" → "id",
  "username" → "username",
  "created_at" → "created_at"
}
```

**Error Responses**:
- 400: Invalid input (username format, password too short)
- 401: Invalid admin secret
- 409: Username already exists

---

### 3. Admin - Access Management

#### GET /admin/accesses

Retrieves all access types in the system (admin only).

**Frontend API Route**: `GET /api/admin/accesses`

**Request**:
```
GET /admin/accesses
Headers:
  X-Admin-Secret: {admin_secret_key}
```

**Response** (200 OK):
```json
{
  "accesses": [
    {
      "access_id": "string",
      "access_name": "string",
      "description": "string",
      "created_at": "2026-02-09T10:00:00Z",
      "users_with_access": 5
    }
  ],
  "count": 20
}
```

**Mapping to Frontend**:
```typescript
// Backend → Frontend
{
  "access_id" → "id",
  "access_name" → "name",
  "description" → "description",
  "created_at" → "created_at",
  "users_with_access" → "user_count"
}
```

**Error Responses**:
- 401: Invalid admin secret

---

#### GET /admin/accesses/{access_id}/users

Retrieves all users who have a specific access (admin only).

**Frontend API Route**: Used by `GET /api/admin/accesses` (aggregated)

**Request**:
```
GET /admin/accesses/{access_id}/users
Headers:
  X-Admin-Secret: {admin_secret_key}
```

**Response** (200 OK):
```json
{
  "access_id": "string",
  "access_name": "string",
  "users": [
    {
      "user_id": "string",
      "username": "string",
      "granted_at": "2026-02-09T10:00:00Z"
    }
  ],
  "count": 5
}
```

**Usage in Frontend**:
- Called for each access to build the complete admin view
- Consider batching or caching to reduce API calls

**Error Responses**:
- 401: Invalid admin secret
- 404: Access not found

---

#### POST /admin/accesses

Creates a new access type (admin only).

**Frontend API Route**: `POST /api/admin/accesses`

**Request**:
```
POST /admin/accesses
Headers:
  X-Admin-Secret: {admin_secret_key}
  Content-Type: application/json
Body:
{
  "access_name": "string",
  "description": "string"
}
```

**Response** (201 Created):
```json
{
  "access_id": "string",
  "access_name": "string",
  "description": "string",
  "created_at": "2026-02-09T10:00:00Z"
}
```

**Mapping to Frontend**:
```typescript
// Frontend → Backend
{
  "name" → "access_name",
  "description" → "description"
}

// Backend → Frontend
{
  "access_id" → "id",
  "access_name" → "name",
  "description" → "description",
  "created_at" → "created_at"
}
```

**Error Responses**:
- 400: Invalid input (name format, description too long)
- 401: Invalid admin secret
- 409: Access name already exists

---

### 4. Health Check

#### GET /health

Health check endpoint.

**Frontend API Route**: Optionally used by `GET /api/health`

**Request**:
```
GET /health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "Access Management API",
  "version": "1.0.0",
  "environment": "development"
}
```

**Usage in Frontend**:
- Optionally called during frontend health check
- Used to verify backend availability before serving frontend

---

## Backend Endpoints NOT Used (Out of Scope)

The following backend endpoints exist but are not needed for this frontend feature:

- `POST /users/{user_id}/accesses/request` - User request access (auto-approved)
- `POST /admin/users/{user_id}/accesses` - Admin assign access to user
- `DELETE /users/{user_id}/accesses/{access_id}` - User remove own access
- `GET /admin/analytics/*` - Analytics endpoints
- `GET /admin/exports/*` - Export endpoints

These may be implemented in future frontend iterations.

---

## Error Handling Strategy

### Backend Error Format

```json
{
  "error": {
    "message": "string",
    "type": "string",
    "details": {}
  }
}
```

### Error Translation

Next.js API routes should translate backend errors to user-friendly messages:

| Backend Error | Frontend Message |
|--------------|------------------|
| 401 Unauthorized | "Please log in to continue" |
| 403 Forbidden | "You don't have permission to perform this action" |
| 404 Not Found (User) | "User not found" |
| 404 Not Found (Access) | "Access not found" |
| 409 Conflict (Username) | "This username is already taken" |
| 409 Conflict (Access) | "This access name already exists" |
| 500 Internal Server Error | "Something went wrong. Please try again later" |
| Network Error | "Unable to connect to the server. Please check your connection" |

---

## Request Retry Strategy

For transient errors, implement simple retry logic:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response; // Don't retry 4xx errors
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
```

**Retry Policy**:
- Retry on 500+ errors and network errors
- Don't retry on 400-499 errors (client errors)
- Max 3 retries with exponential backoff
- Timeout after 10 seconds per request

---

## Performance Optimization

### Request Batching

For admin dashboard, batch requests where possible:

```typescript
// Instead of N requests for N accesses
Promise.all([
  fetch('/admin/accesses'),
  fetch('/admin/users')
]).then(([accesses, users]) => {
  // Combine data on frontend
});
```

### Caching

- Cache backend responses in Next.js API routes (5 minutes)
- Use `Cache-Control` headers if backend supports them
- Invalidate cache on POST/PUT/DELETE operations

### Connection Pooling

- Keep-alive connections to backend (default in Node.js fetch)
- Reuse connections across requests

---

## TypeScript Integration

### API Client

Create a typed API client for backend calls:

```typescript
// lib/backend-client.ts
class BackendAPIClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async getUserAccesses(userId: string): Promise<BackendAccessResponse> {
    const response = await fetch(`${this.baseURL}/users/${userId}/accesses`, {
      headers: { 'X-Username': userId }
    });
    
    if (!response.ok) {
      throw new BackendAPIError(await response.json());
    }
    
    return response.json();
  }
  
  // More methods...
}
```

### Response Types

```typescript
// types/backend.ts
export interface BackendAccessResponse {
  user_id: string;
  username: string;
  accesses: Array<{
    access_id: string;
    access_name: string;
    granted_at: string;
  }>;
  count: number;
}

export interface BackendUserResponse {
  user_id: string;
  username: string;
  created_at: string;
}

export interface BackendError {
  error: {
    message: string;
    type: string;
    details?: any;
  };
}
```

---

## Environment Configuration

### Required Environment Variables

**Frontend (Next.js)**:
```bash
BACKEND_URL=http://backend:8000          # Backend service URL
ADMIN_SECRET_KEY=your-secret-key         # Admin authentication secret (must match backend)
SESSION_SECRET=your-session-secret       # For encrypting cookies
NODE_ENV=development|production
```

**Backend (FastAPI)** - Already configured:
```bash
ADMIN_SECRET_KEY=your-secret-key         # Must match frontend
DUCKDB_PATH=./data/database/access_management.duckdb
```

### CORS Configuration (Backend)

Update FastAPI to allow frontend container:

```python
# src/api/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local development
        "http://frontend:3000",       # Docker container
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing Backend Integration

### Mock Backend for Frontend Tests

```typescript
// tests/mocks/backend.ts
import { http, HttpResponse } from 'msw';

export const backendHandlers = [
  http.get('/users/:userId/accesses', ({ params }) => {
    return HttpResponse.json({
      user_id: params.userId,
      username: 'testuser',
      accesses: [
        {
          access_id: '1',
          access_name: 'READ_DOCUMENTS',
          granted_at: '2026-02-09T10:00:00Z'
        }
      ],
      count: 1
    });
  }),
  
  // More handlers...
];
```

### Integration Tests

Test Next.js API routes against real backend (or mock):

```typescript
// tests/integration/api-routes.test.ts
describe('GET /api/accesses/user', () => {
  it('returns user accesses', async () => {
    // Setup: authenticate user
    const authResponse = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId: 'testuser' })
    });
    const cookies = authResponse.headers.get('set-cookie');
    
    // Test: fetch accesses
    const response = await fetch('/api/accesses/user', {
      headers: { cookie: cookies }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.accesses).toBeInstanceOf(Array);
  });
});
```

---

## Next Steps

✅ Backend API Integration Contract Complete
⏭️ Create TypeScript Types File
⏭️ Create Quickstart Guide
⏭️ Update Agent Context

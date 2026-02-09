# API Routes Contract - Web Admin Frontend

**Feature**: 002-web-admin-frontend  
**Date**: 2026-02-09  
**Version**: 1.0.0

## Overview

This document specifies the Next.js API routes that serve as a proxy/adapter layer between the frontend and the backend FastAPI service. All routes are located in `/frontend/src/app/api/`.

---

## Base Configuration

**Backend Base URL**: `http://backend:8000` (Docker) or `http://localhost:8090` (local dev)  
**Authentication**: HTTP-only cookies set by API routes  
**Error Format**: Standardized JSON error responses

---

## 1. Authentication Routes

### POST /api/auth/login

Authenticates a user or admin and establishes a session.

**Request**:
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "userId": string  // Username or "admin"
}
```

**Success Response** (200 OK):
```typescript
{
  "success": true,
  "user": {
    "id": string,
    "username": string,
    "created_at": string,
    "is_admin": boolean
  },
  "role": "user" | "admin"
}

Set-Cookie: auth-token=<encrypted-session>; HttpOnly; Path=/; SameSite=Strict
Set-Cookie: user-role=<role>; HttpOnly; Path=/; SameSite=Strict
```

**Error Responses**:
- **400 Bad Request**: Missing userId
  ```json
  {
    "error": {
      "message": "userId is required",
      "type": "ValidationError"
    }
  }
  ```
- **401 Unauthorized**: Invalid credentials
  ```json
  {
    "error": {
      "message": "Invalid user ID",
      "type": "AuthenticationError"
    }
  }
  ```

**Backend Integration**:
- If userId === "admin": Use admin secret key from env
- Otherwise: Call `GET /users/{userId}` with X-Username header
- Validate user exists before setting cookie

**Implementation Notes**:
- Set HTTP-only cookies to prevent XSS
- Use SameSite=Strict for CSRF protection
- Encrypt session data (userId, role) in cookie
- Set expiration (e.g., 8 hours)

---

### POST /api/auth/logout

Terminates the current user session.

**Request**:
```typescript
POST /api/auth/logout
Cookie: auth-token=<session>
```

**Success Response** (200 OK):
```typescript
{
  "success": true
}

Set-Cookie: auth-token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0
Set-Cookie: user-role=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0
```

**Error Responses**:
- **401 Unauthorized**: No active session
  ```json
  {
    "error": {
      "message": "No active session",
      "type": "AuthenticationError"
    }
  }
  ```

**Implementation Notes**:
- Clear cookies by setting Max-Age=0
- No backend call needed (stateless)

---

### GET /api/auth/session

Validates the current session and returns user info.

**Request**:
```typescript
GET /api/auth/session
Cookie: auth-token=<session>
```

**Success Response** (200 OK):
```typescript
{
  "isAuthenticated": true,
  "user": {
    "id": string,
    "username": string,
    "created_at": string,
    "is_admin": boolean
  },
  "role": "user" | "admin"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid or expired session
  ```json
  {
    "isAuthenticated": false,
    "error": {
      "message": "Session expired or invalid",
      "type": "AuthenticationError"
    }
  }
  ```

**Implementation Notes**:
- Decrypt and validate cookie
- Return user info from cookie (no backend call unless validation needed)
- Used on app initialization to restore session

---

## 2. User Access Routes

### GET /api/accesses/user

Retrieves the current user's assigned accesses.

**Request**:
```typescript
GET /api/accesses/user
Cookie: auth-token=<session>
```

**Success Response** (200 OK):
```typescript
{
  "accesses": [
    {
      "id": string,
      "name": string,
      "description": string | null,
      "created_at": string
    }
  ],
  "count": number
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Admin trying to use user endpoint

**Backend Integration**:
- Extract userId from cookie
- Call `GET /users/{userId}/accesses` with X-Username header
- Map response to frontend format

---

## 3. Admin Access Routes

### GET /api/admin/accesses

Retrieves all accesses in the system with user assignment information.

**Request**:
```typescript
GET /api/admin/accesses
Cookie: auth-token=<session>
```

**Success Response** (200 OK):
```typescript
{
  "accesses": [
    {
      "id": string,
      "name": string,
      "description": string | null,
      "created_at": string,
      "user_count": number,
      "assigned_users": [
        {
          "id": string,
          "username": string
        }
      ]
    }
  ],
  "count": number
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User is not admin

**Backend Integration**:
- Verify admin role from cookie
- Call `GET /admin/accesses` with admin secret header
- Optionally call `GET /admin/accesses/{id}/users` for each access to get user list
- Aggregate data and return

**Performance Consideration**:
- May require multiple backend calls
- Consider caching this response for 5 minutes

---

### POST /api/admin/accesses

Creates a new access type.

**Request**:
```typescript
POST /api/admin/accesses
Cookie: auth-token=<session>
Content-Type: application/json

{
  "name": string,          // Uppercase with underscores
  "description": string    // Optional
}
```

**Success Response** (201 Created):
```typescript
{
  "success": true,
  "access": {
    "id": string,
    "name": string,
    "description": string | null,
    "created_at": string
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid input
  ```json
  {
    "error": {
      "message": "Invalid access name format",
      "type": "ValidationError",
      "details": { "field": "name" }
    }
  }
  ```
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User is not admin
- **409 Conflict**: Access name already exists
  ```json
  {
    "error": {
      "message": "Access name already exists",
      "type": "ConflictError"
    }
  }
  ```

**Backend Integration**:
- Verify admin role from cookie
- Validate input with Zod schema
- Call `POST /admin/accesses` with admin secret header
- Return created access

---

## 4. Admin User Routes

### GET /api/admin/users

Retrieves all users in the system.

**Request**:
```typescript
GET /api/admin/users
Cookie: auth-token=<session>
```

**Success Response** (200 OK):
```typescript
{
  "users": [
    {
      "id": string,
      "username": string,
      "created_at": string,
      "access_count": number  // Number of accesses assigned to user
    }
  ],
  "count": number
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User is not admin

**Backend Integration**:
- Verify admin role from cookie
- Call `GET /admin/users` with admin secret header
- Return user list

---

### POST /api/admin/users

Creates a new user.

**Request**:
```typescript
POST /api/admin/users
Cookie: auth-token=<session>
Content-Type: application/json

{
  "username": string,
  "password": string  // Stored but not used for POC authentication
}
```

**Success Response** (201 Created):
```typescript
{
  "success": true,
  "user": {
    "id": string,
    "username": string,
    "created_at": string
  }
}
```

**Error Responses**:
- **400 Bad Request**: Invalid input
  ```json
  {
    "error": {
      "message": "Username must be alphanumeric",
      "type": "ValidationError",
      "details": { "field": "username" }
    }
  }
  ```
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: User is not admin
- **409 Conflict**: Username already exists
  ```json
  {
    "error": {
      "message": "Username already exists",
      "type": "ConflictError"
    }
  }
  ```

**Backend Integration**:
- Verify admin role from cookie
- Validate input with Zod schema
- Call `POST /admin/users` with admin secret header
- Return created user

---

## 5. Health Check Route

### GET /api/health

Health check endpoint for Docker health checks.

**Request**:
```typescript
GET /api/health
```

**Success Response** (200 OK):
```typescript
{
  "status": "healthy",
  "service": "Access Management Frontend",
  "timestamp": string  // ISO 8601
}
```

**Implementation Notes**:
- No authentication required
- Optionally check backend health
- Used by Docker Compose healthcheck

---

## Middleware

### Authentication Middleware

All API routes (except `/api/auth/*` and `/api/health`) require authentication.

**Implementation**:
```typescript
// middleware.ts or per-route check
export function requireAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Authentication required',
          type: 'AuthenticationError'
        }
      }),
      { status: 401 }
    );
  }
  
  // Validate and decrypt token
  // Return user info for use in route handler
}
```

### Admin Authorization Middleware

Admin-only routes (`/api/admin/*`) require admin role.

**Implementation**:
```typescript
export function requireAdmin(request: NextRequest) {
  const role = request.cookies.get('user-role');
  
  if (role?.value !== 'admin') {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Admin access required',
          type: 'AuthorizationError'
        }
      }),
      { status: 403 }
    );
  }
}
```

---

## Error Handling

All API routes should catch errors and return consistent error responses.

**Error Response Format**:
```typescript
{
  error: {
    message: string,      // Human-readable error message
    type: string,         // Error type (ValidationError, AuthenticationError, etc.)
    details?: any         // Optional additional details
  }
}
```

**HTTP Status Codes**:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Authorization failed (authenticated but not permitted)
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., username exists)
- `500 Internal Server Error` - Unexpected server error

---

## CORS Configuration

**Not needed** - Frontend and API routes share the same origin.

Backend CORS must allow internal Docker network calls:
```python
# FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://frontend:3000"],  # Docker service name
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Rate Limiting

**Out of scope for POC** - Consider implementing in production:
- Per-IP rate limiting
- Per-user rate limiting
- Stricter limits on admin endpoints

---

## Security Considerations

1. **HTTP-only cookies** - Prevents XSS attacks
2. **SameSite=Strict** - Prevents CSRF attacks
3. **HTTPS in production** - Set Secure flag on cookies
4. **Input validation** - Zod schemas for all inputs
5. **Error messages** - Don't leak sensitive info (e.g., "user exists" vs "invalid credentials")
6. **Cookie encryption** - Encrypt session data in cookies
7. **Short session lifetime** - Default 8 hours, configurable

---

## Next Steps

✅ API Routes Contract Complete
⏭️ Create Backend API Integration Contract
⏭️ Create TypeScript Types File
⏭️ Create Quickstart Guide

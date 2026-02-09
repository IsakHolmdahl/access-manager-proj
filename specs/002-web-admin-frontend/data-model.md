# Phase 1: Data Model - Web Admin Frontend

**Feature**: 002-web-admin-frontend  
**Date**: 2026-02-09  
**Status**: Complete

## Overview

This document defines the frontend data models, state structures, and entities used in the Web Admin Frontend. These models represent client-side state and are mapped from backend API responses.

---

## 1. Core Entities

### 1.1 User

Represents a user in the system, either a regular user or administrator.

**TypeScript Definition**:
```typescript
interface User {
  id: string;              // Unique user identifier
  username: string;        // Username (used for login)
  created_at: string;      // ISO 8601 timestamp
  is_admin?: boolean;      // True if user has admin privileges (derived from username === "admin")
}
```

**Validation Rules**:
- `id` must be non-empty string
- `username` must be non-empty, alphanumeric with underscores/hyphens
- `created_at` must be valid ISO 8601 date string

**State Locations**:
- Authentication context (current user)
- Admin user list (all users)

**Sources**:
- Backend API: `GET /users` (admin)
- Backend API: `POST /admin/users` (user creation)
- Authentication: derived from login response

---

### 1.2 Access

Represents an individual access/permission that can be assigned to users.

**TypeScript Definition**:
```typescript
interface Access {
  id: string;              // Unique access identifier
  name: string;            // Human-readable access name (e.g., "READ_DOCUMENTS")
  description?: string;    // Optional description of what this access grants
  created_at: string;      // ISO 8601 timestamp
  assigned_users?: User[]; // Users who have this access (admin view only)
  user_count?: number;     // Count of users with this access (admin view)
}
```

**Validation Rules**:
- `id` must be non-empty string
- `name` must be non-empty, uppercase with underscores (e.g., "READ_DOCUMENTS")
- `created_at` must be valid ISO 8601 date string
- `user_count` must be non-negative integer if present

**State Locations**:
- User dashboard (user's assigned accesses)
- Admin dashboard (all accesses with assignments)
- Access creation form

**Sources**:
- Backend API: `GET /users/{user_id}/accesses` (user view)
- Backend API: `GET /admin/accesses` (admin view)
- Backend API: `POST /admin/accesses` (access creation)

---

### 1.3 User Session

Represents the current authenticated user's session state.

**TypeScript Definition**:
```typescript
interface UserSession {
  user: User | null;              // Current user or null if not authenticated
  role: 'user' | 'admin' | null;  // User role
  isAuthenticated: boolean;       // Authentication status
  isLoading: boolean;             // Loading state during auth check
  error: string | null;           // Authentication error message
}
```

**State Management**:
- Stored in React Context (`AuthContext`)
- Persisted in HTTP-only cookies (server-side)
- Initialized on app load by checking cookie validity

**State Transitions**:
```
Initial State (isLoading: true, isAuthenticated: false, user: null)
    ↓
Login Success → (isAuthenticated: true, user: {...}, role: 'user'|'admin')
    ↓
Logout → (isAuthenticated: false, user: null, role: null)
    ↓
Session Expired → (isAuthenticated: false, user: null, error: '...')
```

---

## 2. UI State Models

### 2.1 Access List State (User View)

Manages the display of user's personal accesses.

**TypeScript Definition**:
```typescript
interface UserAccessListState {
  accesses: Access[];           // List of user's accesses
  isLoading: boolean;           // Loading state
  error: string | null;         // Error message if fetch failed
  isEmpty: boolean;             // True if user has no accesses
  lastFetched: number | null;   // Timestamp of last fetch (for caching)
}
```

**Actions**:
- `fetchAccesses()` - Load user's accesses from API
- `refresh()` - Reload accesses from API
- `clearError()` - Clear error state

---

### 2.2 Access Management State (Admin View)

Manages the display of all accesses and their assignments.

**TypeScript Definition**:
```typescript
interface AdminAccessManagementState {
  accesses: Access[];              // All accesses in the system
  selectedAccess: Access | null;   // Currently selected access (for detail view)
  isLoading: boolean;              // Loading state
  error: string | null;            // Error message
  filters: {
    search: string;                // Search filter
    hasUsers: boolean | null;      // Filter: true (has users), false (no users), null (all)
  };
  lastFetched: number | null;
}
```

**Actions**:
- `fetchAllAccesses()` - Load all accesses
- `selectAccess(accessId)` - Select an access for detail view
- `filterAccesses(filters)` - Apply filters to access list
- `refresh()` - Reload accesses

---

### 2.3 User Management State (Admin)

Manages user creation and listing.

**TypeScript Definition**:
```typescript
interface AdminUserManagementState {
  users: User[];                   // All users in the system
  isLoading: boolean;
  error: string | null;
  createUserForm: {
    isOpen: boolean;               // Form modal open state
    isSubmitting: boolean;         // Form submission state
    error: string | null;          // Form-specific error
  };
  lastFetched: number | null;
}
```

**Actions**:
- `fetchUsers()` - Load all users
- `openCreateUserForm()` - Open user creation modal
- `closeCreateUserForm()` - Close user creation modal
- `createUser(userData)` - Submit new user creation
- `refresh()` - Reload users

---

### 2.4 Form State Models

#### User Creation Form

**TypeScript Definition**:
```typescript
interface UserCreationFormData {
  username: string;         // Required: alphanumeric + underscore/hyphen
  password: string;         // Required: min 8 characters (stored but not used for POC auth)
  confirmPassword: string;  // Required: must match password
}

interface UserCreationFormState {
  data: UserCreationFormData;
  errors: Record<keyof UserCreationFormData, string>;
  isValid: boolean;
  isDirty: boolean;
}
```

**Validation Rules**:
- `username`: 3-50 characters, alphanumeric with underscore/hyphen, no spaces
- `password`: 8-100 characters
- `confirmPassword`: must match password exactly

**Zod Schema**:
```typescript
const userCreationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

#### Access Creation Form

**TypeScript Definition**:
```typescript
interface AccessCreationFormData {
  name: string;             // Required: uppercase with underscores
  description: string;      // Optional: descriptive text
}

interface AccessCreationFormState {
  data: AccessCreationFormData;
  errors: Record<keyof AccessCreationFormData, string>;
  isValid: boolean;
  isDirty: boolean;
}
```

**Validation Rules**:
- `name`: 3-100 characters, uppercase letters with underscores, no spaces
- `description`: 0-500 characters, optional

**Zod Schema**:
```typescript
const accessCreationSchema = z.object({
  name: z.string()
    .min(3, 'Access name must be at least 3 characters')
    .max(100, 'Access name is too long')
    .regex(/^[A-Z_]+$/, 'Access name must be uppercase letters and underscores only')
    .transform(val => val.toUpperCase()),
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
});
```

---

### 2.5 Chat State (Placeholder)

**TypeScript Definition**:
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];     // Empty for placeholder
  isEnabled: boolean;          // Always false for placeholder
  isExpanded: boolean;         // UI state (mobile: collapsed by default)
  placeholderText: string;     // Informational text
}
```

**Initial State**:
```typescript
{
  messages: [],
  isEnabled: false,
  isExpanded: false,
  placeholderText: "The AI Access Assistant is coming soon! This feature will help you request and understand your access permissions."
}
```

---

### 2.6 Navigation State (Mobile)

**TypeScript Definition**:
```typescript
interface NavigationState {
  isMobileMenuOpen: boolean;   // Hamburger menu state
  activeTab: 'dashboard' | 'chat' | 'profile';  // Bottom nav active tab (mobile)
  isSidebarCollapsed: boolean; // Desktop sidebar state (not applicable for minimal pages)
}
```

**Actions**:
- `toggleMobileMenu()` - Open/close mobile hamburger menu
- `setActiveTab(tab)` - Change active bottom nav tab
- `toggleSidebar()` - Collapse/expand desktop sidebar

---

## 3. API Response Mapping

### 3.1 Backend to Frontend Type Mapping

| Backend Field | Frontend Field | Transformation |
|--------------|---------------|----------------|
| `user_id` | `id` | Direct mapping |
| `username` | `username` | Direct mapping |
| `access_id` | `id` | Direct mapping |
| `access_name` | `name` | Direct mapping |
| `created_at` | `created_at` | Parse as ISO string, validate |
| `assigned_user_count` | `user_count` | Direct mapping |
| `error.message` | `error` | Extract message string |

### 3.2 Error Response Structure

**Backend Error Format** (from FastAPI):
```json
{
  "error": {
    "message": "User not found",
    "type": "NotFoundError",
    "details": {}
  }
}
```

**Frontend Error State**:
```typescript
interface APIError {
  message: string;
  type?: string;
  details?: any;
}
```

---

## 4. State Management Architecture

### 4.1 Context Providers

```typescript
// Authentication Context
<AuthProvider>
  <App />
</AuthProvider>

// Within App: conditional rendering based on auth state
function App() {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) return <LoginPage />;
  if (role === 'admin') return <AdminDashboard />;
  return <UserDashboard />;
}
```

### 4.2 Component State Ownership

| State | Owner | Storage |
|-------|-------|---------|
| User Session | `AuthContext` | React Context + HTTP-only Cookie |
| User Access List | `UserDashboard` component | Local state |
| Admin Access List | `AdminDashboard` component | Local state |
| Forms | Form component | Local state (React Hook Form) |
| Chat | `ChatInterface` component | Local state |
| Mobile Menu | Layout component | Local state |

### 4.3 Data Flow

```
User Login
    ↓
API Route: /api/auth/login
    ↓
Set HTTP-only Cookie
    ↓
AuthContext updates (isAuthenticated: true)
    ↓
Redirect to Dashboard
    ↓
Dashboard fetches accesses via /api/accesses/user
    ↓
Display access list
```

---

## 5. Caching Strategy

### 5.1 Client-Side Caching

**Approach**: Simple timestamp-based caching

```typescript
interface CachedData<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid<T>(cached: CachedData<T> | null): boolean {
  return cached !== null && Date.now() < cached.expiresAt;
}
```

**Cached Entities**:
- User accesses: 5 minutes
- All accesses (admin): 5 minutes
- User list (admin): 5 minutes

**Cache Invalidation**:
- Manual refresh button
- After create operations
- After logout

---

## 6. Loading & Error States

### 6.1 Loading States

| State | UI Indicator |
|-------|-------------|
| Initial page load | Full-page spinner |
| Fetching accesses | Skeleton loader in access list |
| Form submission | Button spinner + disabled state |
| Refreshing data | Small refresh icon animation |

### 6.2 Error States

| Error Type | UI Display |
|-----------|-----------|
| Network error | Toast notification: "Connection failed" |
| Authentication error | Redirect to login with error message |
| Validation error | Inline form errors (per field) |
| API error | Toast notification with message |
| Not found | Empty state with message |

---

## 7. Type Safety

All models are fully typed with TypeScript. Key principles:

1. **No `any` types** - Use `unknown` and type guards where needed
2. **Strict null checks** - All nullable fields explicitly marked with `| null`
3. **Runtime validation** - Use Zod schemas for API responses and form inputs
4. **Type guards** - Define type guards for discriminated unions

**Example Type Guard**:
```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'username' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).username === 'string'
  );
}
```

---

## Next Steps

✅ Data Model Complete
⏭️ Create API Contracts (contracts/)
⏭️ Create Quickstart Guide (quickstart.md)
⏭️ Update Agent Context

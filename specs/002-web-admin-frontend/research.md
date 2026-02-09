# Phase 0: Research - Web Admin Frontend

**Feature**: 002-web-admin-frontend  
**Date**: 2026-02-09  
**Status**: Complete

## Overview

This document consolidates research findings for implementing a Next.js 14+ frontend with TypeScript, Tailwind CSS, and shadcn/ui components. The research addresses technical decisions, best practices, and integration patterns needed for the feature.

---

## 1. Next.js 14 App Router Best Practices

### Decision: Use App Router with Server Components by Default

**Rationale**:
- App Router is the recommended approach for Next.js 14+ applications
- Server Components reduce JavaScript bundle size and improve performance
- Better SEO and initial page load times
- Simplified data fetching patterns with async/await

**Implementation Approach**:
- **Server Components** (default): Layout, static content, data fetching
- **Client Components** ("use client"): Interactive UI, forms, state management, hooks
- **API Routes**: Backend proxy layer in `/app/api/` directory

**Key Patterns**:
```typescript
// Server Component (default)
async function UserDashboard() {
  const data = await fetchData(); // Server-side data fetching
  return <div>{data}</div>;
}

// Client Component (interactive)
'use client'
function LoginForm() {
  const [state, setState] = useState();
  return <form>...</form>;
}
```

**Environment Variables**:
- `NEXT_PUBLIC_*` prefix for client-side variables
- No prefix for server-side only variables
- Use `.env.local` for local development

**Build Optimization**:
- Enable TypeScript strict mode
- Use dynamic imports for large components
- Implement proper image optimization with next/image
- Configure output: 'standalone' for Docker deployment

**Alternatives Considered**:
- Pages Router: Rejected because App Router is the future of Next.js and provides better DX
- Pure SPA with React: Rejected because Next.js provides better developer experience, routing, and API routes functionality

---

## 2. shadcn/ui Integration

### Decision: Use shadcn/ui Component Library with Tailwind CSS

**Rationale**:
- Copy-paste component approach (no package dependency)
- Full control over component code and styling
- Built on Radix UI primitives (accessible, unstyled)
- Perfect integration with Tailwind CSS
- Highly customizable and themeable
- TypeScript support out of the box

**Installation Approach**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

**Components Needed**:
- **Forms**: Button, Input, Label, Form (with React Hook Form)
- **Data Display**: Card, Table, Badge
- **Layout**: Separator, Tabs
- **Feedback**: Toast, Alert, Dialog
- **Navigation**: Dropdown Menu, Avatar

**Theming with Tailwind**:
- Use CSS variables for theme colors in `globals.css`
- Configure `tailwind.config.ts` with custom color palette
- Support light mode only (dark mode out of scope for POC)

**Mobile Responsive Patterns**:
- Use Tailwind responsive prefixes (sm:, md:, lg:)
- Mobile-first approach (base styles for mobile, override for desktop)
- shadcn Sheet component for mobile menus
- Responsive table patterns (cards on mobile, table on desktop)

**Alternatives Considered**:
- Material-UI (MUI): Rejected due to heavier bundle size and less customization
- Ant Design: Rejected due to opinionated styling that's harder to customize
- Chakra UI: Rejected because shadcn/ui provides better control and no dependency
- Custom components from scratch: Rejected due to time constraints and accessibility concerns

---

## 3. Authentication Strategy

### Decision: Cookie-Based Session with HTTP-Only Cookies

**Rationale**:
- More secure than localStorage (protected from XSS attacks)
- Automatic cookie sending with requests
- Next.js middleware support for route protection
- Better alignment with SSR/SSG capabilities
- Can be server-side validated before rendering

**Implementation Pattern**:
```typescript
// API route sets HTTP-only cookie
export async function POST(request: Request) {
  const { userId } = await request.json();
  
  // Validate with backend
  const response = await fetch('http://backend:8000/api/validate', {
    headers: { 'X-Username': userId }
  });
  
  if (response.ok) {
    // Set HTTP-only cookie
    const headers = new Headers();
    headers.append('Set-Cookie', `auth-token=${userId}; HttpOnly; Path=/; SameSite=Strict`);
    return new Response(JSON.stringify({ success: true }), { headers });
  }
}
```

**Middleware for Protected Routes**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

**Admin vs User Role Handling**:
- Store role in cookie along with identifier
- Check role in middleware for `/admin/*` routes
- API routes validate role before proxying to backend

**Security Considerations**:
- Use SameSite=Strict for CSRF protection
- HttpOnly flag prevents JavaScript access
- Secure flag in production (HTTPS)
- Short session lifetime (configurable)
- No sensitive data in cookies (only session identifier)

**Alternatives Considered**:
- localStorage: Rejected due to XSS vulnerability and inability to use in Server Components
- JWT in Authorization header: Rejected because cookies are simpler for this POC
- NextAuth.js: Rejected as overkill for simplified authentication

---

## 4. Backend Integration Patterns

### Decision: Next.js API Routes as Backend Proxy Layer

**Rationale**:
- Hides backend URL from client (security)
- Centralizes authentication header injection
- Enables request/response transformation
- Simplifies CORS (frontend and API routes same origin)
- Type-safe API client with TypeScript

**Proxy Pattern**:
```typescript
// /app/api/accesses/user/route.ts
export async function GET(request: Request) {
  const userId = getUserIdFromCookie(request);
  
  const response = await fetch(`${process.env.BACKEND_URL}/users/${userId}/accesses`, {
    headers: {
      'X-Username': userId,
    }
  });
  
  return Response.json(await response.json());
}
```

**CORS Configuration**:
- Not needed between frontend and Next.js API routes (same origin)
- Backend CORS must allow Next.js server (Docker network internal calls)
- Update FastAPI CORS middleware to allow frontend container hostname

**Error Handling**:
- Standardize error responses from backend
- Map backend errors to frontend-friendly messages
- Return consistent error structure:
```typescript
{
  error: {
    message: string;
    type: string;
    details?: any;
  }
}
```

**Type Safety**:
- Define TypeScript interfaces for all API responses
- Use Zod schemas for runtime validation
- Share types between API routes and components

**Development Proxy**:
```javascript
// next.config.js
module.exports = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8090',
  },
};
```

**Alternatives Considered**:
- Direct frontend-to-backend calls: Rejected due to CORS complexity and exposed backend URL
- tRPC: Rejected as overkill for this simple integration
- GraphQL layer: Rejected due to complexity and time constraints

---

## 5. Docker Compose Multi-Service Setup

### Decision: Multi-Container Setup with Frontend + Backend Services

**Rationale**:
- Matches production architecture
- Isolated service concerns
- Independent scaling capability
- Simplified development environment
- Network isolation between services

**Docker Compose Structure**:
```yaml
version: '3.8'

services:
  backend:
    # Existing backend service
    container_name: access-management-api
    ports:
      - "8090:8000"
    networks:
      - access-mgmt-network
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: access-management-frontend
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://backend:8000
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - access-mgmt-network
    volumes:
      - ./frontend/src:/app/src  # Development hot reload
      - /app/node_modules         # Don't override node_modules

networks:
  access-mgmt-network:
    driver: bridge
```

**Frontend Dockerfile** (Multi-stage):
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

**Network Configuration**:
- Bridge network for service communication
- Frontend calls backend via service name: `http://backend:8000`
- External port mapping for local access

**Volume Mounting**:
- Mount source code for development hot reload
- Exclude node_modules (use container's version)
- Mount data directory for backend persistence

**Health Checks**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 3s
  retries: 3
```

**Service Dependencies**:
- Frontend depends_on backend
- Use healthcheck for readiness (not just startup)

**Alternatives Considered**:
- Single container with both services: Rejected due to complexity and anti-pattern
- Kubernetes: Rejected as overkill for POC
- Docker Swarm: Rejected as overkill for POC

---

## 6. Single-Page Layout Strategy

### Decision: App Router Layout with Conditional Rendering

**Rationale**:
- Minimal page navigation as required
- Smooth user experience with client-side state
- Responsive layout adapts to screen size
- Shared layout components reduce duplication

**Layout Composition**:
```
app/
├── layout.tsx              # Root layout (auth check)
├── page.tsx                # Main page (user dashboard + chat)
├── login/page.tsx          # Login page (separate)
└── admin/
    ├── layout.tsx          # Admin layout (role check)
    └── page.tsx            # Admin dashboard
```

**Mobile Navigation Pattern**:
- Bottom navigation bar on mobile (< 768px)
- Sidebar on desktop (>= 768px)
- Hamburger menu for secondary actions
- Collapsible chat on mobile (overlay or bottom sheet)

**Desktop Layout**:
```
+----------------------------------+
| Header (logo, user, logout)      |
+--------+-------------------------+
| Side   | Main Content            |
| bar    | +---------------------+ |
| Nav    | | Access List         | |
|        | +---------------------+ |
|        | | Chat (always shown) | |
+--------+-------------------------+
```

**Mobile Layout**:
```
+----------------------------------+
| Header (logo, user)              |
+----------------------------------+
| Main Content (scrollable)        |
| +------------------------------+ |
| | Access List                  | |
| +------------------------------+ |
| | Chat (collapsible)           | |
+----------------------------------+
| Bottom Nav (tabs)                |
+----------------------------------+
```

**Chat Interface Positioning**:
- Desktop: Always visible in main content area, below access list or side-by-side
- Mobile: Collapsible section with expand/collapse button, or separate tab in bottom nav

**State Management**:
- React Context for global auth state
- Local component state for UI (modals, drawers)
- React Query (TanStack Query) for server state (optional, can use SWR or simple fetch)

**Alternatives Considered**:
- Multi-page app: Rejected due to requirement for minimal separate pages
- Full SPA with React Router: Rejected because Next.js App Router provides better structure
- State management library (Redux, Zustand): Rejected as overkill for this scope

---

## 7. Chat Interface Design

### Decision: LLM Chat-Style Interface with Message List and Input

**Rationale**:
- Familiar pattern from ChatGPT, Claude, etc.
- Users immediately understand the interaction model
- Easy to implement as placeholder
- Ready for future LLM integration

**Chat UI Components**:
```
+----------------------------------+
| Chat Header                      |
| "Access Assistant (Coming Soon)" |
+----------------------------------+
| Message List (scrollable)        |
| +------------------------------+ |
| | User: [message bubble]       | |
| +------------------------------+ |
| | Bot: [message bubble]        | |
| +------------------------------+ |
| [Empty state: Placeholder text]  |
+----------------------------------+
| Input Area                       |
| [Text input] [Send button]       |
+----------------------------------+
```

**Placeholder Messaging**:
- Empty state: "The AI Access Assistant is coming soon! This feature will help you request and understand your access permissions."
- Input disabled with tooltip: "Chat feature coming in next release"
- Visual indicator (badge, banner) showing "Coming Soon" or "Beta"

**Message Display**:
- User messages: Right-aligned, colored background
- Bot messages: Left-aligned, different background
- Timestamp for each message (hidden for placeholder)
- Avatar icons (user icon, bot icon)

**Responsive Layout**:
- **Desktop**: Fixed height container (e.g., 400-600px), scrollable message list, input at bottom
- **Mobile**: Full-width, collapsible (starts collapsed), overlay when expanded, or separate bottom-nav tab

**Component Structure**:
```
<ChatInterface>
  <ChatHeader />
  <ChatMessageList>
    {messages.map(msg => <ChatMessage key={msg.id} {...msg} />)}
    <ChatEmptyState />  {/* Shown when placeholder */}
  </ChatMessageList>
  <ChatInput disabled={true} />  {/* Disabled for placeholder */}
</ChatInterface>
```

**Placeholder Implementation**:
- Render UI structure
- Show informational message in empty state
- Disable input with visual feedback
- Optional: Show example interaction (fake messages demonstrating future capability)

**Alternatives Considered**:
- Simple "Coming Soon" text: Rejected because building the UI now makes future integration easier
- Different chat pattern (Slack-style, email-style): Rejected because LLM chat is most familiar
- Hide chat entirely: Rejected because spec requires it to be visible on main page

---

## Technology Stack Summary

### Frontend Stack
- **Framework**: Next.js 14.1+ (App Router, TypeScript)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS 3.4+
- **Components**: shadcn/ui (Radix UI + Tailwind)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Native fetch API (with API route proxy)
- **State Management**: React Context + React hooks
- **Testing**: Jest + React Testing Library + Playwright

### Development Tools
- **Package Manager**: npm (default with Node.js)
- **TypeScript**: 5.3+
- **Linting**: ESLint (Next.js default config)
- **Formatting**: Prettier (recommended)

### Infrastructure
- **Container Runtime**: Docker 20+
- **Orchestration**: Docker Compose 2.0+
- **Node Version**: 20 LTS (Alpine for production)
- **Backend**: FastAPI (existing, Python 3.11+)

---

## Resolved Clarifications

All "NEEDS CLARIFICATION" items from the Technical Context have been resolved:

1. ✅ **Language/Version**: TypeScript 5.3+, Next.js 14.1+
2. ✅ **Primary Dependencies**: Next.js, React, Tailwind CSS, shadcn/ui, React Hook Form, Zod
3. ✅ **Storage**: Cookie-based sessions (HTTP-only cookies)
4. ✅ **Testing**: Jest, React Testing Library, Playwright
5. ✅ **Target Platform**: Modern browsers, responsive design
6. ✅ **Performance Goals**: Web Vitals targets defined
7. ✅ **Constraints**: Single-page approach, chat on main page, API routes proxy
8. ✅ **Scale/Scope**: POC with < 1000 users, < 50 accesses, < 100 users

---

## Next Steps

✅ Phase 0 Complete - All research decisions made and documented
⏭️ Proceed to Phase 1: Design & Contracts
- Create data-model.md (frontend state models)
- Create contracts/ (API routes, types, backend integration)
- Create quickstart.md (setup and development guide)
- Update agent context (AGENTS.md)

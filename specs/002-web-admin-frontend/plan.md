# Implementation Plan: Web Admin Frontend

**Branch**: `002-web-admin-frontend` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-web-admin-frontend/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds a web-based frontend interface to the existing Access Management API, enabling users to view their accesses and administrators to manage the entire access system. The frontend will be built with Next.js 14+ (App Router), TypeScript, Tailwind CSS, and shadcn/ui components. The application will be fully responsive (mobile and desktop), use a single-page approach with minimal navigation, and integrate with the backend via Next.js API routes. A Docker Compose setup will orchestrate both frontend and backend services for easy development and deployment.

## Technical Context

**Language/Version**: TypeScript 5.3+, Next.js 14+ (App Router)
**Primary Dependencies**: 
- Next.js 14+ with App Router
- React 18+
- TypeScript 5.3+
- Tailwind CSS 3+
- shadcn/ui components
- Axios or fetch for API communication
- React Hook Form for form management
- Zod for validation

**Storage**: HTTP-only cookies for session management (server-side session handling via Next.js API routes for XSS protection)
**Testing**: Jest + React Testing Library for unit/component tests, Playwright for E2E tests
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions), responsive design for tablets (768px+) and desktop (up to 1920px+)
**Project Type**: Web application (frontend + existing backend)
**Performance Goals**: 
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Largest Contentful Paint (LCP) < 2.5s
- API response handling < 200ms

**Constraints**: 
- Single-page application with minimal separate pages
- Chat interface must be visible on main page (desktop and mobile)
- Must integrate with existing FastAPI backend without modifications
- Docker Compose must orchestrate both services
- Simplified authentication (user ID only, "admin" for admin access)

**Scale/Scope**: 
- Small to medium user base (< 1000 concurrent users for POC)
- < 50 access types initially
- < 100 users initially
- Chat is placeholder only (no actual LLM integration yet)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Status: DEFERRED FOR POC

**Constitution Status**: The project constitution file is currently a template placeholder. This implementation proceeds without formal constitution constraints. Best practices are recommended but not strictly mandated for this proof-of-concept phase.

**Rationale**: Once the project constitution is established with specific principles, this implementation plan will be reviewed and updated to ensure compliance. For now, we follow industry-standard best practices for Next.js, TypeScript, React, and security patterns.

**Action Items**:
- [ ] Define project constitution principles
- [ ] Re-evaluate this implementation plan against established constitution
- [ ] Document any justified violations in Complexity Tracking section

## Project Structure

### Documentation (this feature)

```text
specs/002-web-admin-frontend/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Technology decisions and best practices
├── data-model.md        # Phase 1 output - Frontend state and data models
├── quickstart.md        # Phase 1 output - Setup and development guide
├── contracts/           # Phase 1 output - API contracts and type definitions
│   ├── api-routes.md    # Next.js API routes specifications
│   ├── backend-api.md   # Backend API integration contracts
│   └── types.ts         # TypeScript type definitions
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
# Frontend Application
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main page (user dashboard + chat)
│   │   ├── login/              
│   │   │   └── page.tsx        # Login page
│   │   ├── admin/              
│   │   │   ├── layout.tsx      # Admin layout
│   │   │   └── page.tsx        # Admin dashboard
│   │   └── api/                # Next.js API routes (backend proxy)
│   │       ├── auth/           # Authentication endpoints
│   │       ├── accesses/       # Access management endpoints
│   │       └── users/          # User management endpoints
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── auth/               # Authentication components
│   │   ├── user/               # User dashboard components
│   │   ├── admin/              # Admin panel components
│   │   └── chat/               # Chat placeholder component
│   ├── lib/                    # Utility libraries
│   │   ├── api-client.ts       # API communication layer
│   │   ├── auth.ts             # Authentication utilities
│   │   └── utils.ts            # General utilities
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.ts              # API response types
│   │   ├── user.ts             # User types
│   │   └── access.ts           # Access types
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   └── useApi.ts           # API communication hook
│   └── styles/                 # Global styles
│       └── globals.css         # Tailwind base styles
├── public/                     # Static assets
├── tests/                      # Test files
│   ├── components/             # Component tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── .env.local                  # Local environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── Dockerfile                  # Frontend Docker configuration

# Backend Application (existing)
src/                            # Python backend (unchanged)
├── api/
├── models/
├── services/
└── database/

# Docker Configuration
docker-compose.yml              # Orchestrates frontend + backend
frontend/Dockerfile             # Frontend container
Dockerfile                      # Backend container (existing)
```

**Structure Decision**: Web application structure (Option 2) with separate frontend/ directory. This maintains clear separation between the existing Python backend and the new Next.js frontend while keeping everything in the same repository. The frontend uses Next.js App Router structure with API routes serving as a proxy/adapter layer to the backend API.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*Not applicable - Constitution not yet defined. Once established, any violations will be documented here.*

## Phase 0: Research

*Output: research.md*

**Research Tasks**:

1. **Next.js 14 App Router Best Practices**
   - Server Components vs Client Components usage patterns
   - API Routes as backend proxy layer
   - Middleware for authentication
   - Environment variable handling
   - Build optimization strategies

2. **shadcn/ui Integration**
   - Component installation and customization
   - Theming with Tailwind CSS
   - Form components with React Hook Form
   - Data display components (tables, lists)
   - Mobile responsive patterns

3. **Authentication Strategy**
   - Session management in Next.js (cookies vs localStorage)
   - API route middleware for auth headers
   - Protected routes implementation
   - Admin vs user role handling
   - Security considerations for simplified auth

4. **Backend Integration Patterns**
   - CORS configuration between Next.js and FastAPI
   - API route proxy pattern for backend calls
   - Error handling and response mapping
   - Type safety with TypeScript for API responses
   - Development proxy configuration

5. **Docker Compose Multi-Service Setup**
   - Frontend container with Node.js
   - Backend container with Python (existing)
   - Network configuration between services
   - Volume mounting for development
   - Environment variable passing
   - Health checks and service dependencies

6. **Single-Page Layout Strategy**
   - Layout composition with App Router
   - Mobile navigation patterns (bottom nav, hamburger menu)
   - Desktop sidebar/header patterns
   - Chat interface positioning (main page, mobile vs desktop)
   - State management without complex routing

7. **Chat Interface Design**
   - Typical LLM chat UI patterns
   - Message display components
   - Input area design
   - Placeholder messaging for future features
   - Responsive chat layout (mobile collapse/expand)

## Phase 1: Design & Contracts

*Output: data-model.md, contracts/, quickstart.md*

**Design Tasks**:

1. **Frontend State Models** (data-model.md)
   - User session state (authentication, role, user data)
   - Access list state (user accesses, all accesses for admin)
   - Form state (user creation, access creation)
   - UI state (loading, errors, modals, mobile menu)
   - Chat placeholder state

2. **API Contracts** (contracts/)
   - Next.js API routes specifications
     - `/api/auth/login` - User/admin authentication
     - `/api/auth/logout` - Session termination
     - `/api/accesses/user` - Get user accesses
     - `/api/accesses/all` - Get all accesses (admin)
     - `/api/users/create` - Create user (admin)
     - `/api/accesses/create` - Create access (admin)
   
   - Backend API integration contracts
     - Map existing FastAPI endpoints to Next.js API routes
     - Request/response type definitions
     - Error handling specifications
     - Authentication header handling (X-Username, admin secret)
   
   - TypeScript type definitions (types.ts)
     - User types
     - Access types
     - API response types
     - Form input types

3. **Component Architecture**
   - Layout components (root, admin)
   - Page components (login, main, admin dashboard)
   - Feature components (AccessList, UserForm, AccessForm, Chat)
   - UI components (shadcn/ui components)
   - Hook interfaces

4. **Development Quickstart** (quickstart.md)
   - Prerequisites (Node.js, Docker, etc.)
   - Initial setup commands
   - Docker Compose usage
   - Development workflow
   - Testing commands
   - Environment configuration

**Update Agent Context**:
- Run `.specify/scripts/bash/update-agent-context.sh opencode`
- Add technologies: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- Add commands: npm install, npm run dev, npm run build, docker compose up
- Preserve manual additions

## Phase 2: Implementation Tasks

*NOT part of /speckit.plan - handled by /speckit.tasks command*

This phase will break down the implementation into concrete tasks:
- Environment setup
- Docker configuration
- Component implementation
- API routes implementation
- Testing
- Documentation

---

**Next Steps**:
1. ✅ Review this plan
2. ⏭️ Execute Phase 0 research (starting now)
3. ⏭️ Execute Phase 1 design & contracts (after research)
4. ⏭️ Run `/speckit.tasks` to generate implementation tasks (Phase 2)

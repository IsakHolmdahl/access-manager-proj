# Tasks: Web Admin Frontend

**Input**: Design documents from `/specs/002-web-admin-frontend/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Test Strategy**: Automated testing (Jest + React Testing Library + Playwright) tooling is specified in plan.md and will be configured during Phase 1 setup. However, test implementation tasks are deferred post-MVP to prioritize functional delivery. Manual testing will validate user stories independently at each phase checkpoint. Automated test tasks can be added in a future iteration if TDD/test coverage is required.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- **Backend**: `src/` (existing, minimal changes)
- **Docker**: Root level configuration files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for Next.js frontend

- [X] T001 Create frontend/ directory structure per implementation plan
- [X] T002 Initialize Next.js 14 project with TypeScript in frontend/
- [X] T003 [P] Install core dependencies: React 18+, TypeScript 5.3+, Tailwind CSS 3+, Zod, React Hook Form in frontend/package.json
- [X] T004 [P] Initialize shadcn/ui and install required components (button, input, label, form, card, table, dialog, dropdown-menu, sonner, alert, separator, badge, avatar, sheet) in frontend/
- [X] T005 [P] Configure Tailwind CSS with shadcn/ui theme in frontend/tailwind.config.ts
- [X] T006 [P] Configure TypeScript compiler options in frontend/tsconfig.json
- [X] T007 [P] Configure Next.js for standalone output and environment variables in frontend/next.config.js
- [X] T008 [P] Create .env.local template with BACKEND_URL, ADMIN_SECRET_KEY, SESSION_SECRET in frontend/.env.local
- [X] T009 [P] Create global styles and Tailwind base in frontend/src/styles/globals.css
- [X] T010 Create frontend Dockerfile with multi-stage build (deps, builder, runner) in frontend/Dockerfile
- [X] T011 Update docker-compose.yml to include frontend service with depends_on backend
- [X] T012 [P] Update backend CORS configuration to allow frontend origin (localhost:3000, frontend:3000) in src/api/main.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T013 [P] Create TypeScript type definitions from contracts/types.ts in frontend/src/types/index.ts
- [ ] T014 [P] Create API error types and constants in frontend/src/types/api.ts
- [ ] T015 [P] Create User and Access type definitions in frontend/src/types/user.ts and frontend/src/types/access.ts
- [ ] T016 Create authentication utility functions (cookie encryption, session validation) in frontend/src/lib/auth.ts
- [ ] T017 [P] Create API client utility with fetch wrapper and error handling in frontend/src/lib/api-client.ts
- [ ] T018 [P] Create general utility functions (cn, date formatting, validation helpers) in frontend/src/lib/utils.ts
- [ ] T019 Create root layout with HTML structure and metadata in frontend/src/app/layout.tsx
- [ ] T020 Create AuthContext provider for session management in frontend/src/contexts/AuthContext.tsx
- [ ] T021 Create useAuth custom hook in frontend/src/hooks/useAuth.ts
- [ ] T022 [P] Create useApi custom hook for API calls in frontend/src/hooks/useApi.ts
- [ ] T023 Create Next.js middleware for route protection and auth validation in frontend/src/middleware.ts
- [ ] T024 Create health check API route in frontend/src/app/api/health/route.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Views Personal Accesses (Priority: P1) 🎯 MVP

**Goal**: Enable regular users to log in with their user ID and view their currently assigned accesses

**Independent Test**: Create a test user with pre-assigned accesses, log in with their user ID, and verify their access list is displayed correctly

**Acceptance Criteria**:
1. User can enter valid user ID on login page and be authenticated
2. User is redirected to dashboard showing their accesses
3. User with 5 accesses sees all 5 listed with details
4. User with no accesses sees empty state message
5. Invalid user ID shows error message

### Authentication Implementation for US1

- [ ] T025 [P] [US1] Create Zod schema for login form validation in frontend/src/lib/validations/auth.ts
- [ ] T026 [P] [US1] Create POST /api/auth/login route with user authentication and cookie setting in frontend/src/app/api/auth/login/route.ts
- [ ] T027 [P] [US1] Create POST /api/auth/logout route for session termination in frontend/src/app/api/auth/logout/route.ts
- [ ] T028 [P] [US1] Create GET /api/auth/session route for session validation in frontend/src/app/api/auth/session/route.ts

### UI Components for US1

- [ ] T029 [P] [US1] Create login page component with form and error handling in frontend/src/app/login/page.tsx
- [ ] T030 [P] [US1] Create LoginForm component using React Hook Form and shadcn/ui in frontend/src/components/auth/LoginForm.tsx
- [ ] T031 [P] [US1] Create LoadingSpinner component in frontend/src/components/ui/LoadingSpinner.tsx
- [ ] T032 [P] [US1] Create ErrorMessage component in frontend/src/components/ui/ErrorMessage.tsx

### User Dashboard Implementation for US1

- [ ] T033 [US1] Create GET /api/accesses/user route to fetch user's accesses in frontend/src/app/api/accesses/user/route.ts (depends on T026)
- [ ] T034 [P] [US1] Create main user dashboard page in frontend/src/app/page.tsx
- [ ] T035 [P] [US1] Create AccessList component for displaying access cards in frontend/src/components/user/AccessList.tsx
- [ ] T036 [P] [US1] Create AccessCard component with access details in frontend/src/components/user/AccessCard.tsx
- [ ] T037 [P] [US1] Create EmptyState component for no accesses in frontend/src/components/ui/EmptyState.tsx
- [ ] T038 [US1] Integrate AuthContext with login/dashboard flow and add logout functionality (depends on T034)

**Checkpoint**: User Story 1 complete - Users can log in and view their accesses

---

## Phase 4: User Story 2 - User Accesses LLM Chat Placeholder (Priority: P2)

**Goal**: Provide users with a placeholder for the future LLM chat feature

**Independent Test**: Log in as a regular user, navigate to the chat interface, and verify a placeholder message is displayed

**Acceptance Criteria**:
1. Chat section shows "coming soon" placeholder message
2. Chat interface shows clean, simple layout
3. Chat is visible on main page (desktop and mobile)
4. Input is disabled with appropriate visual feedback

### Chat Placeholder Implementation for US2

- [ ] T039 [P] [US2] Create ChatInterface component with placeholder state in frontend/src/components/chat/ChatInterface.tsx
- [ ] T040 [P] [US2] Create ChatMessage component for message display in frontend/src/components/chat/ChatMessage.tsx
- [ ] T041 [P] [US2] Create ChatInput component (disabled for placeholder) in frontend/src/components/chat/ChatInput.tsx
- [ ] T042 [P] [US2] Create ChatEmptyState component with "coming soon" message in frontend/src/components/chat/ChatEmptyState.tsx
- [ ] T043 [US2] Integrate ChatInterface into main user dashboard page (frontend/src/app/page.tsx)
- [ ] T044 [P] [US2] Add responsive layout for chat (collapsible on mobile, always visible on desktop) in frontend/src/app/page.tsx

**Checkpoint**: User Story 2 complete - Chat placeholder is visible and communicates future feature

---

## Phase 5: User Story 3 - Admin Manages All Accesses (Priority: P1)

**Goal**: Enable administrators to log in and view all accesses in the system with user assignments

**Independent Test**: Log in with "admin", verify admin dashboard shows all accesses, confirm each access displays assigned users

**Acceptance Criteria**:
1. Admin can log in with "admin" credential
2. Admin is redirected to admin dashboard
3. Admin dashboard shows all accesses in system
4. Each access shows which users have it assigned
5. Accesses without users show appropriate indication

### Admin Authentication Enhancement for US3

- [ ] T045 [US3] Enhance POST /api/auth/login route to handle admin authentication with secret key in frontend/src/app/api/auth/login/route.ts (depends on T026)
- [ ] T046 [P] [US3] Update middleware to check admin role for /admin/* routes in frontend/src/middleware.ts

### Admin API Routes for US3

- [ ] T047 [P] [US3] Create GET /api/admin/accesses route to fetch all accesses with user counts in frontend/src/app/api/admin/accesses/route.ts
- [ ] T048 [P] [US3] Create backend API client methods for admin operations in frontend/src/lib/api-client.ts

### Admin UI Implementation for US3

- [ ] T049 [P] [US3] Create admin layout with navigation and role check in frontend/src/app/admin/layout.tsx
- [ ] T050 [US3] Create admin dashboard page in frontend/src/app/admin/page.tsx (depends on T047)
- [ ] T051 [P] [US3] Create AdminAccessList component for all accesses in frontend/src/components/admin/AdminAccessList.tsx
- [ ] T052 [P] [US3] Create AdminAccessCard component with user count and details in frontend/src/components/admin/AdminAccessCard.tsx
- [ ] T053 [P] [US3] Create AccessDetailModal component showing assigned users in frontend/src/components/admin/AccessDetailModal.tsx
- [ ] T054 [US3] Integrate admin dashboard with access management state (depends on T050)

**Checkpoint**: User Story 3 complete - Admins can view all accesses and their user assignments

---

## Phase 6: User Story 4 - Admin Creates New Users (Priority: P1)

**Goal**: Enable administrators to create new users through a form interface

**Independent Test**: Log in as admin, use user creation interface, verify user appears in system and can log in

**Acceptance Criteria**:
1. Admin can navigate to user creation form
2. Form validates username and password inputs
3. Successful creation shows user in system
4. Duplicate username shows appropriate error
5. New user can immediately log in
6. Regular users cannot access user creation

### Admin User Management API for US4

- [ ] T055 [P] [US4] Create Zod schema for user creation form in frontend/src/lib/validations/user.ts
- [ ] T056 [P] [US4] Create GET /api/admin/users route to fetch all users in frontend/src/app/api/admin/users/route.ts
- [ ] T057 [P] [US4] Create POST /api/admin/users route for user creation in frontend/src/app/api/admin/users/route.ts

### Admin User Management UI for US4

- [ ] T058 [P] [US4] Create UserCreationForm component with React Hook Form in frontend/src/components/admin/UserCreationForm.tsx
- [ ] T059 [P] [US4] Create UserCreationDialog component (modal wrapper) in frontend/src/components/admin/UserCreationDialog.tsx
- [ ] T060 [P] [US4] Create AdminUserList component for displaying all users in frontend/src/components/admin/AdminUserList.tsx
- [ ] T061 [P] [US4] Create UserCard component showing user details in frontend/src/components/admin/UserCard.tsx
- [ ] T062 [US4] Add user creation functionality to admin dashboard in frontend/src/app/admin/page.tsx (depends on T050)
- [ ] T063 [US4] Add user list tab/section to admin dashboard with refresh capability (depends on T056, T062)

**Checkpoint**: User Story 4 complete - Admins can create new users who can immediately log in

---

## Phase 7: User Story 5 - Admin Creates New Accesses (Priority: P2)

**Goal**: Enable administrators to create new access types for the system

**Independent Test**: Log in as admin, create new access type, verify it appears in catalog and can be assigned

**Acceptance Criteria**:
1. Admin can navigate to access creation form
2. Form validates access name (uppercase with underscores)
3. Successful creation shows access in catalog
4. Duplicate access name shows appropriate error
5. New access appears in all accesses list
6. New access can be assigned to users (verification only, assignment out of scope)

### Admin Access Management API for US5

- [ ] T064 [P] [US5] Create Zod schema for access creation form in frontend/src/lib/validations/access.ts
- [ ] T065 [P] [US5] Create POST /api/admin/accesses route for access creation in frontend/src/app/api/admin/accesses/route.ts

### Admin Access Management UI for US5

- [ ] T066 [P] [US5] Create AccessCreationForm component with React Hook Form and name validation in frontend/src/components/admin/AccessCreationForm.tsx
- [ ] T067 [P] [US5] Create AccessCreationDialog component (modal wrapper) in frontend/src/components/admin/AccessCreationDialog.tsx
- [ ] T068 [US5] Add access creation functionality to admin dashboard in frontend/src/app/admin/page.tsx (depends on T050, T054)
- [ ] T069 [US5] Add refresh capability to access list after creation (depends on T051, T068)

**Checkpoint**: User Story 5 complete - Admins can create new access types that appear in the system

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final touches

### Responsive Design & Mobile Optimization

- [ ] T070 [P] Add mobile navigation component with bottom nav for tablets/mobile in frontend/src/components/layout/MobileNav.tsx
- [ ] T071 [P] Add hamburger menu for mobile secondary actions in frontend/src/components/layout/HamburgerMenu.tsx
- [ ] T072 [P] Add responsive breakpoints and layouts across all pages using Tailwind responsive prefixes
- [ ] T073 [P] Add mobile-specific chat collapse/expand functionality in frontend/src/components/chat/ChatInterface.tsx

### Error Handling & Loading States

- [ ] T074 [P] Add loading skeletons for access lists in frontend/src/components/ui/Skeleton.tsx
- [ ] T075 [P] Add toast notifications for success/error messages using shadcn/ui toast in frontend/src/components/ui/Toaster.tsx
- [ ] T076 [P] Add error boundary component for graceful error handling in frontend/src/components/ErrorBoundary.tsx
- [ ] T077 [P] Add retry logic for failed API calls in frontend/src/lib/api-client.ts

### Performance & Optimization

- [ ] T078 [P] Add client-side caching for access lists (5 minute TTL) in frontend/src/hooks/useApi.ts
- [ ] T079 [P] Add debouncing for form inputs in form components
- [ ] T080 [P] Optimize images and add next/image usage in frontend/src/app/page.tsx
- [ ] T081 [P] Add loading indicators for all async operations across components

### Security Hardening

- [ ] T082 [P] Review and validate all input sanitization in API routes
- [ ] T083 [P] Add rate limiting consideration notes to frontend/src/app/api/ routes
- [ ] T084 [P] Verify HTTP-only cookie configuration in frontend/src/lib/auth.ts
- [ ] T085 [P] Add HTTPS configuration notes for production in frontend/next.config.js

### Documentation & Validation

- [ ] T086 [P] Create README.md for frontend/ directory with setup instructions
- [ ] T087 [P] Add inline code comments for complex authentication logic
- [ ] T088 [P] Add JSDoc comments to all exported functions and components
- [ ] T089 [P] Validate Docker Compose setup with both services running
- [ ] T090 Run quickstart.md validation - verify all setup steps work
- [ ] T091 [P] Create deployment notes for production in frontend/README.md

### Accessibility & UX

- [ ] T092 [P] Add ARIA labels to all interactive elements
- [ ] T093 [P] Add keyboard navigation support for forms and dialogs
- [ ] T094 [P] Verify color contrast meets WCAG AA standards
- [ ] T095 [P] Add focus indicators for keyboard navigation

### Edge Case Handling & Robustness

- [ ] T096 [P] Add session expiration handling with automatic redirect to login in frontend/src/middleware.ts
- [ ] T097 [P] Add API retry logic with exponential backoff for transient failures in frontend/src/lib/api-client.ts
- [ ] T098 [P] Add input length validation and truncation for very long user IDs and access names across all forms
- [ ] T099 [P] Add list virtualization or pagination for large datasets (100+ items) in frontend/src/components/admin/AdminAccessList.tsx and frontend/src/components/admin/AdminUserList.tsx
- [ ] T100 [P] Add browser navigation state management (back/forward button handling) after login/logout in frontend/src/app/layout.tsx

### Visual Distinction & Security

- [ ] T101 [P] [FR-012] Add distinct visual styling for admin layout (different header color, admin badge, distinct theme) in frontend/src/app/admin/layout.tsx
- [ ] T102 [P] Add comprehensive RBAC verification test - ensure regular users cannot access admin functions via URL manipulation, API calls, or client-side state modification in frontend/src/middleware.ts and all admin API routes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - **US1 (Phase 3)**: Independent - can start after Foundational
  - **US2 (Phase 4)**: Depends on US1 (needs main page to integrate chat)
  - **US3 (Phase 5)**: Independent - can start after Foundational (admin login enhancement parallels US1)
  - **US4 (Phase 6)**: Depends on US3 (needs admin dashboard)
  - **US5 (Phase 7)**: Depends on US3 (needs admin dashboard)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2)
    ├── US1: User Views Accesses (P1) ──┐
    │   └── US2: Chat Placeholder (P2)  │
    │                                    ├── Polish (Phase 8)
    └── US3: Admin Accesses (P1) ───────┤
        ├── US4: Admin Users (P1)       │
        └── US5: Admin Create Access (P2)┘
```

### Within Each User Story

- API routes before UI components that call them
- Utility functions before components that use them
- Form components before pages that integrate them
- Base components before composite components

### Parallel Opportunities

**Phase 1 (Setup)**: T003, T004, T005, T006, T007, T008, T009, T012 can run in parallel

**Phase 2 (Foundational)**: T013, T014, T015, T017, T018, T022 can run in parallel

**Phase 3 (US1)**: 
- T025, T026, T027, T028 can run in parallel (different API routes)
- T029, T030, T031, T032 can run in parallel (different components)
- T034, T035, T036, T037 can run in parallel after T033

**Phase 4 (US2)**: T039, T040, T041, T042 can run in parallel

**Phase 5 (US3)**: 
- T047, T048 can run in parallel
- T049, T051, T052, T053 can run in parallel

**Phase 6 (US4)**: T055, T056, T057 can run in parallel; T058, T059, T060, T061 can run in parallel

**Phase 7 (US5)**: T064, T065 can run in parallel; T066, T067 can run in parallel

**Phase 8 (Polish)**: Most tasks can run in parallel as they affect different files

---

## Parallel Example: User Story 1 (MVP)

```bash
# After Foundational complete, launch US1 API routes in parallel:
Task T025: "Create Zod schema for login form validation in frontend/src/lib/validations/auth.ts"
Task T026: "Create POST /api/auth/login route in frontend/src/app/api/auth/login/route.ts"
Task T027: "Create POST /api/auth/logout route in frontend/src/app/api/auth/logout/route.ts"
Task T028: "Create GET /api/auth/session route in frontend/src/app/api/auth/session/route.ts"

# Launch US1 UI components in parallel:
Task T029: "Create login page in frontend/src/app/login/page.tsx"
Task T030: "Create LoginForm component in frontend/src/components/auth/LoginForm.tsx"
Task T031: "Create LoadingSpinner component in frontend/src/components/ui/LoadingSpinner.tsx"
Task T032: "Create ErrorMessage component in frontend/src/components/ui/ErrorMessage.tsx"

# After T033 (user accesses route), launch dashboard components in parallel:
Task T035: "Create AccessList component in frontend/src/components/user/AccessList.tsx"
Task T036: "Create AccessCard component in frontend/src/components/user/AccessCard.tsx"
Task T037: "Create EmptyState component in frontend/src/components/ui/EmptyState.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T012)
2. Complete Phase 2: Foundational (T013-T024) - CRITICAL
3. Complete Phase 3: User Story 1 (T025-T038)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Can users log in with their ID?
   - Do they see their accesses?
   - Does empty state work?
   - Do error messages show correctly?
5. Deploy/demo MVP if ready

### Incremental Delivery

1. **Foundation** (Phases 1-2) → Project structure ready, Docker working
2. **MVP** (Phase 3: US1) → Users can log in and view accesses → **DEPLOY/DEMO**
3. **Chat Preview** (Phase 4: US2) → Chat placeholder visible → **DEPLOY/DEMO**
4. **Admin Core** (Phase 5: US3) → Admins can view all accesses → **DEPLOY/DEMO**
5. **User Management** (Phase 6: US4) → Admins can create users → **DEPLOY/DEMO**
6. **Access Management** (Phase 7: US5) → Admins can create accesses → **DEPLOY/DEMO**
7. **Production Ready** (Phase 8: Polish) → All features polished → **PRODUCTION**

### Parallel Team Strategy

With multiple developers after Foundational phase:

- **Developer A**: US1 (User login and access viewing) - P1, MVP critical
- **Developer B**: US3 (Admin access viewing) - P1, runs in parallel with US1
- **Developer C**: Setup/Polish tasks, then US2 (Chat) after US1 complete

Once US3 complete:
- **Developer B**: US4 (Admin user creation) then US5 (Admin access creation)

---

## Task Summary

**Total Tasks**: 102 tasks (updated from 95 to address critical specification issues)

**Tasks by Phase**:
- Phase 1 (Setup): 12 tasks
- Phase 2 (Foundational): 12 tasks
- Phase 3 (US1 - User Accesses): 14 tasks
- Phase 4 (US2 - Chat Placeholder): 6 tasks
- Phase 5 (US3 - Admin Accesses): 10 tasks
- Phase 6 (US4 - Admin Users): 9 tasks
- Phase 7 (US5 - Admin Create Access): 6 tasks
- Phase 8 (Polish): 33 tasks (including edge case handling, visual distinction, and security validation)

**Parallel Opportunities**: 65 tasks marked [P] can run in parallel within their phase (updated from 58)

**Independent Test Criteria**:
- **US1**: User login → view accesses → verify display (MVP)
- **US2**: User login → see chat placeholder → verify message
- **US3**: Admin login → view all accesses → verify user assignments
- **US4**: Admin login → create user → new user can log in
- **US5**: Admin login → create access → verify in catalog

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (US1 only) = 38 tasks for minimum viable product

**Critical Additions** (T096-T102):
- T096: Session expiration handling
- T097: API retry logic with exponential backoff
- T098: Input length validation for edge cases
- T099: List virtualization/pagination for large datasets
- T100: Browser navigation state management
- T101: Visual distinction for admin interface (addresses FR-012)
- T102: RBAC security verification (prevent unauthorized admin access)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story] Description with file path`
- [P] tasks operate on different files with no dependencies - can be parallelized
- [Story] labels (US1-US5) map to user stories in spec.md for traceability
- Each user story phase is independently completable and testable
- Tests not included as not explicitly requested in specification
- Stop at any checkpoint to validate story independently before proceeding
- Docker Compose orchestrates both frontend (port 3000) and backend (port 8090)
- Frontend integrates with existing backend via Next.js API routes (no backend code changes except CORS)

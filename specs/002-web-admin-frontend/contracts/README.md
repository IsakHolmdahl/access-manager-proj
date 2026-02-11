# API Contracts - Web Admin Frontend

**Feature**: 002-web-admin-frontend  
**Date**: 2026-02-09

## Overview

This directory contains all API contract specifications for the Web Admin Frontend feature. These contracts define the interfaces between the frontend, Next.js API routes, and the backend FastAPI service.

## Files

### [api-routes.md](./api-routes.md)
Specifies all Next.js API routes (`/api/*`) that serve as the proxy/adapter layer between the frontend and backend. Includes:
- Authentication routes (`/api/auth/*`)
- User access routes (`/api/accesses/*`)
- Admin routes (`/api/admin/*`)
- Health check route
- Middleware specifications
- Error handling standards

### [backend-api.md](./backend-api.md)
Documents the integration with the existing FastAPI backend service. Includes:
- Backend endpoint mapping
- Authentication header specifications
- Request/response format mapping
- Error translation strategy
- Backend-to-frontend type transformations
- CORS configuration requirements

### [types.ts](./types.ts)
TypeScript type definitions for the entire frontend. Includes:
- Core domain entities (User, Access)
- Authentication & session types
- API response types
- Form input types
- UI state types
- Component prop types
- Hook return types
- Type guards and utilities

## Contract Relationships

```
Frontend Components
        ↓
   useApi Hook
        ↓
Next.js API Routes (api-routes.md)
        ↓
Backend API Client
        ↓
FastAPI Backend (backend-api.md)
```

## Type Safety Flow

1. **Backend Response** → Validated against `BackendUserResponse` etc.
2. **API Route** → Transforms to `User`, `Access` etc.
3. **Frontend Component** → Uses typed interfaces with full IntelliSense

## Usage

### For Frontend Developers

1. **Import types** from `types.ts` into your components:
   ```typescript
   import { User, Access, UserSession } from '@/types';
   ```

2. **Call API routes** as documented in `api-routes.md`:
   ```typescript
   const response = await fetch('/api/accesses/user');
   const data: UserAccessesResponse = await response.json();
   ```

3. **Handle errors** using standard `APIError` format

### For Backend Developers

1. **Review** `backend-api.md` for integration requirements
2. **Ensure** CORS configuration allows frontend origin
3. **Match** response formats as documented
4. **Use** standardized error responses

## Validation

All contracts are validated through:
- **TypeScript compilation** - Type errors caught at compile time
- **Zod schemas** - Runtime validation for API inputs/outputs
- **Integration tests** - Verify contract adherence

## Updates

When updating contracts:
1. Update the relevant `.md` file or `types.ts`
2. Update corresponding implementation
3. Update tests to match new contract
4. Update this README if structure changes
5. Bump version number in contract header

## Version History

- **1.0.0** (2026-02-09) - Initial contract definitions

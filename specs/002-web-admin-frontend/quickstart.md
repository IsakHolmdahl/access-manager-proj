# Quickstart Guide - Web Admin Frontend

**Feature**: 002-web-admin-frontend  
**Date**: 2026-02-09  
**Status**: Implementation Ready

## Overview

This guide provides step-by-step instructions to set up, develop, and test the Web Admin Frontend for the Access Management system.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: 20.x LTS (recommended) or 18.x
  ```bash
  node --version  # Should output v20.x.x
  ```

- **npm**: 10.x+ (comes with Node.js)
  ```bash
  npm --version  # Should output 10.x.x
  ```

- **Docker**: 20.x+ with Docker Compose
  ```bash
  docker --version  # Should output Docker version 20.x.x or higher
  docker compose version  # Should output Docker Compose version v2.x.x
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

---

## Project Structure

```
access-manager-proj/
├── frontend/                  # Frontend application (NEW)
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities
│   │   ├── types/            # TypeScript types
│   │   └── hooks/            # Custom hooks
│   ├── public/               # Static assets
│   ├── tests/                # Test files
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── Dockerfile
├── src/                       # Backend API (EXISTING)
├── docker-compose.yml         # Docker orchestration (UPDATED)
└── README.md
```

---

## Initial Setup

### 1. Clone Repository (if not already done)

```bash
git clone <repository-url>
cd access-manager-proj
git checkout 002-web-admin-frontend
```

### 2. Create Frontend Directory Structure

```bash
mkdir -p frontend
cd frontend
```

### 3. Initialize Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Configuration prompts**:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like to use `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to customize the default import alias? **No** (use @/*)

### 4. Install Additional Dependencies

```bash
npm install zod react-hook-form @hookform/resolvers
npm install -D @types/node @types/react @types/react-dom
```

### 5. Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

**Configuration prompts**:
- Which style would you like to use? **Default**
- Which color would you like to use as base color? **Slate**
- Would you like to use CSS variables for colors? **Yes**

Install required shadcn components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add sheet
```

### 6. Configure Environment Variables

Create `.env.local`:
```bash
cat > .env.local << EOF
# Backend API URL
BACKEND_URL=http://localhost:8090

# Admin secret key (must match backend)
ADMIN_SECRET_KEY=your-secret-admin-key-change-this-in-production

# Session secret for encrypting cookies
SESSION_SECRET=your-session-secret-change-this

# Environment
NODE_ENV=development
EOF
```

---

## Development

### Option 1: Local Development (Frontend Only)

Run frontend in development mode (assumes backend is running separately):

```bash
cd frontend
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### Option 2: Docker Compose (Recommended)

Run both frontend and backend together:

```bash
# From project root
docker compose up --build
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8090
- **API Docs**: http://localhost:8090/docs

To stop:
```bash
docker compose down
```

To rebuild after code changes:
```bash
docker compose up --build
```

### Hot Reload (Docker Development)

The `docker-compose.yml` mounts source code for hot reload:

```yaml
volumes:
  - ./frontend/src:/app/src  # Changes reflect immediately
  - /app/node_modules         # Don't override node_modules
```

---

## Project Configuration Files

### Frontend Dockerfile

Create `frontend/Dockerfile`:

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

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Next.js Configuration

Update `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // For Docker deployment
  
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8090',
  },
  
  // Optional: Strict mode for better development experience
  reactStrictMode: true,
  
  // Optional: Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
```

### Updated Docker Compose

Update root `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: access-management-api
    ports:
      - "8090:8000"
    environment:
      - APP_ENVIRONMENT=${APP_ENVIRONMENT:-development}
      - ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY:-your-secret-admin-key-change-this-in-production}
      - DUCKDB_PATH=${DUCKDB_PATH:-./data/database/access_management.duckdb}
      - PARQUET_PATH=${PARQUET_PATH:-./data/parquet}
      - TEMP_DIRECTORY=${TEMP_DIRECTORY:-./data/temp}
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
    volumes:
      - ./data:/app/data
      - ./src:/app/src:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
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
      - ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY:-your-secret-admin-key-change-this-in-production}
      - SESSION_SECRET=${SESSION_SECRET:-your-session-secret-change-this}
      - NODE_ENV=${NODE_ENV:-production}
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ./frontend/src:/app/src      # Hot reload in development
      - /app/node_modules             # Don't override node_modules
      - /app/.next                    # Don't override build artifacts
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    networks:
      - access-mgmt-network

networks:
  access-mgmt-network:
    driver: bridge
```

### Backend CORS Configuration

Update `src/api/main.py` to allow frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local frontend dev
        "http://frontend:3000",       # Docker frontend container
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing

### Unit Tests (Jest + React Testing Library)

```bash
cd frontend
npm test
```

### E2E Tests (Playwright)

Install Playwright:
```bash
npm install -D @playwright/test
npx playwright install
```

Run E2E tests:
```bash
npm run test:e2e
```

### Run All Tests

```bash
npm run test:all
```

---

## Linting and Formatting

### ESLint

```bash
npm run lint
```

### Prettier (if installed)

```bash
npm run format
```

---

## Building for Production

### Local Build

```bash
cd frontend
npm run build
npm start  # Run production server locally
```

### Docker Build

```bash
docker compose build
```

---

## Troubleshooting

### Frontend won't start

1. **Check Node version**: Must be 18.x or 20.x
   ```bash
   node --version
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Backend connection issues

1. **Check backend is running**:
   ```bash
   curl http://localhost:8090/health
   ```

2. **Check BACKEND_URL in .env.local**:
   ```bash
   cat .env.local | grep BACKEND_URL
   ```

3. **Check Docker network** (if using Docker):
   ```bash
   docker network inspect access-mgmt-network
   ```

### CORS errors

1. **Verify backend CORS configuration** allows frontend origin
2. **Check credentials flag** in fetch requests (`credentials: 'include'`)
3. **Restart both services** after CORS config changes

### Docker Compose issues

1. **Check Docker is running**:
   ```bash
   docker ps
   ```

2. **View service logs**:
   ```bash
   docker compose logs frontend
   docker compose logs backend
   ```

3. **Rebuild containers**:
   ```bash
   docker compose down
   docker compose up --build
   ```

4. **Check disk space** (Docker images can be large):
   ```bash
   docker system df
   ```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (local) |
| `npm run build` | Build for production (local) |
| `npm start` | Run production build (local) |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Lint code |
| `docker compose up` | Start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f` | View logs (follow) |
| `docker compose restart frontend` | Restart frontend only |

---

## Default Credentials

### Test User
- **User ID**: `testuser` (or any user created by admin)
- **Access**: View personal accesses only

### Admin
- **User ID**: `admin`
- **Access**: Full system administration

---

## Next Steps

1. ✅ Setup complete
2. 🔨 Implement components (see `tasks.md` when generated)
3. 🧪 Write tests
4. 📚 Update documentation

---

## Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **shadcn/ui Components**: https://ui.shadcn.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

---

## Support

For issues or questions:
1. Check this quickstart guide
2. Review the specification: `specs/002-web-admin-frontend/spec.md`
3. Review the implementation plan: `specs/002-web-admin-frontend/plan.md`
4. Check backend API docs: http://localhost:8090/docs (when running)

# Access Management System

A web-based system for managing user accesses with an admin dashboard.

## Quick Start

### Build and Start

```bash
docker compose up -d --build
```

Wait 10 seconds for services to initialize, then open http://localhost:3000

### Login

**Regular User:**
- Go to http://localhost:3000/login
- Enter any username: `admin`, `alice`, `isak`, `testuser2`, or `Patrik`
- No password required (POC mode)

**Admin Dashboard:**
- Login with username: `admin`
- Access http://localhost:3000/admin
- View and manage all accesses and users

### Ports

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8090

### Stop

```bash
docker compose down
```

## Features

- View your assigned accesses
- **Admin only:** Create/manage accesses and users
- **Admin only:** Assign/remove accesses from users

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Python 3.11 + FastAPI + DuckDB
- **Deployment:** Docker Compose

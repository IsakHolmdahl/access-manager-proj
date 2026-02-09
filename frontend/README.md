# Access Management Web Frontend

Next.js 14 web application for managing user access permissions with an admin dashboard.

## Features

### User Features
- **Authentication**: Login with username
- **View Accesses**: See all assigned access permissions
- **Chat Placeholder**: Preview of upcoming AI assistant feature
- **Responsive Design**: Mobile and desktop optimized

### Admin Features
- **Access Management**: View all system accesses with user assignment counts
- **User Management**: Create and view all users
- **Access Creation**: Define new access types
- **Distinct UI**: Purple/indigo gradient theme for admin sections

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev
# Open http://localhost:3000
\`\`\`

## Environment Variables

\`\`\`env
BACKEND_URL=http://localhost:8090
ADMIN_SECRET_KEY=password123
SESSION_SECRET=your-session-secret
NODE_ENV=development
\`\`\`

## Tech Stack

- Next.js 14 (App Router), TypeScript 5.3+
- Tailwind CSS 3+, shadcn/ui
- React Hook Form + Zod
- HTTP-only encrypted session cookies

## Project Structure

\`\`\`
frontend/src/
├── app/              # Pages (user dashboard, admin dashboard, login)
├── components/       # UI components (admin, user, chat, ui)
├── lib/              # Utilities (auth, api-client, validations)
├── hooks/            # Custom hooks (useAuth, useApi)
├── contexts/         # React contexts (AuthContext)
└── types/            # TypeScript definitions
\`\`\`

## Available Routes

- \`/\` - User dashboard (protected)
- \`/login\` - Login page
- \`/admin\` - Admin dashboard (admin only)

## Docker

\`\`\`bash
docker compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8090
\`\`\`

## Testing

**Test Users:**
- admin (all accesses)
- isak, alice (regular users)

**User Flow:** Login → View accesses → Logout
**Admin Flow:** Login as admin → View/create accesses → View/create users

See full documentation in specs/002-web-admin-frontend/

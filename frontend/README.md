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

---

## Production Deployment (T091)

### Prerequisites

- HTTPS certificate (Let's Encrypt recommended)
- Reverse proxy (nginx, Traefik, or Cloudflare)
- Docker + Docker Compose
- Domain name configured

### Security Checklist

- [ ] Change `ADMIN_SECRET_KEY` from default
- [ ] Generate strong `SESSION_SECRET` (min 32 bytes random)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS-only cookies (`secure: true` enforced in production)
- [ ] Configure HTTPS reverse proxy with security headers
- [ ] Implement rate limiting at proxy level
- [ ] Set up log monitoring and alerting
- [ ] Enable firewall rules (allow only 80, 443)
- [ ] Use secrets management (Docker secrets, Vault, etc.)
- [ ] Disable debug/development features

### Step 1: Prepare Environment

```bash
# Production environment variables
cat > .env.production <<EOF
BACKEND_URL=https://api.yourdomain.com
ADMIN_SECRET_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -base64 48)
NODE_ENV=production
EOF
```

### Step 2: nginx Reverse Proxy Configuration

```nginx
# /etc/nginx/sites-available/access-manager

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting (T083)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
    
    # API Routes - Stricter rate limit
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Auth Routes - Strictest rate limit
    location /api/auth/ {
        limit_req zone=auth_limit burst=10 nodelay;
        limit_req_status 429;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/access-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Docker Production Deployment

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: access-management-api-prod
    restart: unless-stopped
    ports:
      - "127.0.0.1:8090:8000"
    environment:
      - ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY}
      - DATABASE_PATH=/data/database/access_management.duckdb
    volumes:
      - ./data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
      target: runner
    container_name: access-management-frontend-prod
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - NODE_ENV=production
      - BACKEND_URL=http://backend:8000
      - ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    security_opt:
      - no-new-privileges:true
```

Deploy:
```bash
# Load production environment
source .env.production

# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 4: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (cron job)
sudo certbot renew --dry-run
```

### Step 5: Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Step 6: Monitoring & Logging

**Log Locations:**
- nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- Docker: `docker compose logs`
- Application: Container stdout/stderr

**Recommended monitoring:**
- Uptime monitoring: UptimeRobot, Pingdom
- Log aggregation: ELK Stack, Grafana Loki
- Error tracking: Sentry
- Metrics: Prometheus + Grafana

**Health checks:**
```bash
# Frontend health
curl https://yourdomain.com/api/health

# Backend health (internal)
curl http://localhost:8090/health
```

### Step 7: Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/access-manager
mkdir -p $BACKUP_DIR

# Backup database
cp ./data/database/access_management.duckdb $BACKUP_DIR/db_$DATE.duckdb

# Backup environment (encrypted)
gpg --encrypt --recipient admin@yourdomain.com .env.production > $BACKUP_DIR/env_$DATE.gpg

# Keep last 30 days
find $BACKUP_DIR -name "db_*.duckdb" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

### Production Checklist

**Before going live:**
- [ ] All environment variables set correctly
- [ ] HTTPS configured and tested
- [ ] Rate limiting enabled and tested
- [ ] Security headers present (check with securityheaders.com)
- [ ] Firewall rules active
- [ ] Log monitoring configured
- [ ] Backup script tested and scheduled
- [ ] Health checks passing
- [ ] Test admin and user login flows
- [ ] Test CRUD operations (create user, create access)
- [ ] Verify session expiration works
- [ ] Check mobile responsiveness
- [ ] Test error handling (500, 404, etc.)
- [ ] Performance test with expected load
- [ ] Document rollback procedure

**Post-deployment:**
- Monitor error rates
- Check response times
- Verify SSL certificate renewal
- Review access logs for anomalies
- Test disaster recovery procedure

### Troubleshooting

**Issue: 502 Bad Gateway**
```bash
# Check if services are running
docker compose ps

# Check backend health
curl http://localhost:8090/health

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

**Issue: Session not persisting**
- Verify `SESSION_SECRET` is set
- Check HTTPS is enabled (cookies require secure connection in prod)
- Verify nginx forwards `X-Forwarded-Proto` header

**Issue: Rate limiting too aggressive**
- Adjust `rate=` values in nginx config
- Check `limit_req_zone` settings
- Monitor `/var/log/nginx/error.log` for 429 responses

### Scaling Considerations

**Horizontal Scaling:**
- Use external session store (Redis) instead of in-memory
- Load balancer in front of multiple frontend containers
- Shared database volume or external database

**Performance Optimization:**
- Enable Next.js cache
- Add CDN for static assets (Cloudflare, CloudFront)
- Implement database connection pooling
- Add Redis cache layer

---

## Development

See [specs/002-web-admin-frontend/quickstart.md](../specs/002-web-admin-frontend/quickstart.md) for detailed development guide.

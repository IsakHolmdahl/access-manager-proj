import type { NextConfig } from "next";

/**
 * Next.js Configuration
 * 
 * T085 - Production HTTPS Configuration:
 * =====================================
 * 
 * CRITICAL SECURITY REQUIREMENTS FOR PRODUCTION:
 * 
 * 1. HTTPS Enforcement:
 *    - Deploy behind HTTPS-only reverse proxy (nginx, Cloudflare, etc.)
 *    - Set secure: true for all cookies (see lib/auth.ts)
 *    - Enable HSTS (HTTP Strict Transport Security) headers
 *    - Redirect all HTTP traffic to HTTPS
 * 
 * 2. Environment Variables for Production:
 *    - BACKEND_URL: Must use https:// protocol
 *    - SESSION_SECRET: Use strong random key (min 32 bytes)
 *    - ADMIN_SECRET_KEY: Change from default
 *    - NODE_ENV=production
 * 
 * 3. Recommended nginx configuration:
 *    ```nginx
 *    server {
 *      listen 443 ssl http2;
 *      server_name yourdomain.com;
 *      
 *      ssl_certificate /path/to/cert.pem;
 *      ssl_certificate_key /path/to/key.pem;
 *      
 *      # Security headers
 *      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
 *      add_header X-Frame-Options "SAMEORIGIN" always;
 *      add_header X-Content-Type-Options "nosniff" always;
 *      add_header X-XSS-Protection "1; mode=block" always;
 *      
 *      # T083 - Rate limiting (nginx example)
 *      limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
 *      limit_req zone=api_limit burst=20 nodelay;
 *      
 *      location / {
 *        proxy_pass http://localhost:3000;
 *        proxy_set_header Host $host;
 *        proxy_set_header X-Real-IP $remote_addr;
 *        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *        proxy_set_header X-Forwarded-Proto $scheme;
 *      }
 *    }
 *    ```
 * 
 * 4. Docker Production Deployment:
 *    - Use multi-stage build (see Dockerfile)
 *    - Run as non-root user
 *    - Mount secrets as files, not environment variables
 *    - Use docker-compose.prod.yml with production settings
 * 
 * T083 - Rate Limiting Considerations:
 * ===================================
 * 
 * Server-side rate limiting should be implemented at multiple layers:
 * 
 * 1. Reverse Proxy Level (nginx/Cloudflare):
 *    - Protect against DDoS
 *    - Limit: 10 req/s per IP for API routes
 *    - Limit: 5 req/s for auth endpoints
 * 
 * 2. API Gateway Level:
 *    - Per-user rate limits (after authentication)
 *    - Admin: 100 req/min
 *    - Regular users: 60 req/min
 * 
 * 3. Application Level (FastAPI):
 *    - Implement slowapi or similar middleware
 *    - Return 429 Too Many Requests with Retry-After header
 * 
 * Client handles 429 with exponential backoff (see lib/api-client.ts)
 */

const nextConfig: NextConfig = {
  output: 'standalone',  // For Docker deployment
  
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8090',
  },
  
  // Strict mode for better development experience
  reactStrictMode: true,
  
  // Remove console logs in production (T085)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // T085 - Security headers (Next.js built-in)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

export default nextConfig;

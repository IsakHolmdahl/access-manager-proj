/**
 * Next.js Middleware
 * 
 * Handles route protection, authentication validation, and session expiration
 * 
 * Security Features:
 * - Session expiration checking
 * - Role-based access control (RBAC)
 * - Automatic expired session cleanup
 * - Protected route enforcement
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/health'];

/**
 * Admin-only routes (RBAC enforcement)
 */
const ADMIN_ROUTES = ['/admin'];

/**
 * Admin API routes that require admin role
 */
const ADMIN_API_ROUTES = ['/api/admin'];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if route requires admin access
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if API route requires admin access
 */
function isAdminApiRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Session validation result
 */
interface SessionValidation {
  isValid: boolean;
  role: string | null;
  isExpired: boolean;
}

/**
 * Get user role from session cookie with comprehensive validation
 * 
 * @param request - Next.js request object
 * @returns SessionValidation object with role and expiration status
 */
function validateSession(request: NextRequest): SessionValidation {
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    return { isValid: false, role: null, isExpired: false };
  }
  
  try {
    // Decode base64 session (POC implementation - use proper encryption in production)
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );
    
    // Validate session structure
    if (!sessionData || typeof sessionData !== 'object') {
      return { isValid: false, role: null, isExpired: false };
    }
    
    if (!sessionData.role || !sessionData.expiresAt) {
      return { isValid: false, role: null, isExpired: false };
    }
    
    // Check if session expired (T096 - Session expiration handling)
    const now = Date.now();
    if (now > sessionData.expiresAt) {
      return { isValid: false, role: null, isExpired: true };
    }
    
    return { isValid: true, role: sessionData.role, isExpired: false };
  } catch (error) {
    // Invalid session data
    return { isValid: false, role: null, isExpired: false };
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Allow static files and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Validate session (T096 - Session expiration handling)
  const sessionValidation = validateSession(request);
  
  // Handle expired session - clear cookie and redirect to login
  if (sessionValidation.isExpired) {
    const response = NextResponse.redirect(new URL('/login?expired=true', request.url));
    
    // Clear expired session cookie
    response.cookies.delete('session');
    
    return response;
  }
  
  // Redirect to login if not authenticated
  if (!sessionValidation.isValid || !sessionValidation.role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // T102 - RBAC verification: Check admin access for admin routes
  if (isAdminRoute(pathname) && sessionValidation.role !== 'admin') {
    // Redirect non-admin users to user dashboard (prevents URL manipulation)
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // T102 - RBAC verification: Check admin access for admin API routes
  if (isAdminApiRoute(pathname) && sessionValidation.role !== 'admin') {
    // Return 403 Forbidden for API routes (prevents unauthorized API access)
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }
  
  return NextResponse.next();
}

/**
 * Configure which routes to run middleware on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by API route middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

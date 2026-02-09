/**
 * Next.js Middleware
 * 
 * Handles route protection and authentication validation
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/health'];

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = ['/admin'];

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
 * Get user role from session cookie
 */
function getUserRoleFromCookie(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    // Decode base64 session
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );
    
    // Check if session is valid
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      return null;
    }
    
    return sessionData.role || null;
  } catch (error) {
    return null;
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
  
  // Check authentication
  const role = getUserRoleFromCookie(request);
  
  // Redirect to login if not authenticated
  if (!role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check admin access
  if (isAdminRoute(pathname) && role !== 'admin') {
    // Redirect non-admin users to user dashboard
    return NextResponse.redirect(new URL('/', request.url));
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

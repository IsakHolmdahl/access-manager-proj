/**
 * Session Validation API Route
 * 
 * GET /api/auth/session
 * Checks if user has valid session
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession, isSessionValid } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({
        isAuthenticated: false,
      });
    }

    // Decrypt and validate session
    const session = decryptSession(sessionCookie.value);

    if (!isSessionValid(session)) {
      // Clear invalid session
      cookieStore.delete('session');
      return NextResponse.json({
        isAuthenticated: false,
      });
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: session.user,
      role: session.role,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      isAuthenticated: false,
      error: {
        message: 'Session validation failed',
        type: 'AuthenticationError',
      },
    });
  }
}

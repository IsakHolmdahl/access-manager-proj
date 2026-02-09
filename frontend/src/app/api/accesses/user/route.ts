/**
 * User Accesses API Route
 * 
 * GET /api/accesses/user
 * Fetches current user's accesses
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession, isSessionValid } from '@/lib/auth';
import { Access } from '@/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8090';

export async function GET() {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        {
          error: {
            message: 'Not authenticated',
            type: 'AuthenticationError',
          },
        },
        { status: 401 }
      );
    }

    // Validate session
    const session = decryptSession(sessionCookie.value);

    if (!isSessionValid(session)) {
      return NextResponse.json(
        {
          error: {
            message: 'Session expired',
            type: 'AuthenticationError',
          },
        },
        { status: 401 }
      );
    }

    const userId = session.user.username;

    // Fetch accesses from backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/users/${userId}/accesses`,
      {
        headers: {
          'X-Username': userId,
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: {
            message: errorData.error?.message || 'Failed to fetch accesses',
            type: errorData.error?.type || 'ServerError',
          },
        },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();

    // Transform backend response to frontend format
    const accesses: Access[] = (backendData.accesses || []).map((item: any) => ({
      id: item.access_id,
      name: item.access_name,
      description: item.description,
      created_at: item.granted_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      accesses,
      count: accesses.length,
    });
  } catch (error) {
    console.error('Fetch accesses error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch accesses',
          type: 'InternalServerError',
        },
      },
      { status: 500 }
    );
  }
}

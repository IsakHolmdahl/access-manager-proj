/**
 * Admin User Access Assignment API Route
 * 
 * POST /api/admin/users/{userId}/accesses - Assign access to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession, isSessionValid } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8090';
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

/**
 * POST - Assign access to user (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
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

    // Check admin role
    if (session.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            message: 'Unauthorized. Admin access required.',
            type: 'AuthorizationError',
          },
        },
        { status: 403 }
      );
    }

    if (!ADMIN_KEY) {
      return NextResponse.json(
        {
          error: {
            message: 'Server configuration error',
            type: 'ConfigurationError',
          },
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { access_name } = body;

    if (!access_name) {
      return NextResponse.json(
        {
          error: {
            message: 'access_name is required',
            type: 'ValidationError',
          },
        },
        { status: 400 }
      );
    }

    // First, get the user to find their username
    const userResponse = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        {
          error: {
            message: 'Failed to fetch user',
            type: 'ServerError',
          },
        },
        { status: userResponse.status }
      );
    }

    const usersData = await userResponse.json();
    const user = usersData.users?.find((u: any) => u.id === parseInt(userId));

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: 'User not found',
            type: 'NotFoundError',
          },
        },
        { status: 404 }
      );
    }

    // Assign access to user via backend API
    const response = await fetch(`${BACKEND_URL}/users/${userId}/accesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Username': user.username,
      },
      body: JSON.stringify({ access_name }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: {
            message: errorData.detail || 'Failed to assign access',
            type: 'ServerError',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Assign access error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to assign access',
          type: 'InternalServerError',
        },
      },
      { status: 500 }
    );
  }
}

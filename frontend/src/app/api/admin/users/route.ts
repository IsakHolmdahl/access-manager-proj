/**
 * Admin Users API Route
 * 
 * GET /api/admin/users - Fetch all users
 * POST /api/admin/users - Create new user
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession, isSessionValid } from '@/lib/auth';
import { userCreationSchema } from '@/lib/validations/user';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8090';
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

/**
 * GET - Fetch all users
 */
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

    // Fetch users from backend
    const response = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: {
            message: errorData.error?.message || 'Failed to fetch users',
            type: errorData.error?.type || 'ServerError',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch users',
          type: 'InternalServerError',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new user
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = userCreationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Validation failed',
            type: 'ValidationError',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Create user in backend
    const response = await fetch(`${BACKEND_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY,
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: {
            message: errorData.error?.message || 'Failed to create user',
            type: errorData.error?.type || 'ServerError',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to create user',
          type: 'InternalServerError',
        },
      },
      { status: 500 }
    );
  }
}

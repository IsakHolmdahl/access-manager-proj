/**
 * Login API Route
 * 
 * POST /api/auth/login
 * Authenticates user and creates session
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createSessionPayload,
  encryptSession,
  getSessionCookieOptions,
  getUserRole,
  isValidUserId,
} from '@/lib/auth';
import { User } from '@/types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8090';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Validate input
    if (!userId || !isValidUserId(userId)) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid user ID format',
            type: 'ValidationError',
          },
        },
        { status: 400 }
      );
    }

    // Check with backend if user exists
    const backendResponse = await fetch(`${BACKEND_URL}/users/${userId}`, {
      headers: {
        'X-Username': userId,
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error: {
            message: 'User not found or invalid credentials',
            type: 'AuthenticationError',
          },
        },
        { status: 401 }
      );
    }

    const backendData = await backendResponse.json();

    // Create user object
    const user: User = {
      id: backendData.user_id || userId,
      username: backendData.username || userId,
      created_at: backendData.created_at || new Date().toISOString(),
      is_admin: userId === 'admin',
    };

    // Determine role
    const role = getUserRole(user.username);

    // Create session
    const sessionPayload = createSessionPayload(user, role);
    const encryptedSession = encryptSession(sessionPayload);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', encryptedSession, getSessionCookieOptions());

    return NextResponse.json({
      success: true,
      user,
      role,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Login failed',
          type: 'InternalServerError',
        },
      },
      { status: 500 }
    );
  }
}

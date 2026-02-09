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

    // POC Authentication: Look up user by username to get user_id
    // For admin: verify admin key and get admin user_id
    // For regular users: look up from admin users list (POC simplification)
    
    let user: User;

    if (userId === 'admin') {
      const adminKey = process.env.ADMIN_SECRET_KEY;
      if (!adminKey) {
        return NextResponse.json(
          {
            error: {
              message: 'Admin authentication not configured',
              type: 'ConfigurationError',
            },
          },
          { status: 500 }
        );
      }

      // Look up admin user from backend to get ID
      const backendResponse = await fetch(`${BACKEND_URL}/admin/users`, {
        headers: {
          'X-Admin-Key': adminKey,
        },
      });

      if (!backendResponse.ok) {
        return NextResponse.json(
          {
            error: {
              message: 'Admin authentication failed',
              type: 'AuthenticationError',
            },
          },
          { status: 401 }
        );
      }

      const usersData = await backendResponse.json();
      const adminUser = usersData.users?.find((u: any) => u.username === 'admin');

      if (!adminUser) {
        return NextResponse.json(
          {
            error: {
              message: 'Admin user not found',
              type: 'AuthenticationError',
            },
          },
          { status: 401 }
        );
      }

      user = {
        id: adminUser.id.toString(),
        username: adminUser.username,
        created_at: adminUser.created_at,
        is_admin: true,
      };
    } else {
      // For regular users: look up by username (POC: no password check)
      // We need to use admin endpoint to look up user by username
      const adminKey = process.env.ADMIN_SECRET_KEY;
      
      if (!adminKey) {
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

      const backendResponse = await fetch(`${BACKEND_URL}/admin/users`, {
        headers: {
          'X-Admin-Key': adminKey,
        },
      });

      if (!backendResponse.ok) {
        return NextResponse.json(
          {
            error: {
              message: 'Authentication failed',
              type: 'AuthenticationError',
            },
          },
          { status: 401 }
        );
      }

      const usersData = await backendResponse.json();
      const foundUser = usersData.users?.find((u: any) => u.username === userId);

      if (!foundUser) {
        return NextResponse.json(
          {
            error: {
              message: `User '${userId}' not found`,
              type: 'AuthenticationError',
            },
          },
          { status: 401 }
        );
      }

      user = {
        id: foundUser.id.toString(),
        username: foundUser.username,
        created_at: foundUser.created_at,
        is_admin: false,
      };
    }

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

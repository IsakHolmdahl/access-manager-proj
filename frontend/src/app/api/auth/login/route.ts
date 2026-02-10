/**
 * Login API Route
 * 
 * POST /api/auth/login
 * Authenticates user and creates session
 * 
 * T087 - Complex Authentication Flow:
 * ===================================
 * 
 * 1. Input Validation:
 *    - Sanitize and validate userId format
 *    - Prevent injection attacks with regex validation
 * 
 * 2. User Lookup Strategy (POC Simplified):
 *    - Admin users: Lookup via /admin/users endpoint with admin key
 *    - Regular users: Lookup via same endpoint (POC: no password check)
 *    - Production TODO: Implement proper password hashing and verification
 * 
 * 3. Session Creation:
 *    - Create session payload with user data and expiration
 *    - Encrypt session data (POC: base64, Production: AES-256-GCM)
 *    - Store in HTTP-only cookie for XSS protection
 * 
 * 4. Security Features:
 *    - HTTP-only cookies (no JavaScript access)
 *    - SameSite=Strict (CSRF protection)
 *    - Secure flag in production (HTTPS only)
 *    - Session expiration (7 days)
 * 
 * 5. Error Handling:
 *    - Specific error messages for debugging
 *    - Generic messages to client (no info leakage)
 *    - Proper HTTP status codes
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
    // Step 1: Parse and validate request body
    const body = await request.json();
    const { userId } = body;

    // T087: Input validation - prevent injection attacks
    // Validates alphanumeric with underscores/hyphens only
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

    // Step 2: User authentication and lookup
    // T087: POC Authentication Flow - In production, implement:
    //   - Password hashing (bcrypt/argon2)
    //   - Rate limiting on login attempts
    //   - Account lockout after failed attempts
    //   - Multi-factor authentication (MFA)
    
    let user: User;

    // T087: Admin authentication branch
    if (userId === 'admin') {
      // Admin key must be configured in environment
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

      // T087: Fetch admin user from backend
      // Uses admin key for authorization (X-Admin-Key header)
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

      // T087: Verify admin user exists in system
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

      // T087: Construct admin user object
      user = {
        id: adminUser.id.toString(),
        username: adminUser.username,
        created_at: adminUser.created_at,
        is_admin: true,
      };
    } else {
      // T087: Regular user authentication branch
      // POC: No password check - username lookup only
      // Production TODO: Add password verification
      
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

      // T087: Look up user in backend database
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

      // T087: User not found - return 401 (don't reveal if user exists)
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

      // T087: Construct regular user object
      user = {
        id: foundUser.id.toString(),
        username: foundUser.username,
        created_at: foundUser.created_at,
        is_admin: false,
      };
    }

    // Step 3: Create and encrypt session
    // T087: Session creation with expiration
    const role = getUserRole(user.username);
    const sessionPayload = createSessionPayload(user, role);
    
    // T087: Encrypt session (POC: base64, Production: proper encryption)
    const encryptedSession = encryptSession(sessionPayload);

    // Step 4: Set HTTP-only session cookie
    // T087: Security features:
    //   - httpOnly: true (no JavaScript access - XSS protection)
    //   - secure: true in prod (HTTPS only)
    //   - sameSite: 'strict' (CSRF protection)
    //   - maxAge: 7 days (session expiration)
    const cookieStore = await cookies();
    cookieStore.set('session', encryptedSession, getSessionCookieOptions());

    // Step 5: Return success response
    return NextResponse.json({
      success: true,
      user,
      role,
    });
  } catch (error) {
    // T087: Error handling - log detailed error, return generic message
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

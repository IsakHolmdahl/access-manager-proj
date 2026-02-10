/**
 * Admin Accesses API Route
 * 
 * GET /api/admin/accesses - Fetch all accesses with user counts
 * POST /api/admin/accesses - Create new access
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decryptSession, isSessionValid } from '@/lib/auth';
import { accessCreationSchema } from '@/lib/validations/access';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8090';
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

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

    // Fetch all accesses from backend (backend max limit is 100, so fetch all pages)
    let allAccesses: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const accessesResponse = await fetch(
        `${BACKEND_URL}/admin/accesses?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'X-Admin-Key': ADMIN_KEY,
          },
        }
      );

      if (!accessesResponse.ok) {
        const errorData = await accessesResponse.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: {
              message: errorData.error?.message || 'Failed to fetch accesses',
              type: errorData.error?.type || 'ServerError',
            },
          },
          { status: accessesResponse.status }
        );
      }

      const pageData = await accessesResponse.json();
      allAccesses = allAccesses.concat(pageData.accesses || []);
      
      // Check if there are more results
      hasMore = pageData.accesses && pageData.accesses.length === limit;
      offset += limit;
    }

    const accessesData = { accesses: allAccesses, total: allAccesses.length };

    // Fetch all users to count assignments
    const usersResponse = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY,
      },
    });

    if (!usersResponse.ok) {
      const errorData = await usersResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: {
            message: errorData.error?.message || 'Failed to fetch users',
            type: errorData.error?.type || 'ServerError',
          },
        },
        { status: usersResponse.status }
      );
    }

    const usersData = await usersResponse.json();

    // For each access, count how many users have it by fetching each user's accesses
    // Note: This is POC-level - in production, backend should provide this data
    const accessesWithCounts = await Promise.all(
      (accessesData.accesses || []).map(async (access: any) => {
        // Count users with this access by checking each user's accesses
        let userCount = 0;
        const assignedUsers: any[] = [];

        for (const user of usersData.users || []) {
          try {
            const userAccessesResponse = await fetch(
              `${BACKEND_URL}/users/${user.id}/accesses`,
              {
                headers: {
                  'X-Username': user.username,
                },
              }
            );

            if (userAccessesResponse.ok) {
              const userAccessesData = await userAccessesResponse.json();
              const hasAccess = userAccessesData.accesses?.some(
                (ua: any) => ua.id === access.id
              );

              if (hasAccess) {
                userCount++;
                assignedUsers.push({
                  id: user.id,
                  username: user.username,
                });
              }
            }
          } catch (error) {
            // Skip user on error
            console.error(`Error checking access for user ${user.username}:`, error);
          }
        }

        return {
          id: access.id?.toString() || '',
          name: access.name || '',
          description: access.description || '',
          created_at: access.created_at || new Date().toISOString(),
          user_count: userCount,
          assigned_users: assignedUsers,
        };
      })
    );

    return NextResponse.json({
      accesses: accessesWithCounts,
      count: accessesWithCounts.length,
    });
  } catch (error) {
    console.error('Fetch admin accesses error:', error);
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

/**
 * POST - Create new access
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
    const validation = accessCreationSchema.safeParse(body);

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

    // Create access in backend
    const response = await fetch(`${BACKEND_URL}/admin/accesses`, {
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
            message: errorData.error?.message || 'Failed to create access',
            type: errorData.error?.type || 'ServerError',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create access error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to create access',
          type: 'InternalServerError',
        },
      },
      { status: 500 }
    );
  }
}

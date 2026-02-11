/**
 * Logout API Route
 * 
 * POST /api/auth/logout
 * Terminates user session
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Logout failed',
          type: 'InternalServerError',
        },
      },
      { status: 500 }
    );
  }
}

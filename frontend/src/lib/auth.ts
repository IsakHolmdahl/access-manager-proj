/**
 * Authentication Utilities
 * 
 * Handles cookie encryption, session management, and auth helpers
 */

import { User, UserRole } from '@/types';

/**
 * Cookie names
 */
export const COOKIE_NAMES = {
  SESSION: 'session',
  USER_ID: 'user_id',
  ROLE: 'role',
} as const;

/**
 * Session duration (7 days)
 */
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Extract user role from username
 */
export function getUserRole(username: string): UserRole {
  return username === 'admin' ? 'admin' : 'user';
}

/**
 * Check if username is admin
 */
export function isAdminUsername(username: string): boolean {
  return username === 'admin';
}

/**
 * Create session cookie options
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  };
}

/**
 * Validate user ID format
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || userId.length < 1 || userId.length > 50) {
    return false;
  }
  
  // Alphanumeric with underscores and hyphens
  return /^[a-zA-Z0-9_-]+$/.test(userId);
}

/**
 * Encrypt session data (placeholder - implement with crypto in production)
 * For POC, we use simple encoding
 */
export function encryptSession(data: any): string {
  try {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  } catch (e) {
    throw new Error('Failed to encrypt session');
  }
}

/**
 * Decrypt session data (placeholder - implement with crypto in production)
 * For POC, we use simple decoding
 */
export function decryptSession(encrypted: string): any {
  try {
    return JSON.parse(Buffer.from(encrypted, 'base64').toString());
  } catch (e) {
    throw new Error('Failed to decrypt session');
  }
}

/**
 * Create session payload
 */
export function createSessionPayload(user: User, role: UserRole) {
  return {
    user,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  };
}

/**
 * Validate session payload
 */
export function isSessionValid(session: any): boolean {
  if (!session || typeof session !== 'object') {
    return false;
  }
  
  if (!session.user || !session.role || !session.expiresAt) {
    return false;
  }
  
  // Check if session expired
  if (Date.now() > session.expiresAt) {
    return false;
  }
  
  return true;
}

/**
 * Extract username from session
 */
export function getUsernameFromSession(session: any): string | null {
  if (!session?.user?.username) {
    return null;
  }
  return session.user.username;
}

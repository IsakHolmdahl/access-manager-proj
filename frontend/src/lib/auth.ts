/**
 * Authentication Utilities
 * 
 * Handles cookie encryption, session management, and auth helpers
 * 
 * Security Features (T082, T084, T096):
 * - HTTP-only cookie configuration
 * - Secure cookie handling (production HTTPS enforcement)
 * - Session expiration management
 * - Input validation and sanitization
 * - SameSite=Strict for CSRF protection
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
 * Session duration (7 days in milliseconds)
 * T096 - Session expiration configuration
 */
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Maximum input lengths for security (T098 - Input length validation)
 */
export const MAX_INPUT_LENGTHS = {
  USER_ID: 50,
  USERNAME: 50,
  ACCESS_NAME: 100,
  DESCRIPTION: 500,
} as const;

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
 * 
 * T084 - HTTP-only cookie configuration verification:
 * - httpOnly: true (prevents XSS attacks, JavaScript cannot access)
 * - secure: true in production (requires HTTPS)
 * - sameSite: 'strict' (prevents CSRF attacks)
 * - maxAge: 7 days
 * - path: '/' (available throughout the app)
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true, // T084 - XSS protection (cannot be accessed via JavaScript)
    secure: process.env.NODE_ENV === 'production', // T085 - Requires HTTPS in production
    sameSite: 'strict' as const, // T084 - CSRF protection
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  };
}

/**
 * Sanitize user input to prevent injection attacks
 * T082 - Input sanitization
 * 
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return '';
  
  // Truncate to max length (T098)
  let sanitized = input.slice(0, maxLength);
  
  // Remove potentially dangerous characters
  // Allow: alphanumeric, spaces, underscores, hyphens, basic punctuation
  sanitized = sanitized.replace(/[<>\"'`]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate user ID format
 * T082 - Input validation
 * 
 * @param userId - User ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || userId.length < 1 || userId.length > MAX_INPUT_LENGTHS.USER_ID) {
    return false;
  }
  
  // Alphanumeric with underscores and hyphens only (prevents injection)
  return /^[a-zA-Z0-9_-]+$/.test(userId);
}

/**
 * Validate access name format
 * T082 - Input validation for access names
 * 
 * @param name - Access name to validate
 * @returns true if valid, false otherwise
 */
export function isValidAccessName(name: string): boolean {
  if (!name || name.length < 1 || name.length > MAX_INPUT_LENGTHS.ACCESS_NAME) {
    return false;
  }
  
  // Uppercase with underscores only (per spec)
  return /^[A-Z][A-Z0-9_]*$/.test(name);
}

/**
 * Validate description format
 * T082 - Input validation for descriptions
 * 
 * @param description - Description to validate
 * @returns true if valid, false otherwise
 */
export function isValidDescription(description: string): boolean {
  if (!description) return true; // Optional field
  
  return description.length <= MAX_INPUT_LENGTHS.DESCRIPTION;
}

/**
 * Encrypt session data (placeholder - implement with crypto in production)
 * For POC, we use simple encoding
 * 
 * TODO Production: Replace with proper encryption (AES-256-GCM)
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
 * 
 * TODO Production: Replace with proper decryption
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
 * T096 - Includes expiration timestamp
 */
export function createSessionPayload(user: User, role: UserRole) {
  const now = Date.now();
  return {
    user,
    role,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };
}

/**
 * Validate session payload
 * T096 - Validates expiration
 */
export function isSessionValid(session: any): boolean {
  if (!session || typeof session !== 'object') {
    return false;
  }
  
  if (!session.user || !session.role || !session.expiresAt) {
    return false;
  }
  
  // Check if session expired (T096)
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

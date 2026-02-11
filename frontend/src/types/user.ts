/**
 * User-specific types and utilities
 */

import { User as BaseUser } from './index';

// Re-export base User type
export type User = BaseUser;

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.username === 'admin' || user?.is_admin === true;
}

/**
 * Format user display name
 */
export function getUserDisplayName(user: User): string {
  return user.username;
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user: User): string {
  return user.username.substring(0, 2).toUpperCase();
}

/**
 * Format user creation date
 */
export function formatUserDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

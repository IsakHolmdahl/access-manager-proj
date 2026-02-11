/**
 * Access-specific types and utilities
 */

import { Access as BaseAccess } from './index';

// Re-export base Access type
export type Access = BaseAccess;

/**
 * Format access name for display (convert underscores to spaces)
 */
export function formatAccessName(name: string): string {
  return name.replace(/_/g, ' ');
}

/**
 * Validate access name format (uppercase with underscores)
 */
export function isValidAccessName(name: string): boolean {
  return /^[A-Z_]+$/.test(name);
}

/**
 * Format access creation date
 */
export function formatAccessDate(dateString: string): string {
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

/**
 * Get access badge color based on user count
 */
export function getAccessBadgeColor(userCount?: number): string {
  if (!userCount || userCount === 0) return 'gray';
  if (userCount < 5) return 'blue';
  if (userCount < 10) return 'green';
  return 'purple';
}

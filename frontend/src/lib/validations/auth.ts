/**
 * Authentication Form Validation Schemas
 * 
 * Zod schemas for login and authentication forms
 */

import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required')
    .max(50, 'User ID must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'User ID can only contain letters, numbers, underscores, and hyphens'
    ),
});

export type LoginFormData = z.infer<typeof loginSchema>;

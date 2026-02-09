/**
 * User Validation Schemas
 * 
 * Zod schemas for user-related form validation
 */

import { z } from 'zod';

/**
 * User creation schema
 */
export const userCreationSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export type UserCreationFormData = z.infer<typeof userCreationSchema>;

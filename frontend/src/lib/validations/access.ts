/**
 * Access Validation Schemas
 * 
 * Zod schemas for access-related form validation
 */

import { z } from 'zod';

/**
 * Access creation schema
 */
export const accessCreationSchema = z.object({
  name: z
    .string()
    .min(3, 'Access name must be at least 3 characters')
    .max(100, 'Access name must be less than 100 characters')
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      'Access name must be uppercase with underscores (e.g., READ_DOCUMENTS)'
    ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  renewal_period: z
    .number()
    .int('Renewal period must be an integer')
    .min(1, 'Renewal period must be at least 1 day')
    .max(3650, 'Renewal period cannot exceed 10 years')
    .nullable()
    .optional(),
});

export type AccessCreationFormData = z.infer<typeof accessCreationSchema>;

/**
 * API Error Types and Constants
 * 
 * Handles API error responses and standardized error handling
 */

import { APIError } from './index';

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * API error types
 */
export enum APIErrorType {
  NETWORK_ERROR = 'NetworkError',
  AUTH_ERROR = 'AuthenticationError',
  PERMISSION_ERROR = 'PermissionError',
  VALIDATION_ERROR = 'ValidationError',
  NOT_FOUND_ERROR = 'NotFoundError',
  CONFLICT_ERROR = 'ConflictError',
  SERVER_ERROR = 'InternalServerError',
}

/**
 * Create an API error object
 */
export function createAPIError(
  message: string,
  type: string = APIErrorType.SERVER_ERROR,
  details?: any
): APIError {
  return {
    message,
    type,
    details,
  };
}

/**
 * Parse error from fetch response
 */
export async function parseAPIError(response: Response): Promise<APIError> {
  try {
    const data = await response.json();
    
    if (data.error) {
      return {
        message: data.error.message || 'An error occurred',
        type: data.error.type || APIErrorType.SERVER_ERROR,
        details: data.error.details,
      };
    }
    
    return createAPIError('An unexpected error occurred');
  } catch (e) {
    return createAPIError('Failed to parse error response');
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: APIError | string | unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as APIError).message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if error is authentication-related
 */
export function isAuthError(error: APIError): boolean {
  return error.type === APIErrorType.AUTH_ERROR || error.type === APIErrorType.PERMISSION_ERROR;
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: APIError): boolean {
  return error.type === APIErrorType.NETWORK_ERROR;
}

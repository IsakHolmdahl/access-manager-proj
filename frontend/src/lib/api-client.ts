/**
 * API Client Utilities
 * 
 * Handles HTTP requests, error handling, and backend communication
 * 
 * Features:
 * - T097: Exponential backoff retry logic for transient failures
 * - T083: Rate limiting considerations (client-side)
 * - Request timeout handling
 * - Error parsing and standardization
 */

import { APIError, APIResponse } from '@/types';
import { parseAPIError, createAPIError, APIErrorType } from '@/types/api';
import { ERROR_MESSAGES } from '@/types';

/**
 * Base API URL (from environment)
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Default fetch options
 */
const DEFAULT_OPTIONS: RequestInit = {
  credentials: 'include', // Include cookies
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * API Client configuration
 * 
 * T097 - Exponential backoff configuration:
 * - retries: Number of retry attempts (default: 3 for transient errors)
 * - retryDelay: Base delay in ms (default: 1000ms = 1 second)
 * - Exponential backoff: delay * (2 ^ attempt) with jitter
 * - Max backoff: 30 seconds
 * 
 * T083 - Rate limiting considerations:
 * - Client respects server rate limits (429 status)
 * - Exponential backoff prevents overwhelming server
 * - TODO Production: Implement token bucket or sliding window on server
 */
interface APIClientConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  maxBackoff?: number;
}

const DEFAULT_CONFIG: APIClientConfig = {
  timeout: 30000, // 30 seconds
  retries: 3, // T097: Default 3 retries for resilience
  retryDelay: 1000, // T097: Base 1 second delay
  maxBackoff: 30000, // T097: Max 30 seconds between retries
};

/**
 * Calculate exponential backoff delay with jitter
 * T097 - Exponential backoff implementation
 * 
 * Formula: min(maxBackoff, baseDelay * 2^attempt) + random jitter
 * Jitter prevents thundering herd problem when multiple clients retry simultaneously
 * 
 * @param attempt - Retry attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxBackoff - Maximum backoff delay in milliseconds
 * @returns Delay in milliseconds with jitter
 */
function calculateBackoff(attempt: number, baseDelay: number, maxBackoff: number): number {
  // Exponential: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Cap at maxBackoff
  const cappedDelay = Math.min(exponentialDelay, maxBackoff);
  
  // Add jitter (±25% random variation)
  const jitter = cappedDelay * 0.25 * (Math.random() - 0.5) * 2;
  
  return Math.floor(cappedDelay + jitter);
}

/**
 * Check if error is retryable
 * T097 - Determines which errors should trigger retry
 * 
 * Retryable: 5xx server errors, network errors, timeouts
 * Not retryable: 4xx client errors, authentication errors
 */
function isRetryableError(status?: number, errorType?: APIErrorType): boolean {
  // Network errors and timeouts are always retryable
  if (errorType === APIErrorType.NETWORK_ERROR) {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (status && status >= 500 && status < 600) {
    return true;
  }
  
  // Rate limit (429) should be retried with backoff
  if (status === 429) {
    return true;
  }
  
  // Client errors (4xx) are not retryable
  return false;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_CONFIG.timeout!
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw createAPIError('Request timeout', APIErrorType.NETWORK_ERROR);
    }
    throw error;
  }
}

/**
 * Main API request function with exponential backoff retry
 * T097 - Implements retry logic with exponential backoff for transient failures
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  config: APIClientConfig = {}
): Promise<APIResponse<T>> {
  const { timeout, retries, retryDelay, maxBackoff } = { ...DEFAULT_CONFIG, ...config };
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const requestOptions: RequestInit = {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...options.headers,
    },
  };
  
  let lastError: APIError | null = null;
  
  // T097: Retry loop with exponential backoff
  for (let attempt = 0; attempt <= retries!; attempt++) {
    try {
      const response = await fetchWithTimeout(url, requestOptions, timeout);
      
      // Success responses
      if (response.ok) {
        const data = await response.json();
        return { data };
      }
      
      // Error responses
      const error = await parseAPIError(response);
      
      // Check if error is retryable (T097)
      if (!isRetryableError(response.status, error.type)) {
        // Don't retry client errors (4xx except 429)
        return { error };
      }
      
      // Store error for potential retry
      lastError = error;
      
      // Wait before retry with exponential backoff (T097)
      if (attempt < retries!) {
        const backoffDelay = calculateBackoff(attempt, retryDelay!, maxBackoff!);
        console.log(`Retry attempt ${attempt + 1}/${retries} after ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
    } catch (error) {
      // Network errors
      if (error && typeof error === 'object' && 'message' in error) {
        lastError = error as APIError;
      } else {
        lastError = createAPIError(
          ERROR_MESSAGES.NETWORK_ERROR,
          APIErrorType.NETWORK_ERROR
        );
      }
      
      // Check if should retry network error (T097)
      if (isRetryableError(undefined, lastError.type) && attempt < retries!) {
        const backoffDelay = calculateBackoff(attempt, retryDelay!, maxBackoff!);
        console.log(`Network error retry ${attempt + 1}/${retries} after ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      } else if (attempt >= retries!) {
        // Max retries exceeded
        break;
      }
    }
  }
  
  return { error: lastError || createAPIError(ERROR_MESSAGES.SERVER_ERROR) };
}

/**
 * Sends a GET request to the API
 * 
 * Includes automatic retry with exponential backoff for transient failures (T097)
 * 
 * @template T - Expected response data type
 * @param endpoint - API endpoint (e.g., '/api/users' or full URL)
 * @param config - Optional configuration (timeout, retries, etc.)
 * @returns Promise resolving to APIResponse with data or error
 * 
 * @example
 * ```typescript
 * const response = await apiGet<User[]>('/api/users');
 * if (response.data) {
 *   console.log(response.data);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export async function apiGet<T>(
  endpoint: string,
  config?: APIClientConfig
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' }, config);
}

/**
 * Sends a POST request to the API
 * 
 * Automatically serializes body to JSON and includes retry logic (T097)
 * 
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param body - Request body (will be JSON stringified)
 * @param config - Optional configuration
 * @returns Promise resolving to APIResponse with data or error
 * 
 * @example
 * ```typescript
 * const response = await apiPost<{ success: boolean }>('/api/login', {
 *   userId: '123'
 * });
 * ```
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any,
  config?: APIClientConfig
): Promise<APIResponse<T>> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    },
    config
  );
}

/**
 * Sends a PUT request to the API
 * 
 * Used for updating existing resources
 * 
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param body - Request body (will be JSON stringified)
 * @param config - Optional configuration
 * @returns Promise resolving to APIResponse with data or error
 * 
 * @example
 * ```typescript
 * const response = await apiPut<User>('/api/users/123', {
 *   username: 'newname'
 * });
 * ```
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any,
  config?: APIClientConfig
): Promise<APIResponse<T>> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    },
    config
  );
}

/**
 * Sends a DELETE request to the API
 * 
 * Used for deleting resources
 * 
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param config - Optional configuration
 * @returns Promise resolving to APIResponse with data or error
 * 
 * @example
 * ```typescript
 * const response = await apiDelete<{ success: boolean }>('/api/users/123');
 * ```
 */
export async function apiDelete<T>(
  endpoint: string,
  config?: APIClientConfig
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' }, config);
}

/**
 * Uploads a file using multipart/form-data
 * 
 * Automatically sets correct Content-Type with boundary
 * 
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param formData - FormData containing file(s) and fields
 * @param config - Optional configuration
 * @returns Promise resolving to APIResponse with data or error
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', fileBlob);
 * formData.append('name', 'document.pdf');
 * const response = await apiUpload('/api/upload', formData);
 * ```
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  config?: APIClientConfig
): Promise<APIResponse<T>> {
  // Remove Content-Type header to let browser set it with boundary
  const { headers, ...restOptions } = DEFAULT_OPTIONS;
  
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      body: formData,
      ...restOptions,
    },
    config
  );
}

/**
 * Builds a URL query string from an object
 * 
 * Filters out null/undefined values and properly encodes parameters
 * 
 * @param params - Object containing query parameters
 * @returns Query string with leading '?' or empty string if no params
 * 
 * @example
 * ```typescript
 * const query = buildQueryString({ page: 1, limit: 20, filter: null });
 * // Returns: "?page=1&limit=20"
 * ```
 */
export function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      query.append(key, String(value));
    }
  });
  
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * API client with all methods
 */
export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  upload: apiUpload,
  buildQueryString,
};

/**
 * Admin API Methods
 */

/**
 * Fetches all accesses with user assignment counts (admin only)
 * 
 * Requires admin role. Returns access list with metadata including
 * how many users are assigned to each access.
 * 
 * @returns Promise resolving to APIResponse with accesses array
 * @throws APIError if user is not authenticated or not admin
 * 
 * @example
 * ```typescript
 * const response = await fetchAdminAccesses();
 * if (response.data) {
 *   const accesses = response.data.accesses;
 *   console.log(`Found ${accesses.length} accesses`);
 * }
 * ```
 */
export async function fetchAdminAccesses() {
  return apiGet('/api/admin/accesses');
}

/**
 * Fetches all users in the system (admin only)
 * 
 * Requires admin role. Returns user list with full details.
 * 
 * @returns Promise resolving to APIResponse with users array
 * @throws APIError if user is not authenticated or not admin
 * 
 * @example
 * ```typescript
 * const response = await fetchAdminUsers();
 * if (response.data) {
 *   console.log(`Total users: ${response.data.users.length}`);
 * }
 * ```
 */
export async function fetchAdminUsers() {
  return apiGet('/api/admin/users');
}

/**
 * Creates a new user in the system (admin only)
 * 
 * Requires admin role. Password will be hashed on the server.
 * Username must be unique.
 * 
 * @param userData - User creation data
 * @param userData.username - Unique username (3-50 chars)
 * @param userData.password - Password (min 8 chars)
 * @returns Promise resolving to APIResponse with created user
 * @throws APIError if username exists or validation fails
 * 
 * @example
 * ```typescript
 * const response = await createUser({
 *   username: 'newuser',
 *   password: 'securePass123'
 * });
 * if (response.data) {
 *   console.log(`Created user: ${response.data.user.username}`);
 * }
 * ```
 */
export async function createUser(userData: { username: string; password: string }) {
  return apiPost('/api/admin/users', userData);
}

/**
 * Creates a new access permission (admin only)
 * 
 * Requires admin role. Access name must be unique.
 * 
 * @param accessData - Access creation data
 * @param accessData.name - Unique access name (required)
 * @param accessData.description - Optional description
 * @param accessData.renewal_period - Optional renewal period in days
 * @returns Promise resolving to APIResponse with created access
 * @throws APIError if name exists or validation fails
 * 
 * @example
 * ```typescript
 * const response = await createAccess({
 *   name: 'VIP Access',
 *   description: 'Premium user access',
 *   renewal_period: 365
 * });
 * if (response.data) {
 *   console.log(`Created access: ${response.data.access.name}`);
 * }
 * ```
 */
export async function createAccess(accessData: {
  name: string;
  description?: string;
  renewal_period?: number;
}) {
  return apiPost('/api/admin/accesses', accessData);
}

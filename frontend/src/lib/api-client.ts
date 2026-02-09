/**
 * API Client Utilities
 * 
 * Handles HTTP requests, error handling, and backend communication
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
 */
interface APIClientConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: APIClientConfig = {
  timeout: 30000, // 30 seconds
  retries: 0,
  retryDelay: 1000,
};

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
 * Main API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  config: APIClientConfig = {}
): Promise<APIResponse<T>> {
  const { timeout, retries, retryDelay } = { ...DEFAULT_CONFIG, ...config };
  
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
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return { error };
      }
      
      // Store error for retry
      lastError = error;
      
      // Wait before retry
      if (attempt < retries!) {
        await new Promise(resolve => setTimeout(resolve, retryDelay! * (attempt + 1)));
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
      
      // Wait before retry
      if (attempt < retries!) {
        await new Promise(resolve => setTimeout(resolve, retryDelay! * (attempt + 1)));
      }
    }
  }
  
  return { error: lastError || createAPIError(ERROR_MESSAGES.SERVER_ERROR) };
}

/**
 * GET request
 */
export async function apiGet<T>(
  endpoint: string,
  config?: APIClientConfig
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' }, config);
}

/**
 * POST request
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
 * PUT request
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
 * DELETE request
 */
export async function apiDelete<T>(
  endpoint: string,
  config?: APIClientConfig
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' }, config);
}

/**
 * Upload file (multipart/form-data)
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
 * Build query string from object
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
 * Fetch all accesses with user counts (admin only)
 */
export async function fetchAdminAccesses() {
  return apiGet('/api/admin/accesses');
}

/**
 * Fetch all users (admin only)
 */
export async function fetchAdminUsers() {
  return apiGet('/api/admin/users');
}

/**
 * Create a new user (admin only)
 */
export async function createUser(userData: { username: string; password: string }) {
  return apiPost('/api/admin/users', userData);
}

/**
 * Create a new access (admin only)
 */
export async function createAccess(accessData: {
  name: string;
  description?: string;
  renewal_period?: number;
}) {
  return apiPost('/api/admin/accesses', accessData);
}

/**
 * TypeScript Type Definitions - Web Admin Frontend
 * 
 * Feature: 002-web-admin-frontend
 * Date: 2026-02-09
 * 
 * This file contains all TypeScript interfaces and types used across the frontend.
 * These types ensure type safety for API responses, component props, and state management.
 */

// ============================================================================
// Core Domain Entities
// ============================================================================

/**
 * Represents a user in the system
 */
export interface User {
  id: string;
  username: string;
  created_at: string;  // ISO 8601 timestamp
  is_admin?: boolean;  // Derived from username === "admin"
  access_count?: number;  // Number of accesses (admin view only)
}

/**
 * Represents an access/permission that can be assigned to users
 */
export interface Access {
  id: string;
  name: string;  // e.g., "READ_DOCUMENTS", "APPROVE_INVOICES"
  description?: string;
  created_at: string;  // ISO 8601 timestamp
  user_count?: number;  // Number of users with this access (admin view)
  assigned_users?: User[];  // Users who have this access (admin view)
}

// ============================================================================
// Authentication & Session
// ============================================================================

/**
 * User role enum
 */
export type UserRole = 'user' | 'admin';

/**
 * Current user session state
 */
export interface UserSession {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  userId: string;
}

/**
 * Login response payload
 */
export interface LoginResponse {
  success: boolean;
  user: User;
  role: UserRole;
}

/**
 * Session validation response
 */
export interface SessionResponse {
  isAuthenticated: boolean;
  user?: User;
  role?: UserRole;
  error?: APIError;
}

// ============================================================================
// API Responses
// ============================================================================

/**
 * Standard API error response
 */
export interface APIError {
  message: string;
  type: string;
  details?: any;
}

/**
 * API response wrapper with error handling
 */
export interface APIResponse<T> {
  data?: T;
  error?: APIError;
}

/**
 * User accesses response (GET /api/accesses/user)
 */
export interface UserAccessesResponse {
  accesses: Access[];
  count: number;
}

/**
 * All accesses response (GET /api/admin/accesses)
 */
export interface AllAccessesResponse {
  accesses: Access[];
  count: number;
}

/**
 * All users response (GET /api/admin/users)
 */
export interface AllUsersResponse {
  users: User[];
  count: number;
}

/**
 * User creation response (POST /api/admin/users)
 */
export interface UserCreationResponse {
  success: boolean;
  user: User;
}

/**
 * Access creation response (POST /api/admin/accesses)
 */
export interface AccessCreationResponse {
  success: boolean;
  access: Access;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
}

// ============================================================================
// Backend API Types (for API route integration)
// ============================================================================

/**
 * Backend access response format
 */
export interface BackendAccessResponse {
  user_id: string;
  username: string;
  accesses: Array<{
    access_id: string;
    access_name: string;
    granted_at: string;
  }>;
  count: number;
}

/**
 * Backend user response format
 */
export interface BackendUserResponse {
  user_id: string;
  username: string;
  created_at: string;
  accesses_count?: number;
}

/**
 * Backend access detail response format
 */
export interface BackendAccessDetailResponse {
  access_id: string;
  access_name: string;
  description?: string;
  created_at: string;
  users_with_access?: number;
}

/**
 * Backend error response format
 */
export interface BackendErrorResponse {
  error: {
    message: string;
    type: string;
    details?: any;
  };
}

// ============================================================================
// Form Input Types
// ============================================================================

/**
 * User creation form data
 */
export interface UserCreationFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

/**
 * Access creation form data
 */
export interface AccessCreationFormData {
  name: string;
  description?: string;
}

/**
 * Generic form state
 */
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Loading state enum
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * User access list state (for user dashboard)
 */
export interface UserAccessListState {
  accesses: Access[];
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  lastFetched: number | null;
}

/**
 * Admin access management state
 */
export interface AdminAccessManagementState {
  accesses: Access[];
  selectedAccess: Access | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    hasUsers: boolean | null;
  };
  lastFetched: number | null;
}

/**
 * Admin user management state
 */
export interface AdminUserManagementState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  createUserForm: {
    isOpen: boolean;
    isSubmitting: boolean;
    error: string | null;
  };
  lastFetched: number | null;
}

/**
 * Chat message (placeholder)
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Chat state (placeholder)
 */
export interface ChatState {
  messages: ChatMessage[];
  isEnabled: boolean;  // Always false for placeholder
  isExpanded: boolean;  // UI state (mobile)
  placeholderText: string;
}

/**
 * Navigation state (mobile)
 */
export interface NavigationState {
  isMobileMenuOpen: boolean;
  activeTab: 'dashboard' | 'chat' | 'profile';
  isSidebarCollapsed: boolean;
}

// ============================================================================
// Cached Data Types
// ============================================================================

/**
 * Cached data wrapper with expiration
 */
export interface CachedData<T> {
  data: T;
  fetchedAt: number;  // Unix timestamp
  expiresAt: number;  // Unix timestamp
}

// ============================================================================
// Component Prop Types
// ============================================================================

/**
 * Access list component props
 */
export interface AccessListProps {
  accesses: Access[];
  isLoading?: boolean;
  emptyMessage?: string;
  showUserCount?: boolean;  // Show user count (admin view)
}

/**
 * Access card component props
 */
export interface AccessCardProps {
  access: Access;
  showUserCount?: boolean;
  onClick?: () => void;
}

/**
 * User form component props
 */
export interface UserFormProps {
  onSubmit: (data: UserCreationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Access form component props
 */
export interface AccessFormProps {
  onSubmit: (data: AccessCreationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Chat interface component props
 */
export interface ChatInterfaceProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  placeholderText?: string;
}

/**
 * Loading spinner component props
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Error message component props
 */
export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * useAuth hook return type
 */
export interface UseAuthReturn {
  session: UserSession;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

/**
 * useApi hook return type
 */
export interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * useForm hook return type (custom)
 */
export interface UseFormReturn<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleSubmit: (onSubmit: (data: T) => void) => (e: React.FormEvent) => void;
  reset: () => void;
  setError: (field: keyof T, error: string) => void;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an object is a User
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'username' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).username === 'string'
  );
}

/**
 * Type guard to check if an object is an Access
 */
export function isAccess(obj: unknown): obj is Access {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).name === 'string'
  );
}

/**
 * Type guard to check if an object is an APIError
 */
export function isAPIError(obj: unknown): obj is APIError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    'type' in obj &&
    typeof (obj as any).message === 'string' &&
    typeof (obj as any).type === 'string'
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys from T where value is of type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Async function type
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * Event handler type
 */
export type EventHandler<T = void> = (event: React.SyntheticEvent) => T;

// ============================================================================
// Constants
// ============================================================================

/**
 * Cache duration constants (milliseconds)
 */
export const CACHE_DURATION = {
  USER_ACCESSES: 5 * 60 * 1000,      // 5 minutes
  ADMIN_ACCESSES: 5 * 60 * 1000,     // 5 minutes
  ADMIN_USERS: 5 * 60 * 1000,        // 5 minutes
} as const;

/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  ACCESSES: {
    USER: '/api/accesses/user',
  },
  ADMIN: {
    ACCESSES: '/api/admin/accesses',
    USERS: '/api/admin/users',
  },
  HEALTH: '/api/health',
} as const;

/**
 * Error message constants
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your connection.',
  AUTH_REQUIRED: 'Please log in to continue.',
  AUTH_FAILED: 'Invalid user ID. Please try again.',
  PERMISSION_DENIED: "You don't have permission to perform this action.",
  USER_NOT_FOUND: 'User not found.',
  ACCESS_NOT_FOUND: 'Access not found.',
  USERNAME_EXISTS: 'This username is already taken.',
  ACCESS_EXISTS: 'This access name already exists.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

/**
 * Authentication Context Provider
 * 
 * Manages user session state and authentication actions
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, User, UserRole } from '@/types';
import { apiPost, apiGet } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/types';
import { getUserRole } from '@/lib/auth';

interface AuthContextType {
  session: UserSession;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialSession: UserSession = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/**
 * Authentication Context Provider
 * 
 * Provides authentication state and actions to all child components.
 * Automatically checks session on mount and manages user login/logout.
 * 
 * Features:
 * - Session persistence via HTTP-only cookies (T084)
 * - Automatic session validation on mount
 * - Role-based access control (RBAC)
 * - Loading and error state management
 * 
 * @param children - React child components
 * 
 * @example
 * ```typescript
 * // In app layout
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // In any child component
 * const { session, login } = useAuth();
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(initialSession);

  /**
   * Check session on mount
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Checks if user has a valid session
   * 
   * Called automatically on mount and can be called manually
   * to refresh session state. Updates session state with user
   * info and role if authenticated.
   * 
   * @example
   * ```typescript
   * // Manual session check after potential changes
   * await checkSession();
   * ```
   */
  const checkSession = async () => {
    setSession(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiGet<{
        isAuthenticated: boolean;
        user?: User;
        role?: UserRole;
      }>(API_ENDPOINTS.AUTH.SESSION);

      if (response.error) {
        setSession({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          error: response.error.message,
        });
        return;
      }

      if (response.data?.isAuthenticated && response.data.user) {
        setSession({
          user: response.data.user,
          role: response.data.role || 'user',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setSession({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setSession({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check session',
      });
    }
  };

  /**
   * Authenticates a user and creates a session
   * 
   * Sends login request to backend, which validates credentials
   * and creates an HTTP-only session cookie. Updates local state
   * with user info and role on success.
   * 
   * @param userId - User ID (numeric string)
   * @throws Error if login fails or credentials invalid
   * 
   * @example
   * ```typescript
   * try {
   *   await login('123');
   *   router.push('/dashboard');
   * } catch (error) {
   *   console.error('Login failed:', error);
   * }
   * ```
   */
  const login = async (userId: string) => {
    setSession(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiPost<{
        success: boolean;
        user: User;
        role: UserRole;
      }>(API_ENDPOINTS.AUTH.LOGIN, { userId });

      if (response.error) {
        setSession({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          error: response.error.message,
        });
        throw new Error(response.error.message);
      }

      if (response.data?.success && response.data.user) {
        const role = getUserRole(response.data.user.username);
        setSession({
          user: response.data.user,
          role,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setSession({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  };

  /**
   * Logs out the current user and clears session
   * 
   * Calls backend logout endpoint to invalidate session cookie,
   * then clears local session state. Always succeeds locally even
   * if backend request fails.
   * 
   * @example
   * ```typescript
   * await logout();
   * router.push('/login');
   * ```
   */
  const logout = async () => {
    setSession(prev => ({ ...prev, isLoading: true }));

    try {
      await apiPost(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSession({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * 
 * Internal hook for accessing auth context. Use `useAuth()` hook instead
 * in your components for better developer experience.
 * 
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 * 
 * @internal
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(initialSession);

  /**
   * Check session on mount
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Check if user has valid session
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
   * Login user
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
   * Logout user
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
 * Hook to use auth context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

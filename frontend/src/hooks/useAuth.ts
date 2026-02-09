/**
 * useAuth Hook
 * 
 * Provides authentication state and actions
 */

'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { UseAuthReturn } from '@/types';

export function useAuth(): UseAuthReturn {
  const { session, login, logout, checkSession } = useAuthContext();
  
  return {
    session,
    login,
    logout,
    checkSession,
  };
}

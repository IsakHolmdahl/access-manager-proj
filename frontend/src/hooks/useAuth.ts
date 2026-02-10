/**
 * useAuth Hook
 * 
 * Provides authentication state and actions
 */

'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { UseAuthReturn } from '@/types';

/**
 * useAuth Hook
 * 
 * React hook providing authentication state and actions
 * 
 * Provides access to current user session, login/logout functions,
 * and session checking. Must be used within an AuthProvider.
 * 
 * @returns Authentication state and methods
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { session, login, logout } = useAuth();
 *   
 *   if (session.isLoading) return <LoadingSpinner />;
 *   if (!session.isAuthenticated) return <LoginForm />;
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {session.user?.username}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { session, login, logout, checkSession } = useAuthContext();
  
  return {
    session,
    login,
    logout,
    checkSession,
  };
}

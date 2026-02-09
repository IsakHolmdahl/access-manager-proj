/**
 * User Dashboard Page
 * 
 * Main page for regular users to view their accesses
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiGet } from '@/lib/api-client';
import { API_ENDPOINTS, Access } from '@/types';
import { AccessList } from '@/components/user/AccessList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccesses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiGet<{ accesses: Access[]; count: number }>(
        API_ENDPOINTS.ACCESSES.USER
      );

      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setAccesses(response.data.accesses);
      }
    } catch (err) {
      setError('Failed to load accesses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session.isAuthenticated && !session.isLoading) {
      fetchAccesses();
    }
  }, [session.isAuthenticated, session.isLoading]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session.isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Accesses</h1>
              <p className="text-sm text-muted-foreground">
                Logged in as {session.user?.username}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAccesses}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <ErrorMessage message={error} onRetry={fetchAccesses} className="mb-6" />}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <AccessList accesses={accesses} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
}

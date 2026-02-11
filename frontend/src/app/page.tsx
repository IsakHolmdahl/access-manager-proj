/**
 * User Dashboard Page
 * 
 * Main page for regular users to view their accesses and interact with chat
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiGet } from '@/lib/api-client';
import { API_ENDPOINTS, Access } from '@/types';
import { AccessList } from '@/components/user/AccessList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

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
            <div className="flex items-center gap-2">
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

      {/* Main Content with Responsive Layout */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Accesses Section */}
          <div className="lg:col-span-2">
            {error && <ErrorMessage message={error} onRetry={fetchAccesses} className="mb-6" />}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <AccessList accesses={accesses} isLoading={isLoading} />
            )}
          </div>

          {/* Chat Section - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <ChatInterface isPlaceholder={true} />
            </div>
          </div>
        </div>

        {/* Chat Toggle Button - Mobile */}
        <div className="fixed bottom-4 right-4 lg:hidden">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setChatOpen(!chatOpen)}
          >
            {chatOpen ? (
              <ChevronRight className="h-6 w-6" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Chat Panel - Mobile */}
        {chatOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setChatOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-4">
                  <h3 className="font-semibold">AI Assistant</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatOpen(false)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1">
                  <ChatInterface isPlaceholder={true} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

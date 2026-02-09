/**
 * Admin Layout
 * 
 * Layout wrapper for admin pages with navigation and role check
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Shield, Users, Key, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, logout } = useAuth();

  useEffect(() => {
    // Redirect non-admin users
    if (!session.isLoading && session.isAuthenticated && session.user?.is_admin === false) {
      router.push('/');
    }
    
    // Redirect to login if not authenticated
    if (!session.isLoading && !session.isAuthenticated) {
      router.push('/login');
    }
  }, [session, router]);

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

  if (!session.isAuthenticated || !session.user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Admin Header - Distinct styling */}
      <header className="border-b bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-2 backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-purple-100">
                  Logged in as {session.user.username}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Badge */}
      <div className="border-b border-purple-200 bg-purple-50 px-4 py-2">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <Shield className="h-4 w-4" />
            <span className="font-semibold">Administrator Access</span>
            <span className="text-purple-500">•</span>
            <span>Full system permissions</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

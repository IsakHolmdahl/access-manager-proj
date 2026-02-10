/**
 * Admin Dashboard Page
 * 
 * Main admin interface with tabs for accesses and users
 */

'use client';

import { useEffect, useState } from 'react';
import { AdminAccessList } from '@/components/admin/AdminAccessList';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { UserCreationDialog } from '@/components/admin/UserCreationDialog';
import { AccessCreationDialog } from '@/components/admin/AccessCreationDialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Key, Users, Plus } from 'lucide-react';
import { apiGet } from '@/lib/api-client';

interface AdminAccess {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_count: number;
  assigned_users: Array<{ id: number; username: string }>;
}

interface User {
  id: number;
  username: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [accesses, setAccesses] = useState<AdminAccess[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingAccesses, setIsLoadingAccesses] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [accessesError, setAccessesError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);

  const fetchAccesses = async () => {
    setIsLoadingAccesses(true);
    setAccessesError(null);

    try {
      const response = await apiGet<{ accesses: AdminAccess[]; count: number }>(
        '/api/admin/accesses'
      );

      if (response.error) {
        setAccessesError(response.error.message);
      } else if (response.data) {
        setAccesses(response.data.accesses);
      }
    } catch (err) {
      setAccessesError('Failed to load accesses');
    } finally {
      setIsLoadingAccesses(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);

    try {
      const response = await apiGet<{ users: User[]; total: number }>(
        '/api/admin/users'
      );

      if (response.error) {
        setUsersError(response.error.message);
      } else if (response.data) {
        setUsers(response.data.users);
      }
    } catch (err) {
      setUsersError('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAccesses();
  }, []);

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleAccessCreated = () => {
    fetchAccesses();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage system accesses and user accounts
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="accesses" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="accesses" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Accesses
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex items-center gap-2"
            onClick={() => {
              if (users.length === 0 && !isLoadingUsers) {
                fetchUsers();
              }
            }}
          >
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Accesses Tab */}
        <TabsContent value="accesses" className="space-y-6">
          {/* Stats */}
          {!isLoadingAccesses && !accessesError && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-3">
                    <Key className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {accesses.length}
                    </p>
                    <p className="text-sm text-purple-600">Total Accesses</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-indigo-100 p-3">
                    <Key className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-900">
                      {accesses.filter((a) => a.user_count > 0).length}
                    </p>
                    <p className="text-sm text-indigo-600">Assigned</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 p-3">
                    <Key className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {accesses.filter((a) => a.user_count === 0).length}
                    </p>
                    <p className="text-sm text-slate-600">Unassigned</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {accessesError && (
            <ErrorMessage message={accessesError} onRetry={fetchAccesses} />
          )}

          {/* Access List */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Accesses</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAccesses}
                  disabled={isLoadingAccesses}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm" onClick={() => setShowAccessDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Access
                </Button>
              </div>
            </div>
            <AdminAccessList accesses={accesses} isLoading={isLoadingAccesses} onUpdate={fetchAccesses} />
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats */}
          {!isLoadingUsers && !usersError && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                    <p className="text-sm text-blue-600">Total Users</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-3">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {users.filter((u) => u.username === 'admin').length}
                    </p>
                    <p className="text-sm text-purple-600">Admins</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-3">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-900">
                      {users.filter((u) => u.username !== 'admin').length}
                    </p>
                    <p className="text-sm text-green-600">Regular Users</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {usersError && <ErrorMessage message={usersError} onRetry={fetchUsers} />}

          {/* User List */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm" onClick={() => setShowUserDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </div>
            </div>
            <AdminUserList users={users} isLoading={isLoadingUsers} />
          </div>
        </TabsContent>
      </Tabs>

      {/* User Creation Dialog */}
      <UserCreationDialog
        open={showUserDialog}
        onClose={() => setShowUserDialog(false)}
        onSuccess={handleUserCreated}
      />

      {/* Access Creation Dialog */}
      <AccessCreationDialog
        open={showAccessDialog}
        onClose={() => setShowAccessDialog(false)}
        onSuccess={handleAccessCreated}
      />
    </div>
  );
}

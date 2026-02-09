/**
 * Admin User List Component
 * 
 * Displays all users in the system
 */

'use client';

import { UserCard } from './UserCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface User {
  id: number;
  username: string;
  created_at: string;
}

interface AdminUserListProps {
  users: User[];
  isLoading: boolean;
}

export function AdminUserList({ users, isLoading }: AdminUserListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="No users have been created in the system yet."
      />
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

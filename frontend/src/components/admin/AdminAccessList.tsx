/**
 * Admin Access List Component
 * 
 * Displays all accesses in the system with user assignment information
 */

'use client';

import { AdminAccessCard } from './AdminAccessCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AdminAccess {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_count: number;
  assigned_users: Array<{ id: number; username: string }>;
}

interface AdminAccessListProps {
  accesses: AdminAccess[];
  isLoading: boolean;
}

export function AdminAccessList({ accesses, isLoading }: AdminAccessListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (accesses.length === 0) {
    return (
      <EmptyState
        title="No accesses defined"
        description="No access types have been created in the system yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accesses.map((access) => (
          <AdminAccessCard key={access.id} access={access} />
        ))}
      </div>
    </div>
  );
}

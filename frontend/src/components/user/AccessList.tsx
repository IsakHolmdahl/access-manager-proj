/**
 * Access List Component
 * 
 * Displays list of access cards
 */

import { AccessListProps } from '@/types';
import { AccessCard } from './AccessCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Key } from 'lucide-react';

export function AccessList({ accesses, isLoading, emptyMessage, showUserCount }: AccessListProps) {
  if (!isLoading && accesses.length === 0) {
    return (
      <EmptyState
        title="No Accesses"
        description={emptyMessage || "You don't have any accesses yet."}
        icon={<Key className="h-12 w-12 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accesses.map((access) => (
        <AccessCard key={access.id} access={access} showUserCount={showUserCount} />
      ))}
    </div>
  );
}

/**
 * Admin Access List Component
 * 
 * Displays all accesses in the system with user assignment information
 * 
 * T099 - Performance Optimization Notes:
 * Current implementation renders all items directly (suitable for <200 items).
 * 
 * For large datasets (500+ items), consider implementing:
 * 1. Virtualization: Use react-window or react-virtual for efficient rendering
 * 2. Pagination: Add server-side pagination (20-50 items per page)
 * 3. Infinite scroll: Load more items as user scrolls
 * 
 * Example virtualization with react-window:
 * ```typescript
 * import { FixedSizeList } from 'react-window';
 * 
 * <FixedSizeList
 *   height={600}
 *   itemCount={accesses.length}
 *   itemSize={100}
 *   width="100%"
 * >
 *   {({ index, style }) => (
 *     <div style={style}>
 *       <AdminAccessCard access={accesses[index]} />
 *     </div>
 *   )}
 * </FixedSizeList>
 * ```
 * 
 * Current dataset size: ~100 accesses (no performance issues expected)
 */

'use client';

import { AdminAccessCard } from './AdminAccessCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdminAccessCardSkeleton } from '@/components/ui/Skeleton';

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
  onUpdate?: () => void;
}

export function AdminAccessList({ accesses, isLoading, onUpdate }: AdminAccessListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <AdminAccessCardSkeleton key={i} />
        ))}
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
          <AdminAccessCard key={access.id} access={access} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

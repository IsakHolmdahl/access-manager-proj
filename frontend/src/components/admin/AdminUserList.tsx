/**
 * Admin User List Component
 * 
 * Displays all users in the system
 * 
 * T099 - Performance Optimization Notes:
 * Current implementation renders all items directly (suitable for <200 items).
 * 
 * For large datasets (1000+ users), consider implementing:
 * 1. Pagination: Server-side pagination with page controls
 * 2. Search/Filter: Add username search to reduce visible items
 * 3. Virtualization: Use react-window for very large lists
 * 
 * Example pagination implementation:
 * ```typescript
 * const [page, setPage] = useState(1);
 * const pageSize = 20;
 * const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);
 * 
 * <div>
 *   {paginatedUsers.map(user => <UserCard key={user.id} user={user} />)}
 *   <Pagination 
 *     currentPage={page} 
 *     totalPages={Math.ceil(users.length / pageSize)}
 *     onPageChange={setPage}
 *   />
 * </div>
 * ```
 * 
 * Current dataset size: ~10 users (no performance concerns)
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

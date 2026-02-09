/**
 * Access Detail Modal Component
 * 
 * Shows detailed information about an access including all assigned users
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, User, Calendar } from 'lucide-react';

interface AdminAccess {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_count: number;
  assigned_users: Array<{ id: number; username: string }>;
}

interface AccessDetailModalProps {
  access: AdminAccess;
  onClose: () => void;
}

export function AccessDetailModal({ access, onClose }: AccessDetailModalProps) {
  const formattedDate = new Date(access.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg text-purple-900">
            {access.name}
          </DialogTitle>
          <DialogDescription>{access.description || 'No description'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Access Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Created: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold">
                {access.user_count} user{access.user_count !== 1 ? 's' : ''} assigned
              </span>
            </div>
          </div>

          {/* Assigned Users List */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Assigned Users</h4>
            {access.assigned_users.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">No users have this access</p>
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-4">
                {access.assigned_users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded bg-white p-3 shadow-sm"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500">User ID: {user.id}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

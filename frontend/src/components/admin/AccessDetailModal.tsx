/**
 * Access Detail Modal Component
 * 
 * Shows detailed information about an access including all assigned users
 * Allows admins to assign/unassign users
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, User, Calendar, UserPlus, X } from 'lucide-react';
import { UserAssignmentDialog } from './UserAssignmentDialog';
import { apiDelete } from '@/lib/api-client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
  onUpdate?: () => void;
}

export function AccessDetailModal({ access, onClose, onUpdate }: AccessDetailModalProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const formattedDate = new Date(access.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleRemoveAccess = async (userId: number) => {
    setRemovingUserId(userId);
    setError(null);

    try {
      const response = await apiDelete(
        `/api/admin/users/${userId}/accesses/${access.id}`
      );

      if (response.error) {
        setError(response.error.message);
      } else {
        // Refresh parent data
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (err) {
      setError('Failed to remove access');
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleAssignSuccess = () => {
    // Refresh parent data
    if (onUpdate) {
      onUpdate();
    }
  };

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
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

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
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Assigned Users</h4>
              <Button
                size="sm"
                onClick={() => setShowAssignDialog(true)}
                className="gap-2"
                aria-label={`Assign ${access.name} to a user`}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Assign to User
              </Button>
            </div>
            {access.assigned_users.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">No users have this access</p>
                <p className="mt-2 text-xs text-gray-400">
                  Click "Assign to User" to grant access
                </p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAccess(user.id)}
                      disabled={removingUserId !== null}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Remove access"
                      aria-label={`Remove ${access.name} from ${user.username}`}
                      aria-busy={removingUserId === user.id}
                    >
                      {removingUserId === user.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <X className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* User Assignment Dialog */}
        {showAssignDialog && (
          <UserAssignmentDialog
            open={showAssignDialog}
            onClose={() => setShowAssignDialog(false)}
            accessId={access.id}
            accessName={access.name}
            assignedUserIds={access.assigned_users.map((u) => u.id)}
            onSuccess={handleAssignSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

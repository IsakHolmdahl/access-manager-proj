/**
 * User Assignment Dialog Component
 * 
 * Allows admins to assign an access to users who don't have it yet
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User, CheckCircle } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api-client';

interface User {
  id: number;
  username: string;
  created_at: string;
}

interface UserAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  accessId: string;
  accessName: string;
  assignedUserIds: number[];
  onSuccess: () => void;
}

export function UserAssignmentDialog({
  open,
  onClose,
  accessId,
  accessName,
  assignedUserIds,
  onSuccess,
}: UserAssignmentDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiGet<{ users: User[]; total: number }>(
        '/api/admin/users'
      );

      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        // Filter out users who already have this access
        const availableUsers = response.data.users.filter(
          (user) => !assignedUserIds.includes(user.id)
        );
        setUsers(availableUsers);
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignAccess = async (userId: number) => {
    setAssigningUserId(userId);
    setError(null);

    try {
      const response = await apiPost(
        `/api/admin/users/${userId}/accesses`,
        { access_name: accessName }
      );

      if (response.error) {
        setError(response.error.message);
      } else {
        // Remove user from list
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        
        // Call success callback to refresh parent data
        onSuccess();
        
        // If no more users to assign, close dialog
        if (users.length <= 1) {
          onClose();
        }
      }
    } catch (err) {
      setError('Failed to assign access');
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Access</DialogTitle>
          <DialogDescription>
            Select users to assign{' '}
            <span className="font-mono font-semibold text-purple-700">
              {accessName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-gray-700">
                All users have this access
              </p>
              <p className="mt-1 text-xs text-gray-500">
                There are no users available to assign
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-3 hover:border-purple-300 hover:bg-purple-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignAccess(user.id)}
                    disabled={assigningUserId !== null}
                  >
                    {assigningUserId === user.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Assign'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

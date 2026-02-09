/**
 * User Creation Dialog Component
 * 
 * Modal wrapper for user creation form
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserCreationForm } from './UserCreationForm';

interface UserCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserCreationDialog({
  open,
  onClose,
  onSuccess,
}: UserCreationDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will be able to log in immediately.
          </DialogDescription>
        </DialogHeader>
        <UserCreationForm onSuccess={handleSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}

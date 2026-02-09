/**
 * Access Creation Dialog Component
 * 
 * Modal wrapper for access creation form
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AccessCreationForm } from './AccessCreationForm';

interface AccessCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AccessCreationDialog({
  open,
  onClose,
  onSuccess,
}: AccessCreationDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Access</DialogTitle>
          <DialogDescription>
            Define a new access type that can be assigned to users in the system.
          </DialogDescription>
        </DialogHeader>
        <AccessCreationForm onSuccess={handleSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}

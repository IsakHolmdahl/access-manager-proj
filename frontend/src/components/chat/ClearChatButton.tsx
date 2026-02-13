/**
 * Clear Chat Button Component - Allows users to clear conversation history
 * Feature: 003-frontend-chat
 */

'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClearChatButtonProps {
  onClear: () => void;
  disabled?: boolean;
  variant?: 'button' | 'icon' | 'menu';
}

export function ClearChatButton({
  onClear,
  disabled = false,
  variant = 'button',
}: ClearChatButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = () => {
    if (showConfirm) {
      onClear();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  // Icon only variant (for header)
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClear}
        disabled={disabled}
        className={cn(
          'text-gray-500 hover:text-red-600 hover:bg-red-50',
          showConfirm && 'text-red-600 bg-red-50'
        )}
        aria-label="Clear chat history"
        title="Clear chat"
      >
        <Trash2 size={16} />
      </Button>
    );
  }

  // Menu item variant (for dropdown)
  if (variant === 'menu') {
    return (
      <button
        onClick={handleClear}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700',
          'hover:bg-gray-100 rounded-md',
          disabled && 'opacity-50 cursor-not-allowed',
          showConfirm && 'bg-red-50 text-red-700'
        )}
      >
        <Trash2 size={16} />
        {showConfirm ? 'Confirm Clear?' : 'Clear Chat'}
      </button>
    );
  }

  // Button variant (default)
  return (
    <div className="flex items-center gap-2">
      {showConfirm ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <AlertTriangle size={14} className="mr-1" />
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="text-gray-600 border-gray-200"
        >
          <Trash2 size={14} className="mr-1" />
          Clear Chat
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Confirmation Dialog Component
// ============================================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Clear',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-600 bg-red-100',
      confirm: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-600 bg-yellow-100',
      confirm: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-600 bg-blue-100',
      confirm: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              variantStyles[variant].icon
            )}
          >
            <AlertTriangle size={20} />
          </div>
          
          <div className="flex-1">
            <h3
              id="dialog-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={variantStyles[variant].confirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Clear Chat Header Component
// ============================================================================

interface ClearChatHeaderProps {
  messageCount: number;
  onClear: () => void;
}

export function ClearChatHeader({ messageCount, onClear }: ClearChatHeaderProps) {
  const [showDialog, setShowDialog] = useState(false);

  if (messageCount === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <span className="text-sm text-gray-600">
          {messageCount} message{messageCount !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="text-gray-500 hover:text-red-600"
        >
          <Trash2 size={14} className="mr-1" />
          Clear
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showDialog}
        onConfirm={() => {
          onClear();
          setShowDialog(false);
        }}
        onCancel={() => setShowDialog(false)}
        title="Clear Chat History"
        message="This will delete all messages in this conversation. This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </>
  );
}

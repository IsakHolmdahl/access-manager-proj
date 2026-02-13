/**
 * Chat Error Component - Displays error messages with retry option
 * Feature: 003-frontend-chat
 */

'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatError } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatErrorProps {
  error: ChatError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ChatError({ error, onRetry, onDismiss }: ChatErrorProps) {
  const errorColors = {
    network: 'bg-red-50 border-red-200 text-red-700',
    validation: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    server: 'bg-orange-50 border-orange-200 text-orange-700',
    unknown: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  const errorIcons = {
    network: '🌐',
    validation: '⚠️',
    server: '🔧',
    unknown: '❓',
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 m-4 rounded-lg border',
        errorColors[error.type]
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        <span className="text-xl">{errorIcons[error.type]}</span>
      </div>

      {/* Error Message */}
      <div className="flex-1">
        <p className="font-medium">{error.message}</p>
        
        {/* Error details for debugging (hidden in production) */}
        {process.env.NODE_ENV === 'development' && error.type === 'server' && (
          <p className="text-xs mt-1 opacity-75">
            Server error occurred. Check console for details.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-2">
        {error.retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Retry
          </Button>
        )}
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-sm"
          >
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Connection Lost Banner Component
// ============================================================================

export function ConnectionLostBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-red-100 text-red-700 text-sm">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Connection lost. Some features may be unavailable.</span>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:no-underline"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Offline Banner Component
// ============================================================================

export function OfflineBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 text-sm">
      <AlertCircle size={16} />
      <span>You are offline. Changes will be saved locally.</span>
    </div>
  );
}

/**
 * Chat Loading Component - Shows loading state while agent is thinking
 * Feature: 003-frontend-chat
 */

'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatLoading() {
  return (
    <div className="flex gap-3 p-4" role="status" aria-label="Agent is thinking">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot size={16} className="text-purple-600" />
      </div>

      {/* Loading bubble */}
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Typing Indicator Component
// ============================================================================

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="animate-pulse">Agent is typing</span>
      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
    </div>
  );
}

// ============================================================================
// Skeleton Loader Component
// ============================================================================

export function ChatSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      {/* Avatar skeleton */}
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      
      {/* Message skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Chat Interface Component - Main chat container with real functionality
 * Feature: 003-frontend-chat
 */

'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatWindow } from './ChatWindow';

interface ChatInterfaceProps {
  isPlaceholder?: boolean;
}

export function ChatInterface({ isPlaceholder = false }: ChatInterfaceProps) {
  // Mock user data - in real app, this would come from auth context
  const mockUser = {
    id: 1,
    username: 'test_user',
  };

  if (isPlaceholder) {
    return <PlaceholderChatInterface />;
  }

  return (
    <ChatProvider userId={mockUser.id} username={mockUser.username}>
      <RealChatInterface />
    </ChatProvider>
  );
}

// ============================================================================
// Placeholder Component (existing)
// ============================================================================

function PlaceholderChatInterface() {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-1 font-medium text-gray-900">Chat Coming Soon</h3>
            <p className="text-sm text-gray-500">
              AI-powered access requests are almost here!
            </p>
          </div>
        </div>
      </div>

      {/* Input (disabled) */}
      <div className="border-t bg-gray-50 p-4">
        <input
          type="text"
          placeholder="Chat feature coming soon..."
          disabled
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm opacity-50"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Real Implementation
// ============================================================================

function RealChatInterface() {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          <span className="ml-auto rounded-full bg-green-400 px-2 py-0.5 text-xs font-semibold text-green-900">
            Online
          </span>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}

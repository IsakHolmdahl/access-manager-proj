/**
 * Chat Window Component - Main chat container with messages and input
 * Feature: 003-frontend-chat
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatLoading } from './ChatLoading';
import { ChatError } from './ChatError';
import { ClearChatButton } from './ClearChatButton';
import { ChatEmptyState } from './ChatEmptyState';
import { cn } from '@/lib/utils';

export function ChatWindow() {
  const {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    clearChat,
    retryLastMessage,
    dismissError,
    isChatEmpty,
    shouldShowWelcome,
    messagesEndRef,
  } = useChat();

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, messagesEndRef]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h2 className="font-semibold text-gray-900">Access Assistant</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {sessionId && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              Session: {sessionId.slice(0, 8)}...
            </span>
          )}
          {messages.length > 0 && (
            <ClearChatButton
              onClear={clearChat}
              variant="icon"
            />
          )}
        </div>
      </header>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Welcome message for empty chat */}
        {shouldShowWelcome && <ChatEmptyState />}

        {/* Messages */}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isLatest={index === messages.length - 1}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && <ChatLoading />}

        {/* Messages end ref for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <ChatError
          error={error}
          onRetry={retryLastMessage}
          onDismiss={dismissError}
        />
      )}

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        disabled={false}
        placeholder="Describe what access you need..."
      />
    </div>
  );
}

// ============================================================================
// Chat Interface Wrapper (with sidebar)
// ============================================================================

interface ChatInterfaceProps {
  showHistory?: boolean;
}

export function ChatInterface({ showHistory = false }: ChatInterfaceProps) {
  return (
    <div className="flex h-full gap-4">
      {/* Main chat area */}
      <div className="flex-1">
        <ChatWindow />
      </div>

      {/* History sidebar (future enhancement) */}
      {showHistory && (
        <aside className="w-64 border-l bg-gray-50 p-4 hidden lg:block">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Chats</h3>
          <p className="text-sm text-gray-500">
            Chat history will appear here...
          </p>
        </aside>
      )}
    </div>
  );
}

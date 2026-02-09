/**
 * Chat Interface Component
 * 
 * Main chat container with placeholder state
 */

'use client';

import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { MessageSquare } from 'lucide-react';

interface ChatInterfaceProps {
  messages?: Array<{
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }>;
  isPlaceholder?: boolean;
}

export function ChatInterface({
  messages = [],
  isPlaceholder = true,
}: ChatInterfaceProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          {isPlaceholder && (
            <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
              Coming Soon
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isPlaceholder ? (
          <ChatEmptyState />
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <p className="text-sm">Start a conversation...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput disabled={isPlaceholder} />
    </div>
  );
}

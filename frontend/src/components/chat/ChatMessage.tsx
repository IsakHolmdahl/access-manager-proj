/**
 * Chat Message Component - Displays a single chat message
 * Feature: 003-frontend-chat
 */

'use client';

import { useMemo } from 'react';
import { User, Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  const formattedTime = useMemo(() => {
    return format(new Date(message.timestamp), 'HH:mm');
  }, [message.timestamp]);

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Agent'} message at ${formattedTime}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-blue-100 text-blue-600'
            : 'bg-purple-100 text-purple-600'
        )}
        aria-hidden="true"
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-[70%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          )}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Metadata (agent only) */}
        {message.metadata && !isUser && (
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Tools used */}
            {message.metadata.tools_used &&
              message.metadata.tools_used.length > 0 && (
                <span className="text-xs text-gray-500">
                  Used: {message.metadata.tools_used.join(', ')}
                </span>
              )}

            {/* Accesses granted */}
            {message.metadata.accesses_granted &&
              message.metadata.accesses_granted.length > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Granted: {message.metadata.accesses_granted.join(', ')}
                </span>
              )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400 mt-1">
          {formattedTime}
        </span>
      </div>
    </div>
  );
}

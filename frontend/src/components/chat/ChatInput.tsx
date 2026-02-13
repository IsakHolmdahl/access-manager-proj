/**
 * Chat Input Component - Input field for chat messages
 * Feature: 003-frontend-chat
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [message]);

  // Handle send
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      const trimmedMessage = message.trim();
      
      if (trimmedMessage && !isLoading && !disabled) {
        onSend(trimmedMessage);
        setMessage('');
        
        // Reset height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    [message, isLoading, disabled, onSend]
  );

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift for new line)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        
        const trimmedMessage = message.trim();
        
        if (trimmedMessage && !isLoading && !disabled) {
          onSend(trimmedMessage);
          setMessage('');
          
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        }
      }
    },
    [message, isLoading, disabled, onSend]
  );

  // Focus textarea on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Chat feature coming soon...' : placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100',
              'placeholder:text-gray-400',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-[150px] min-h-[44px]'
            )}
            aria-label="Chat message input"
          />
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          size="lg"
          className={cn(
            'h-11 w-11 p-0',
            !message.trim() || isLoading || disabled
              ? 'bg-gray-100'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Helper text */}
      {disabled && (
        <p className="mt-2 text-xs text-center text-gray-500">
          This feature is currently in development
        </p>
      )}
      
      {!disabled && (
        <p className="mt-2 text-xs text-center text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      )}
    </div>
  );
}

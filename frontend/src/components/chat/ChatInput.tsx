/**
 * Chat Input Component
 * 
 * Input field for chat messages (disabled for placeholder)
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  disabled?: boolean;
}

export function ChatInput({ disabled = false }: ChatInputProps) {
  return (
    <div className="border-t bg-white p-4">
      <form className="flex gap-2">
        <Input
          placeholder={
            disabled
              ? 'Chat feature coming soon...'
              : 'Type your message...'
          }
          disabled={disabled}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {disabled && (
        <p className="mt-2 text-xs text-center text-gray-500">
          This feature is currently in development
        </p>
      )}
    </div>
  );
}

/**
 * Chat Empty State Component
 * 
 * Displays "coming soon" message for chat feature
 */

'use client';

import { MessageSquare, Sparkles } from 'lucide-react';

export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative mb-6">
        <div className="rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-6">
          <MessageSquare className="h-12 w-12 text-purple-600" />
        </div>
        <div className="absolute -right-1 -top-1 animate-pulse">
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </div>
      </div>
      
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        LLM Chat Coming Soon!
      </h3>
      
      <p className="mb-4 max-w-md text-sm text-gray-600">
        We're working on an AI-powered assistant to help you explore and manage your
        accesses through natural conversation.
      </p>
      
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 max-w-md">
        <p className="text-xs text-purple-800">
          <strong>Preview:</strong> Ask questions like "What accesses do I have?" or
          "Who has admin access?" and get instant answers.
        </p>
      </div>
    </div>
  );
}

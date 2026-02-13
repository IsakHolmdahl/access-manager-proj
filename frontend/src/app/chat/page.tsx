/**
 * Chat Page - Main chat interface page
 * Feature: 003-frontend-chat
 */

'use client';

import React from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatInterface } from '@/components/chat/ChatWindow';

// Mock user data - in real app, this would come from auth context
const mockUser = {
  id: 1,
  username: 'test_user',
};

export default function ChatPage() {
  return (
    <ChatProvider userId={mockUser.id} username={mockUser.username}>
      <div className="h-[calc(100vh-4rem)]">
        <ChatInterface showHistory={false} />
      </div>
    </ChatProvider>
  );
}

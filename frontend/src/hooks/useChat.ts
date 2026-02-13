/**
 * useChat Hook - Custom hook for chat state management
 * Feature: 003-frontend-chat
 */

import { useCallback, useRef, useEffect } from 'react';
import { useChat as useChatContext, useChatMessages, useChatLoading, useChatError } from '@/contexts/ChatContext';
import { ChatMessage, ScrollToBottomOptions } from '@/types/chat';

// ============================================================================
// Hook
// ============================================================================

export function useChat() {
  const context = useChatContext();
  const messages = useChatMessages();
  const isLoading = useChatLoading();
  const error = useChatError();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = useCallback((options?: ScrollToBottomOptions) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: options?.behavior || 'smooth',
      block: options?.block || 'end',
      inline: options?.inline || 'nearest',
    });
  }, []);

  // Auto-scroll when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom({ behavior: 'smooth' });
    }
  }, [messages.length, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      await context.sendMessage(content);
      
      // Focus input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    [context]
  );

  // Clear chat
  const clearChat = useCallback(() => {
    context.clearChat();
    inputRef.current?.focus();
  }, [context]);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    await context.retryLastMessage();
    inputRef.current?.focus();
  }, [context]);

  // Dismiss error
  const dismissError = useCallback(() => {
    context.dismissError();
    inputRef.current?.focus();
  }, [context]);

  // Get last user message
  const getLastUserMessage = useCallback(() => {
    const reversed = [...messages].reverse();
    return reversed.find((msg) => msg.sender === 'user');
  }, [messages]);

  // Check if chat is empty
  const isChatEmpty = messages.length === 0;

  // Check if should show welcome message
  const shouldShowWelcome = isChatEmpty && !isLoading;

  return {
    // State
    messages,
    isLoading,
    error,
    sessionId: context.sessionId,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Actions
    sendMessage,
    clearChat,
    retryLastMessage,
    dismissError,
    
    // Helpers
    scrollToBottom,
    getLastUserMessage,
    
    // Derived state
    isChatEmpty,
    shouldShowWelcome,
    
    // History
    chatHistory: context.chatHistory,
    loadConversation: context.loadConversation,
    deleteConversation: context.deleteConversation,
  };
}

// ============================================================================
// Sub-hooks for specific concerns
// ============================================================================

export function useChatInput() {
  const { sendMessage, isLoading } = useChatContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const target = event.target as HTMLTextAreaElement;
        const content = target.value.trim();

        if (content) {
          sendMessage(content);
          target.value = '';
        }
      }
    },
    [sendMessage]
  );

  return {
    inputRef,
    handleKeyDown,
    isDisabled: isLoading,
  };
}

export function useChatScroll() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages: import('@/types/chat').ChatMessage[] = useChatMessages();

  const scrollToBottom = useCallback((options?: { behavior?: 'auto' | 'smooth'; block?: 'start' | 'center' | 'end' | 'nearest'; inline?: 'start' | 'center' | 'end' | 'nearest' }) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: options?.behavior || 'smooth',
      block: options?.block || 'end',
      inline: options?.inline || 'nearest',
    });
  }, []);

  const handleScroll = useCallback(() => {
    // Could implement "load more" functionality here
  }, []);

  return {
    messagesEndRef,
    scrollToBottom,
    handleScroll,
    messageCount: messages.length,
  };
}

/**
 * Chat Context - Global state management for the chat interface
 * Feature: 003-frontend-chat
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  ChatState,
  ChatContextValue,
  ChatMessage,
  ChatError,
  ChatHistoryItem,
  SendMessageParams,
} from '@/types/chat';
import { sendMessage } from '@/lib/api';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'chat_messages';
const SESSION_ID_KEY = 'chat_session_id';
const HISTORY_KEY = 'chat_history';

// ============================================================================
// Initial State
// ============================================================================

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  suggestedAccesses: [],
  sessionId: null,
};

// ============================================================================
// Action Types
// ============================================================================

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: ChatError | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_SUGGESTED_ACCESSES'; payload: [] }
  | { type: 'LOAD_FROM_STORAGE'; payload: { messages: ChatMessage[]; sessionId: string | null } };

// ============================================================================
// Reducer
// ============================================================================

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        error: null,
        suggestedAccesses: [],
      };
    
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    
    case 'SET_SUGGESTED_ACCESSES':
      return { ...state, suggestedAccesses: action.payload };
    
    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        messages: action.payload.messages,
        sessionId: action.payload.sessionId,
      };
    
    default:
      return state;
  }
}

// ============================================================================
// Local Storage Helpers
// ============================================================================

function saveToStorage(messages: ChatMessage[], sessionId: string | null): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      if (sessionId) {
        localStorage.setItem(SESSION_ID_KEY, sessionId);
      }
    }
  } catch (error) {
    console.error('Failed to save chat to localStorage:', error);
  }
}

function loadFromStorage(): { messages: ChatMessage[]; sessionId: string | null } {
  try {
    if (typeof window !== 'undefined') {
      const messagesJson = localStorage.getItem(STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_ID_KEY);
      
      const messages = messagesJson ? JSON.parse(messagesJson) : [];
      
      return {
        messages: messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        sessionId,
      };
    }
  } catch (error) {
    console.error('Failed to load chat from localStorage:', error);
  }
  
  return { messages: [], sessionId: null };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Context Provider
// ============================================================================

interface ChatProviderProps {
  children: React.ReactNode;
  userId: number;
  username: string;
}

export function ChatProvider({ children, userId, username }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [chatHistory, setChatHistory] = React.useState<ChatHistoryItem[]>([]);

  // Load chat from localStorage on mount
  useEffect(() => {
    const { messages, sessionId } = loadFromStorage();
    
    if (messages.length > 0) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: { messages, sessionId } });
    } else {
      // Generate new session ID for new chat
      const newSessionId = generateSessionId();
      dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
    }
  }, []);

  // Save chat to localStorage on message change
  useEffect(() => {
    saveToStorage(state.messages, state.sessionId);
  }, [state.messages, state.sessionId]);

  // Send message to agent
  const sendChatMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateSessionId(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const params: SendMessageParams = {
        message: content.trim(),
        userId,
        username,
        sessionId: state.sessionId || undefined,
      };

      const response = await sendMessage(params);

      // Add agent response
      const agentMessage: ChatMessage = {
        id: generateSessionId(),
        content: response.response,
        sender: 'agent',
        timestamp: new Date(),
        metadata: {
          tools_used: response.tools_used,
          accesses_granted: response.accesses_granted,
        },
      };

      dispatch({ type: 'ADD_MESSAGE', payload: agentMessage });

      // Update session ID if provided
      if (response.session_id && response.session_id !== state.sessionId) {
        dispatch({ type: 'SET_SESSION_ID', payload: response.session_id });
      }

    } catch (error) {
      // Error is already formatted by sendMessage
      dispatch({ type: 'SET_ERROR', payload: error as ChatError });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isLoading, state.sessionId, userId, username]);

  // Clear chat
  const clearChat = useCallback(() => {
    const newSessionId = generateSessionId();
    dispatch({ type: 'CLEAR_MESSAGES' });
    dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((msg) => msg.sender === 'user');
    
    if (lastUserMessage) {
      await sendChatMessage(lastUserMessage.content);
    }
  }, [state.messages, sendChatMessage]);

  // Dismiss error
  const dismissError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Load conversation from history
  const loadConversation = useCallback((sessionId: string) => {
    // This would load from a more permanent history store
    // For now, we'll just keep it as a placeholder
    console.log('Loading conversation:', sessionId);
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((sessionId: string) => {
    setChatHistory((prev) => prev.filter((item) => item.id !== sessionId));
    // Also remove from localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`chat_${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, []);

  const value: ChatContextValue = {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    suggestedAccesses: state.suggestedAccesses,
    sessionId: state.sessionId,
    
    // Actions
    sendMessage: sendChatMessage,
    clearChat,
    retryLastMessage,
    dismissError,
    
    // History
    chatHistory,
    loadConversation,
    deleteConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// ============================================================================
// Context Hook
// ============================================================================

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
}

// ============================================================================
// Selectors
// ============================================================================

export const useChatMessages = () => {
  const { messages } = useChat();
  return messages;
};

export const useChatLoading = () => {
  const { isLoading } = useChat();
  return isLoading;
};

export const useChatError = () => {
  const { error } = useChat();
  return error;
};

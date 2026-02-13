/**
 * TypeScript types for the Chat Interface
 * Feature: 003-frontend-chat
 */

// ============================================================================
// API Types
// ============================================================================

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id: number;
  username: string;
}

export interface ChatResponse {
  response: string;
  session_id?: string;
  tools_used: string[];
  accesses_granted: string[];
}

export interface SendMessageParams {
  message: string;
  userId: number;
  username: string;
  sessionId?: string;
}

// ============================================================================
// Chat Message Types
// ============================================================================

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  metadata?: {
    tools_used?: string[];
    accesses_granted?: string[];
    suggested_accesses?: AccessSuggestion[];
  };
}

export interface AccessSuggestion {
  id: number;
  name: string;
  description: string;
}

export interface ChatError {
  message: string;
  type: 'network' | 'validation' | 'server' | 'unknown';
  retryable: boolean;
}

// ============================================================================
// Chat Session Types
// ============================================================================

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

export interface ChatHistoryItem {
  id: string;
  preview: string;
  last_message: string;
  timestamp: Date;
  message_count: number;
}

// ============================================================================
// Chat State Types
// ============================================================================

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
  suggestedAccesses: AccessSuggestion[];
  sessionId: string | null;
}

export interface ChatContextValue {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
  suggestedAccesses: AccessSuggestion[];
  sessionId: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
  dismissError: () => void;
  
  // History
  chatHistory: ChatHistoryItem[];
  loadConversation: (sessionId: string) => void;
  deleteConversation: (sessionId: string) => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ChatMessageProps {
  message: ChatMessage;
  isLatest: boolean;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  error: ChatError | null;
}

export interface AccessCardProps {
  access: AccessSuggestion;
  onGrant: (accessName: string) => void;
  isGranting?: boolean;
}

export interface ChatHistoryProps {
  sessions: ChatHistoryItem[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type SenderType = 'user' | 'agent';

export interface CreateMessageParams {
  content: string;
  sender: SenderType;
  metadata?: ChatMessage['metadata'];
}

export interface ScrollToBottomOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

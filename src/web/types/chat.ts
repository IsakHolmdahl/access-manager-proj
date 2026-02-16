/**
 * Chat Types
 * TypeScript type definitions for chat functionality
 */

export interface ChatMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  message_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  message_id: string;
  timestamp: string;
}

export interface ChatInitialization {
  conversation_id: string;
  welcome_message: string;
  timestamp: string;
}

export interface ConversationHistory {
  conversation_id: string;
  user_id: number;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface UserContext {
  user_id: number;
  username: string;
  email?: string;
  current_accesses: string[];
}

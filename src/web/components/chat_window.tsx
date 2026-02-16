/**
 * Chat Window Component
 * Main chat interface for the user home page
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, ChatResponse } from '../types';
import { useChat } from '../hooks/use_chat';
import { ChatMessages } from './chat_messages';
import { ChatInput } from './chat_input';
import './chat_window.css';

interface ChatWindowProps {
  userId: number;
  username: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ userId, username }) => {
  const {
    messages,
    isLoading,
    isTyping,
    conversationId,
    sendMessage,
    endChat
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleEndChat = () => {
    if (conversationId) {
      endChat();
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <h2>Access Assistant</h2>
        <button 
          className="chat-end-button"
          onClick={handleEndChat}
          title="End conversation and start fresh"
        >
          New Conversation
        </button>
      </div>
      
      <div className="chat-window-messages">
        <ChatMessages 
          messages={messages} 
          isTyping={isTyping}
        />
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-window-input">
        <ChatInput 
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={!conversationId}
        />
      </div>
    </div>
  );
};

export default ChatWindow;

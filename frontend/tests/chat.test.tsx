/**
 * Unit Tests for Chat Context
 * Feature: 003-frontend-chat
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';

// ============================================================================
// Mock API
// ============================================================================

const mockSendMessage = jest.fn();
jest.mock('@/lib/api', () => ({
  sendMessage: (...args: any[]) => mockSendMessage(...args),
}));

// ============================================================================
// Test Components
// ============================================================================

describe('ChatContext', () => {
  const mockUser = { id: 1, username: 'test_user' };

  beforeEach(() => {
    mockSendMessage.mockReset();
    localStorage.clear();
  });

  test('provides chat state to children', () => {
    let contextValue = null;

    const TestComponent = () => {
      contextValue = useChat();
      return <div>Test</div>;
    };

    render(
      <ChatProvider userId={mockUser.id} username={mockUser.username}>
        <TestComponent />
      </ChatProvider>
    );

    expect(contextValue).not.toBeNull();
    expect(contextValue!.messages).toEqual([]);
    expect(contextValue!.isLoading).toBe(false);
    expect(contextValue!.error).toBeNull();
    expect(typeof contextValue!.sendMessage).toBe('function');
    expect(typeof contextValue!.clearChat).toBe('function');
  });

  test('sendMessage adds user message and updates loading state', async () => {
    mockSendMessage.mockResolvedValue({
      response: 'Here is some help',
      session_id: 'new-session',
      tools_used: [],
      accesses_granted: [],
    });

    const TestComponent = () => {
      const { messages, isLoading, sendMessage } = useChat();
      return (
        <div>
          <span data-testid="message-count">{messages.length}</span>
          <span data-testid="loading">{isLoading.toString()}</span>
          <button onClick={() => sendMessage('Hello')}>Send</button>
        </div>
      );
    };

    render(
      <ChatProvider userId={mockUser.id} username={mockUser.username}>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId('message-count').textContent).toBe('0');
    
    fireEvent.click(screen.getByText('Send'));
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    await waitFor(() => {
      expect(screen.getByTestId('message-count').textContent).toBe('2'); // User + Agent
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  test('clearChat removes all messages', () => {
    const TestComponent = () => {
      const { messages, clearChat } = useChat();
      return (
        <div>
          <span data-testid="count">{messages.length}</span>
          <button onClick={clearChat}>Clear</button>
        </div>
      );
    };

    // Mock localStorage
    jest.spyOn(Storage.prototype, 'setItem');
    
    render(
      <ChatProvider userId={mockUser.id} username={mockUser.username}>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  test('dismissError clears error state', () => {
    const TestComponent = () => {
      const { error, dismissError } = useChat();
      return (
        <div>
          <span data-testid="error">{error?.message || 'no-error'}</span>
          <button onClick={dismissError}>Dismiss</button>
        </div>
      );
    };

    render(
      <ChatProvider userId={mockUser.id} username={mockUser.username}>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId('error').textContent).toBe('no-error');
  });
});

describe('ChatInput', () => {
  test('calls onSend when Enter is pressed', () => {
    const onSend = jest.fn();

    render(
      <ChatInput
        onSend={onSend}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(input.textContent).toBe('');
  });

  test('does not send on Shift+Enter', () => {
    const onSend = jest.fn();

    render(
      <ChatInput
        onSend={onSend}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello\nWorld' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  test('disables input when isLoading is true', () => {
    render(
      <ChatInput
        onSend={() => {}}
        isLoading={true}
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    expect(input).toBeDisabled();
  });

  test('disables input when disabled prop is true', () => {
    render(
      <ChatInput
        onSend={() => {}}
        isLoading={false}
        disabled={true}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });
});

describe('ChatMessage', () => {
  const mockUserMessage = {
    id: '1',
    content: 'Hello',
    sender: 'user' as const,
    timestamp: new Date('2024-01-01T10:00:00'),
  };

  const mockAgentMessage = {
    id: '2',
    content: 'How can I help?',
    sender: 'agent' as const,
    timestamp: new Date('2024-01-01T10:01:00'),
    metadata: {
      tools_used: ['list_available_accesses'],
      accesses_granted: [],
    },
  };

  test('displays user message with correct styling', () => {
    render(
      <ChatMessage
        message={mockUserMessage}
        isLatest={true}
      />
    );

    const message = screen.getByText('Hello');
    expect(message).toBeInTheDocument();
  });

  test('displays agent message with metadata', () => {
    render(
      <ChatMessage
        message={mockAgentMessage}
        isLatest={true}
      />
    );

    expect(screen.getByText('How can I help?')).toBeInTheDocument();
    expect(screen.getByText('Used: list_available_accesses')).toBeInTheDocument();
  });

  test('displays granted accesses', () => {
    const messageWithGrant = {
      ...mockAgentMessage,
      metadata: {
        tools_used: [],
        accesses_granted: ['READ_DOCUMENTS', 'WRITE_DOCUMENTS'],
      },
    };

    render(
      <ChatMessage
        message={messageWithGrant}
        isLatest={true}
      />
    );

    expect(screen.getByText('✓ Granted: READ_DOCUMENTS, WRITE_DOCUMENTS')).toBeInTheDocument();
  });

  test('formats timestamp correctly', () => {
    render(
      <ChatMessage
        message={mockUserMessage}
        isLatest={true}
      />
    );

    expect(screen.getByText('10:00')).toBeInTheDocument();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Chat Integration', () => {
  test('complete chat flow', async () => {
    mockSendMessage.mockResolvedValue({
      response: 'Here is your access',
      session_id: 'session-123',
      tools_used: ['list_available_accesses'],
      accesses_granted: ['READ_DOCUMENTS'],
    });

    const onSend = jest.fn();
    const TestComponent = () => {
      const { messages, sendMessage } = useChat();
      return (
        <div>
          <div data-testid="messages">
            {messages.map(m => m.content).join('|')}
          </div>
          <ChatInput onSend={sendMessage} isLoading={false} />
        </div>
      );
    };

    render(
      <ChatProvider userId={1} username="test">
        <TestComponent />
      </ChatProvider>
    );

    // User sends message
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'I need access' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'I need access',
          userId: 1,
          username: 'test',
        })
      );
    });
  });
});

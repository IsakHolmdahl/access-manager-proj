# Data Model: Frontend Chat Interface

**Feature**: 003-frontend-chat  
**Date**: 2026-02-13

## TypeScript Models

### ChatMessage

Represents a single message in the conversation.

```typescript
interface ChatMessage {
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
```

### AccessSuggestion

Represents a suggested access that the agent presents.

```typescript
interface AccessSuggestion {
  id: number;
  name: string;
  description: string;
}
```

### ChatSession

Represents a conversation session.

```typescript
interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}
```

### ChatState

Represents the current state of the chat.

```typescript
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  suggestedAccesses: AccessSuggestion[];
  sessionId: string | null;
}
```

### API Request/Response

#### ChatRequest (sent to agent API)

```typescript
interface ChatRequest {
  message: string;
  session_id?: string;
  user_id: number;
  username: string;
}
```

#### ChatResponse (received from agent API)

```typescript
interface ChatResponse {
  response: string;
  session_id?: string;
  tools_used: string[];
  accesses_granted: string[];
}
```

## State Management

### ChatContext

React Context for managing chat state across components.

```typescript
interface ChatContextValue {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  isLoading: boolean;
  error: string | null;
}
```

### LocalStorage Keys

- `chat_messages`: Array of ChatMessage objects
- `chat_session_id`: Current session ID
- `chat_history`: Array of past ChatSession objects (for history view)

## Component State

### ChatWindow

- `messages`: Array of ChatMessage to display
- `scrollToBottom`: Function to auto-scroll
- `showHistory`: Boolean for showing history panel

### ChatInput

- `message`: Current input value
- `isDisabled`: Boolean during loading

### AccessCard

- `access`: AccessSuggestion to display
- `isGranting`: Boolean during access grant
- `onGrant`: Callback when access is granted

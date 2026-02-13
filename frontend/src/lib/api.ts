/**
 * API client for the Access Management Agent
 * Feature: 003-frontend-chat
 */

import { ChatRequest, ChatResponse, SendMessageParams, ChatError } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

/**
 * Send a message to the agent and get a response
 */
export async function sendMessage(params: SendMessageParams): Promise<ChatResponse> {
  const { message, userId, username, sessionId } = params;

  const request: ChatRequest = {
    message,
    user_id: userId,
    username,
    ...(sessionId && { session_id: sessionId }),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 503) {
        throw createChatError(
          'The agent service is temporarily unavailable. Please try again.',
          'server',
          true
        );
      } else if (response.status === 422) {
        throw createChatError(
          'Invalid request. Please check your message and try again.',
          'validation',
          false
        );
      } else if (response.status >= 500) {
        throw createChatError(
          'Server error. Please try again later.',
          'server',
          true
        );
      } else {
        throw createChatError(
          `Request failed with status ${response.status}`,
          'unknown',
          true
        );
      }
    }

    return await response.json();
  } catch (error) {
    // If it's already a ChatError, rethrow it
    if (isChatError(error)) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw createChatError(
        'Unable to connect to the agent service. Please check your connection.',
        'network',
        true
      );
    }

    // Handle other errors
    throw createChatError(
      'An unexpected error occurred. Please try again.',
      'unknown',
      true
    );
  }
}

/**
 * Check the health of the agent service
 */
export async function checkAgentHealth(): Promise<{
  status: string;
  backend_api_status: string;
  bedrock_status: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/health`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  } catch (error) {
    return {
      status: 'unhealthy',
      backend_api_status: 'unreachable',
      bedrock_status: 'not_configured',
    };
  }
}

/**
 * Create a ChatError object
 */
function createChatError(
  message: string,
  type: ChatError['type'],
  retryable: boolean
): ChatError {
  return {
    message,
    type,
    retryable,
  };
}

/**
 * Check if an error is a ChatError
 */
function isChatError(error: unknown): error is ChatError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'type' in error &&
    'retryable' in error
  );
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ChatError): string {
  switch (error.type) {
    case 'network':
      return `Connection Error: ${error.message}`;
    case 'validation':
      return `Invalid Request: ${error.message}`;
    case 'server':
      return `Server Error: ${error.message}`;
    default:
      return `Error: ${error.message}`;
  }
}

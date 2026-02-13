/**
 * Chat Page Layout
 * Feature: 003-frontend-chat
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat with AI Assistant - Access Management',
  description: 'Chat with the AI assistant to request and discover access permissions',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

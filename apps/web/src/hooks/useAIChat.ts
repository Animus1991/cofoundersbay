'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useApiAvailability } from '@/hooks/useApiAvailability';
import {
  ChatMessage,
  AgentConfig,
  streamAIChat,
  sendAIChat,
  getAIAgents,
  getAIHealth,
  createAIConversation,
  AIConversation,
  isAIStreamUnsupported,
} from '@/lib/ai-api';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  fallback?: boolean;
  isStreaming?: boolean;
}

export interface UseAIChatOptions {
  agentId?: string;
  conversationId?: string;
  autoCreateConversation?: boolean;
}

export interface UseAIChatReturn {
  messages: AIMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  agents: AgentConfig[];
  currentAgent: string;
  isAIAvailable: boolean;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  setAgent: (agentId: string) => void;
  clearMessages: () => void;
  retryLastMessage: () => void;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const { hasSession, mounted } = useSession();
  const apiAvailable = useApiAvailability();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [currentAgent, setCurrentAgent] = useState(options.agentId || 'general');
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(options.conversationId || null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);

  // Check AI health and load agents on mount
  useEffect(() => {
    if (!hasSession || !mounted || !apiAvailable) return;

    const init = async () => {
      try {
        const [health, agentsData] = await Promise.all([
          getAIHealth().catch(() => ({ available: false, models: [] })),
          getAIAgents().catch(() => ({ agents: [] })),
        ]);
        
        setIsAIAvailable(Boolean(health?.available));
        setAgents(agentsData?.agents ?? []);
      } catch {
        setIsAIAvailable(false);
      }
    };

    init();
  }, [hasSession, mounted, apiAvailable]);

  // Create conversation if needed
  useEffect(() => {
    if (!hasSession || !mounted || conversationId || !options.autoCreateConversation) return;

    createAIConversation({ agentId: currentAgent })
      .then((res) => setConversationId(res.conversation.id))
      .catch(() => {/* Silent fail - will work without conversation tracking */});
  }, [hasSession, mounted, conversationId, currentAgent, options.autoCreateConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || abortControllerRef.current) return;

    // Cancel any existing request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const isCurrent = () => abortControllerRef.current === controller && !controller.signal.aborted;
    setError(null);
    lastUserMessageRef.current = content;

    // Add user message immediately
    const turnId = crypto.randomUUID();
    const userMessage: AIMessage = {
      id: `user-${turnId}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create placeholder for assistant response
    const assistantMessageId = `assistant-${turnId}`;
    const assistantMessage: AIMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsStreaming(true);

    // Build history from messages
    const history: ChatMessage[] = conversationId ? [] : messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const request = { message: content.trim(), agentId: currentAgent, conversationId: conversationId || undefined, history };
    let fullContent = '';
    let finalModel = '';
    let fallback = false;
    let receivedEvent = false;

    try {
      // Try streaming first
      try {
        for await (const data of streamAIChat(request, controller.signal)) {
          if (!isCurrent()) return;
          receivedEvent = true;
          if (data.fallback) {
            fullContent = data.chunk ?? '';
            fallback = true;
            finalModel = data.model || 'fallback';
          } else {
            fullContent += data.chunk ?? '';
            finalModel = data.model || finalModel;
          }
          setMessages((prev) => prev.map((message) => message.id === assistantMessageId
            ? { ...message, content: fullContent, model: finalModel, fallback } : message));
          if (data.done) break;
        }
      } catch (streamError) {
        // If streaming fails, fall back to non-streaming
        if (!isCurrent() || receivedEvent || !isAIStreamUnsupported(streamError)) throw streamError;
        const response = await sendAIChat(request, controller.signal);
        fullContent = response.message;
        finalModel = response.model;
        fallback = response.fallback ?? false;
      }

      if (!isCurrent()) return;
      // Finalize message
      setMessages((prev) => prev.map((message) => message.id === assistantMessageId
        ? { ...message, content: fullContent, model: finalModel, fallback, isStreaming: false } : message));
    } catch (err) {
      if (!isCurrent()) return;
      const requestError = err instanceof Error || err instanceof DOMException ? err : null;
      if (requestError?.name === 'AbortError') {
        // Remove the empty assistant message on abort
        setMessages((prev) => prev.filter((message) => message.id !== assistantMessageId));
        return;
      }

      setError(requestError?.message || 'Failed to get AI response');
      // Update assistant message with error
      setMessages((prev) => prev.map((message) => message.id === assistantMessageId
        ? { ...message, content: fullContent || 'Sorry, I encountered an error. Please try again.', model: finalModel, fallback, isStreaming: false }
        : message));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    }
  }, [messages, currentAgent, conversationId]);

  const setAgent = useCallback((agentId: string) => {
    setCurrentAgent(agentId);
    // Optionally clear messages when switching agents
    // setMessages([]);
  }, []);

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    lastUserMessageRef.current = null;
    setIsStreaming(false);
    setMessages([]);
    setError(null);
    setConversationId(null);
  }, []);

  const retryLastMessage = useCallback(() => {
    if (lastUserMessageRef.current) {
      // Remove last assistant message if it was an error
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.content.includes('error')) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    agents,
    currentAgent,
    isAIAvailable,
    conversationId,
    sendMessage,
    setAgent,
    clearMessages,
    retryLastMessage,
  };
}

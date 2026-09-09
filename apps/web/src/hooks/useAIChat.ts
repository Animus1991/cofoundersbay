'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import {
  ChatMessage,
  AgentConfig,
  streamAIChat,
  sendAIChat,
  getAIAgents,
  getAIHealth,
  createAIConversation,
  AIConversation,
} from '@/lib/ai-api';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
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
    if (!hasSession || !mounted) return;

    const init = async () => {
      try {
        const [health, agentsData] = await Promise.all([
          getAIHealth().catch(() => ({ available: false, models: [] })),
          getAIAgents().catch(() => ({ agents: [] })),
        ]);

        setIsAIAvailable(Boolean(health?.available));
        // The `.catch` above only covers a rejection. A 200 whose body is
        // missing `agents` — a partial rollout, a proxy interstitial, an older
        // API build — used to put `undefined` into state, and the consumers
        // call `agents.find(...)` unguarded. Because UnifiedChatPopup is
        // mounted globally, that single undefined took down every
        // authenticated page in the product.
        setAgents(Array.isArray(agentsData?.agents) ? agentsData.agents : []);
      } catch {
        setIsAIAvailable(false);
        setAgents([]);
      }
    };

    init();
  }, [hasSession, mounted]);

  // Create conversation if needed
  useEffect(() => {
    if (!hasSession || !mounted || conversationId || !options.autoCreateConversation) return;

    createAIConversation({ agentId: currentAgent })
      .then((res) => setConversationId(res.conversation.id))
      .catch(() => {/* Silent fail - will work without conversation tracking */});
  }, [hasSession, mounted, conversationId, currentAgent, options.autoCreateConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    lastUserMessageRef.current = content;

    // Add user message immediately
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create placeholder for assistant response
    const assistantMessageId = `assistant-${Date.now()}`;
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
    const history: ChatMessage[] = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      // Cancel any existing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      let fullContent = '';
      let finalModel = '';

      // Try streaming first
      try {
        for await (const data of streamAIChat(
          {
            message: content,
            agentId: currentAgent,
            conversationId: conversationId || undefined,
            history,
          },
          abortControllerRef.current.signal,
        )) {
          if (data.chunk) {
            fullContent += data.chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: fullContent }
                  : m
              )
            );
          }
          if (data.done) {
            finalModel = data.model || '';
            break;
          }
        }
      } catch (streamError: any) {
        // If streaming fails, fall back to non-streaming
        if (streamError.name !== 'AbortError') {
          const response = await sendAIChat({
            message: content,
            agentId: currentAgent,
            conversationId: conversationId || undefined,
            history,
          });
          fullContent = response.message;
          finalModel = response.model;
        } else {
          throw streamError;
        }
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: fullContent, model: finalModel, isStreaming: false }
            : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Remove the empty assistant message on abort
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
        return;
      }

      setError(err.message || 'Failed to get AI response');
      // Update assistant message with error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { 
                ...m, 
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, currentAgent, conversationId, isStreaming]);

  const setAgent = useCallback((agentId: string) => {
    setCurrentAgent(agentId);
    // Optionally clear messages when switching agents
    // setMessages([]);
  }, []);

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort();
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

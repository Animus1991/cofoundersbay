'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { usePageContext } from '@/hooks/usePageContext';
import {
  AgentConfig,
  sendAIChat,
  getAIAgents,
  getAIHealth,
  createAIConversation,
  getAIConversation,
  listAIConversations,
  AIConversation,
} from '@/lib/ai-api';
import { isPreviewDemo } from '@/lib/preview-demo';
import { executeCopilotAction, runCopilotTurn } from '@/lib/copilot-engine';
import type { CopilotAction, CopilotCitation } from '@/lib/copilot-types';
import { CONNECTION_KEYS, MESSAGE_KEYS, queryKeys } from '@/lib/query-keys';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  isStreaming?: boolean;
  actions?: CopilotAction[];
  citations?: CopilotCitation[];
}

export interface UseAIChatOptions {
  agentId?: string;
  conversationId?: string;
  autoCreateConversation?: boolean;
  initialPrompt?: string;
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
  conversations: AIConversation[];
  pendingActionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  setAgent: (agentId: string) => void;
  clearMessages: () => void;
  retryLastMessage: () => void;
  confirmAction: (action: CopilotAction) => Promise<{ href?: string } | void>;
  dismissAction: (action: CopilotAction) => void;
  loadConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const { hasSession, mounted } = useSession();
  const pageContext = usePageContext();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [currentAgent, setCurrentAgent] = useState(options.agentId || 'general');
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(options.conversationId || null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const lastUserMessageRef = useRef<string | null>(null);
  const seededRef = useRef(false);
  const autoCreate = options.autoCreateConversation !== false;

  useEffect(() => {
    if (!hasSession || !mounted) return;

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

    void init();
  }, [hasSession, mounted]);

  const refreshConversations = useCallback(async () => {
    if (!hasSession) return;
    try {
      const res = await listAIConversations();
      setConversations(res.conversations ?? []);
    } catch {
      /* preview or offline */
    }
  }, [hasSession]);

  useEffect(() => {
    if (!hasSession || !mounted) return;
    void refreshConversations();
  }, [hasSession, mounted, refreshConversations]);

  useEffect(() => {
    if (!hasSession || !mounted || conversationId || !autoCreate) return;

    createAIConversation({ agentId: currentAgent })
      .then((res) => {
        if (res?.conversation?.id) setConversationId(res.conversation.id);
      })
      .catch(() => {
        /* works without persistence */
      });
  }, [hasSession, mounted, conversationId, currentAgent, autoCreate]);

  const mapHistory = (conv: AIConversation): AIMessage[] =>
    (conv.messages ?? [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt),
        model: m.model,
      }));

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await getAIConversation(id);
      if (res?.conversation) {
        setConversationId(res.conversation.id);
        setMessages(mapHistory(res.conversation));
      }
    } catch {
      setError('Could not load that conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAction = useCallback((actionId: string, patch: Partial<CopilotAction>) => {
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        actions: m.actions?.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
      })),
    );
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    lastUserMessageRef.current = content;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);
    setIsStreaming(true);

    try {
      const turn = await runCopilotTurn(content.trim(), pageContext);
      let narrative = turn.message;

      if (!isPreviewDemo() && isAIAvailable) {
        try {
          const llm = await sendAIChat({
            message: content.trim(),
            agentId: currentAgent,
            conversationId: conversationId || undefined,
            context: {
              ...pageContext,
              toolNarrative: turn.message,
              usedTools: turn.usedTools,
            },
          });
          if (llm?.message) narrative = llm.message;
        } catch {
          /* keep tool narrative */
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: narrative,
                model: isAIAvailable && !isPreviewDemo() ? 'copilot+llm' : 'copilot',
                isStreaming: false,
                actions: turn.actions,
                citations: turn.citations,
              }
            : m,
        ),
      );
      void refreshConversations();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false,
              }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId, currentAgent, isAIAvailable, isStreaming, pageContext, refreshConversations]);

  const confirmAction = useCallback(async (action: CopilotAction) => {
    setPendingActionId(action.id);
    const result = await executeCopilotAction(action);
    setPendingActionId(null);
    if (!result.ok) {
      updateAction(action.id, { status: 'error' });
      setError(result.error ?? 'Action failed');
      return;
    }
    updateAction(action.id, { status: 'done' });
    if (action.tool === 'send_connection') {
      CONNECTION_KEYS.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: [...key] });
      });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.graphMe] });
    }
    if (action.tool === 'start_or_send_message') {
      MESSAGE_KEYS.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: [...key] });
      });
    }
    return { href: result.href };
  }, [queryClient, updateAction]);

  const dismissAction = useCallback((action: CopilotAction) => {
    updateAction(action.id, { status: 'dismissed' });
  }, [updateAction]);

  const setAgent = useCallback((agentId: string) => {
    setCurrentAgent(agentId);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setConversationId(null);
  }, []);

  const retryLastMessage = useCallback(() => {
    if (lastUserMessageRef.current) {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant') return prev.slice(0, -1);
        return prev;
      });
      void sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  useEffect(() => {
    if (!mounted || !hasSession || seededRef.current || !options.initialPrompt) return;
    seededRef.current = true;
    void sendMessage(options.initialPrompt);
  }, [mounted, hasSession, options.initialPrompt, sendMessage]);

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    agents,
    currentAgent,
    isAIAvailable,
    conversationId,
    conversations,
    pendingActionId,
    sendMessage,
    setAgent,
    clearMessages,
    retryLastMessage,
    confirmAction,
    dismissAction,
    loadConversation,
    refreshConversations,
  };
}

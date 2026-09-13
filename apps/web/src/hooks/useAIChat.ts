'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function useOptionalQueryClient() {
  try {
    return useQueryClient();
  } catch {
    return undefined;
  }
}
import { useSession } from '@/hooks/useSession';
import { useApiAvailability } from '@/hooks/useApiAvailability';
import {
  AgentConfig,
  sendAIChat,
  getAIAgents,
  getAIHealth,
  createAIConversation,
  getAIConversation,
  listAIConversations,
  AIConversation,
  isAIStreamUnsupported,
  streamAIChat,
  type ChatRequest,
  type ChatMessage,
} from '@/lib/ai-api';
import { isPreviewDemo } from '@/lib/preview-demo';
import { executeCopilotAction, runCopilotTurn, type PageContextPacket } from '@/lib/copilot-engine';
import { isUndoable, undoAction as runUndo } from '@/lib/action-registry';
import type { CopilotAction, CopilotCitation, CopilotTurnResult } from '@/lib/copilot-types';
import { CONNECTION_KEYS, MESSAGE_KEYS, queryKeys } from '@/lib/query-keys';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  fallback?: boolean;
  isStreaming?: boolean;
  actions?: CopilotAction[];
  citations?: CopilotCitation[];
}

export interface UseAIChatOptions {
  agentId?: string;
  conversationId?: string;
  autoCreateConversation?: boolean;
  initialPrompt?: string;
  enableCopilot?: boolean;
  pageContext?: PageContextPacket;
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
  /** Resolves `false` when the action declares no undo, so the caller can say so. */
  undoAction: (action: CopilotAction) => Promise<boolean>;
  dismissAction: (action: CopilotAction) => void;
  loadConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const { hasSession, mounted } = useSession();
  const apiAvailable = useApiAvailability();
  const queryClient = useOptionalQueryClient();
  const pageContext = options.pageContext;
  const enableCopilot = options.enableCopilot ?? false;

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoCreate = options.autoCreateConversation !== false;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

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

    void init();
  }, [hasSession, mounted, apiAvailable]);

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

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || abortControllerRef.current) return;

      // Cancel any existing request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const isCurrent = () => abortControllerRef.current === controller && !controller.signal.aborted;
      setError(null);
      lastUserMessageRef.current = content;
      let receivedEvent = false;

      const turnId = crypto.randomUUID();
      const userMessage: AIMessage = {
        id: `user-${turnId}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

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

      try {
        let turn: CopilotTurnResult | undefined;

        if (enableCopilot) {
          try {
            turn = await runCopilotTurn(content.trim(), pageContext);
            if (!isCurrent()) return;
          } catch {
            /* proceed without copilot tools */
          }
        }

        const narrative = turn?.message ?? '';
        const actions = turn?.actions;
        const citations = turn?.citations;

        if (isAIAvailable && !isPreviewDemo()) {
          const history: ChatMessage[] = conversationId
            ? []
            : messages.slice(-8).map((m) => ({
                role: m.role,
                content: m.content,
              }));
          const request: ChatRequest = {
            message: content.trim(),
            agentId: currentAgent,
            conversationId: conversationId || undefined,
            history,
            context: {
              ...pageContext,
              toolNarrative: narrative,
              usedTools: turn?.usedTools ?? [],
            },
          };
          let fullContent = '';
          let finalModel = '';
          let fallback = false;

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
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? { ...message, content: fullContent, model: finalModel, fallback }
                    : message,
                ),
              );
              if (data.done) break;
            }
          } catch (streamError) {
            // If streaming fails, fall back to non-streaming only when no content was received
            if (!isCurrent() || receivedEvent || !isAIStreamUnsupported(streamError)) throw streamError;
            const response = await sendAIChat(request, controller.signal);
            fullContent = response.message;
            finalModel = response.model;
            fallback = response.fallback ?? false;
          }

          if (!isCurrent()) return;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? { ...message, content: fullContent, model: finalModel, fallback, isStreaming: false, actions, citations }
                : message,
            ),
          );
        } else {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? { ...message, content: narrative, model: 'copilot', isStreaming: false, actions, citations }
                : message,
            ),
          );
        }

        void refreshConversations();
      } catch (err) {
        if (!isCurrent()) return;
        const requestError = err instanceof Error || err instanceof DOMException ? err : null;
        if (requestError?.name === 'AbortError') {
          // Remove the empty assistant message on abort
          setMessages((prev) => prev.filter((message) => message.id !== assistantMessageId));
          return;
        }

        setError(requestError?.message || 'Failed to get AI response');
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: receivedEvent ? message.content : 'Sorry, I encountered an error. Please try again.',
                  isStreaming: false,
                }
              : message,
          ),
        );
      } finally {
        if (abortControllerRef.current === controller) {
          setIsStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [messages, currentAgent, conversationId, isAIAvailable, pageContext, refreshConversations, enableCopilot],
  );

  /**
   * The caches a tool touches. Undo writes to the same rows as the action it
   * reverses, so both paths refresh the same keys -- an undo that left the old
   * value on screen would read as a failed undo.
   */
  const invalidateFor = useCallback(
    (tool: CopilotAction['tool']) => {
      if (!queryClient || isPreviewDemo()) return;
      if (tool === 'send_connection') {
        CONNECTION_KEYS.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: [...key] });
        });
        void queryClient.invalidateQueries({ queryKey: [...queryKeys.graphMe] });
      }
      if (tool === 'start_or_send_message') {
        MESSAGE_KEYS.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: [...key] });
        });
      }
      if (tool === 'shortlist_add') {
        void queryClient.invalidateQueries({ queryKey: [...queryKeys.shortlist] });
        void queryClient.invalidateQueries({ queryKey: [...queryKeys.shortlistIds] });
      }
    },
    [queryClient],
  );

  const confirmAction = useCallback(
    async (action: CopilotAction) => {
      if (pendingActionId) return;
      setPendingActionId(action.id);
      try {
        const result = await executeCopilotAction(action);
        invalidateFor(action.tool);
        if (!result.ok) {
          updateAction(action.id, { status: 'error' });
          setError(result.error ?? 'Action failed');
          return;
        }
        updateAction(action.id, { status: 'done' });
        return { href: result.href };
      } finally {
        setPendingActionId(null);
      }
    },
    [invalidateFor, updateAction, pendingActionId],
  );

  /**
   * Only ever called for an action whose registry entry declares an undo. The
   * registry refuses the rest rather than attempting a best-effort reversal, so
   * a `false` here means "this genuinely cannot be taken back", not "it failed".
   */
  const undoAction = useCallback(
    async (action: CopilotAction) => {
      if (pendingActionId) return false;
      if (!isUndoable(action.tool)) return false;

      setPendingActionId(action.id);
      try {
        const payload: Record<string, unknown> = { ...(action.payload ?? {}) };
        const result = await runUndo(action.tool, payload);
        invalidateFor(action.tool);

        if (!result.ok) {
          setError(result.error ?? 'Undo failed');
          return false;
        }
        updateAction(action.id, { status: 'undone' });
        return true;
      } finally {
        setPendingActionId(null);
      }
    },
    [invalidateFor, updateAction, pendingActionId],
  );

  const dismissAction = useCallback(
    (action: CopilotAction) => {
      updateAction(action.id, { status: 'dismissed' });
    },
    [updateAction],
  );

  const setAgent = useCallback((agentId: string) => {
    setCurrentAgent(agentId);
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
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant') return prev.slice(0, -1);
        return prev;
      });
      void sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

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
    undoAction,
    dismissAction,
    loadConversation,
    refreshConversations,
  };
}

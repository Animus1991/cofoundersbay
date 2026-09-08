'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Loader2,
  Maximize2,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAgentIcon } from '@/lib/ai-api';
import { useAIChat, type AIMessage } from '@/hooks/useAIChat';
import { usePageContext } from '@/hooks/usePageContext';
import { ActionCard } from '@/components/ai/ActionCard';
import { CitationChip } from '@/components/ai/CitationChip';
import type { CopilotAction } from '@/lib/copilot-types';

const STARTERS = [
  'What should I do next?',
  'Find a technical cofounder in Athens',
  'Show my best matches',
  'Show my notifications',
  'Save Elena to my shortlist',
  'Connect with Elena',
];

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AssistantBody({
  message,
  pendingActionId,
  onConfirm,
  onDismiss,
}: {
  message: AIMessage;
  pendingActionId: string | null;
  onConfirm: (action: CopilotAction) => void;
  onDismiss: (action: CopilotAction) => void;
}) {
  const html = useMemo(() => {
    const escaped = message.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  }, [message.content]);

  return (
    <div className="space-y-2">
      {message.isStreaming && !message.content ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Working across your graph…
        </div>
      ) : (
        <div
          className="text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {message.citations && message.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {message.citations.map((c) => (
            <CitationChip key={`${c.type}-${c.id}`} citation={c} />
          ))}
        </div>
      )}
      {message.actions && message.actions.length > 0 && (
        <div className="grid gap-2 pt-1">
          {message.actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              busyId={pendingActionId}
              onConfirm={onConfirm}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type CopilotWorkspaceProps = {
  variant?: 'page' | 'popup';
  initialPrompt?: string;
  onExpand?: () => void;
};

export function CopilotWorkspace({
  variant = 'page',
  initialPrompt,
  onExpand,
}: CopilotWorkspaceProps) {
  const router = useRouter();
  const isPage = variant === 'page';
  const pageContext = usePageContext();
  const [input, setInput] = useState(initialPrompt ?? '');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chat = useAIChat({
    agentId: 'general',
    autoCreateConversation: true,
    enableCopilot: true,
    pageContext,
  });
  const agentList = chat.agents ?? [];
  const currentAgentConfig = agentList.find((a) => a.id === chat.currentAgent);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isStreaming]);

  const handleConfirm = async (action: CopilotAction) => {
    const result = await chat.confirmAction(action);
    if (result?.href && (action.tool === 'navigate' || action.tool === 'start_or_send_message')) {
      router.push(result.href);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chat.isStreaming) return;
    const value = input;
    setInput('');
    void chat.sendMessage(value);
  };

  return (
    <div className={cn('flex min-h-0 flex-1 overflow-hidden', isPage ? 'flex-col lg:flex-row' : 'flex-col')}>
      {isPage && (
        <aside className="flex w-full shrink-0 flex-col border-b border-border/60 bg-card/80 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
            <p className="text-sm font-semibold">Threads</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5"
              onClick={() => chat.clearMessages()}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chat.conversations.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                New conversations appear here after you send a message.
              </p>
            ) : (
              <ul className="space-y-1">
                {chat.conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => void chat.loadConversation(conv.id)}
                      className={cn(
                        'w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted/70',
                        chat.conversationId === conv.id && 'bg-primary/10 text-primary',
                      )}
                    >
                      <span className="line-clamp-2">{conv.title || 'New conversation'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => router.push('/settings/ai')}
            >
              <Settings className="h-4 w-4" />
              AI preferences
            </Button>
          </div>
        </aside>
      )}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs text-white">
              {getAgentIcon(chat.currentAgent)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {currentAgentConfig?.name || 'CoFounderBay Assistant'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {chat.isAIAvailable ? 'Live model + platform tools' : 'Platform copilot · tools online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {agentList.length > 1 && (
              <select
                value={chat.currentAgent}
                onChange={(e) => chat.setAgent(e.target.value)}
                className="h-8 max-w-[9rem] rounded-md border border-border bg-background px-2 text-xs"
                aria-label="AI agent"
              >
                {agentList.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            )}
            {chat.messages.length > 0 && (
              <>
                <button type="button" onClick={chat.retryLastMessage} className="rounded-md p-1.5 hover:bg-muted" title="Retry">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button type="button" onClick={chat.clearMessages} className="rounded-md p-1.5 hover:bg-muted" title="Clear">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </>
            )}
            {onExpand && (
              <button type="button" onClick={onExpand} className="rounded-md p-1.5 hover:bg-muted" title="Open full page">
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {chat.messages.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col gap-4 py-6">
              <div className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 text-sm">
                  I can search the network, explain matches, send intros, open threads, and jump to any page — using the same data as the rest of CoFounderBay. Writes wait for your confirm.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void chat.sendMessage(q)}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chat.messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'justify-end')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[11px] text-white">
                    {getAgentIcon(chat.currentAgent)}
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[min(100%,36rem)] rounded-2xl px-3 py-2',
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-muted/70',
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <AssistantBody
                      message={msg}
                      pendingActionId={chat.pendingActionId}
                      onConfirm={(a) => void handleConfirm(a)}
                      onDismiss={chat.dismissAction}
                    />
                  )}
                  <p className={cn('mt-1 text-[10px]', msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {chat.error && (
          <p className="px-3 text-xs text-destructive">{chat.error}</p>
        )}

        <form onSubmit={onSubmit} className="border-t border-border/60 p-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI to search, intro, message, or navigate…"
              className="h-10 flex-1 rounded-full border-0 bg-muted/50 px-4 text-sm focus-visible:ring-1 focus-visible:ring-violet-500"
              disabled={chat.isStreaming}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chat.isStreaming}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              aria-label="Send"
            >
              {chat.isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Tools use your real Connections, Matches, and Messages APIs. Destructive steps need confirm.
          </p>
        </form>
      </section>
    </div>
  );
}

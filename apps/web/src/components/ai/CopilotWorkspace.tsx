'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Copy,
  Loader2,
  List,
  Maximize2,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { CfbGlyph, glyphForHref } from '@/components/icons/CfbGlyph';
import { cn } from '@/lib/utils';
import { getAgentGlyph } from '@/lib/ai-api';
import { useAIChat, type AIMessage } from '@/hooks/useAIChat';
import { usePageContext } from '@/hooks/usePageContext';
import { ActionCard } from '@/components/ai/ActionCard';
import { CopilotEmptyState } from '@/components/ai/CopilotEmptyState';
import { CitationChip } from '@/components/ai/CitationChip';
import { PageContextualHelp } from '@/components/common/PageContextualHelp';
import type { CopilotAction } from '@/lib/copilot-types';
import { getActionSpec } from '@/lib/action-registry';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';
import { BilingualText } from '@/components/common/BilingualText';
import { useBilingualString, useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { bilingualAria, formatLocalTime } from '@/lib/i18n/format';
import { COPILOT_PRODUCT_LINKS } from '@/lib/copilot-starters';
import { followUpsFor } from '@/lib/copilot-followups';
import { getPageMeta } from '@/lib/page-registry';

/** The message clock, 24-hour in both languages (formatLocalTime). */
function formatTime(d: Date, language: 'en' | 'el') {
  return formatLocalTime(d, language);
}

/** The answer as plain text: what Copy puts on the clipboard, without the bold markers. */
function plainAnswer(content: string): string {
  return content.replace(/\*\*(.+?)\*\*/g, '$1').trim();
}

/**
 * Copy under an answer, as in GitHub Copilot Chat: a check for two seconds
 * says it worked, and nothing else moves.
 */
function CopyAnswer({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(plainAnswer(content)).then(() => setCopied(true), () => undefined)}
      className="tap-target inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      title={copied ? bilingualAria('Copied', 'Αντιγράφηκε') : bilingualAria('Copy answer', 'Αντιγραφή απάντησης')}
      aria-label={copied ? bilingualAria('Copied', 'Αντιγράφηκε') : bilingualAria('Copy answer', 'Αντιγραφή απάντησης')}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  );
}

function AssistantBody({
  message,
  pendingActionId,
  onConfirm,
  onDismiss,
  onUndo,
  onRetry,
}: {
  message: AIMessage;
  pendingActionId: string | null;
  onConfirm: (action: CopilotAction) => void;
  onDismiss: (action: CopilotAction) => void;
  onUndo: (action: CopilotAction) => void;
  onRetry: () => void;
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
        <div className="type-ui flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <BilingualText en="Working across your graph…" el="Εργασία στο γράφο σας…" compact />
        </div>
      ) : message.failed ? (
        // Nothing arrived: say so in the reader's language, with the way on.
        <div className="type-identity space-y-1.5 text-foreground">
          <p><BilingualText en="I could not answer this time. Your question is kept; try again." el="Δεν μπόρεσα να απαντήσω αυτή τη φορά. Η ερώτησή σας κρατήθηκε· δοκιμάστε ξανά." wrap /></p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            <BilingualText en="Try again" el="Δοκιμή ξανά" compact />
          </Button>
        </div>
      ) : (
        <SanitizedHtml
          className="type-identity leading-relaxed text-foreground"
          html={html}
        />
      )}
      {message.stopped ? (
        <p className="type-caption text-muted-foreground"><BilingualText en="Stopped. What had arrived is above." el="Σταμάτησε. Ό,τι είχε φτάσει είναι παραπάνω." compact wrap /></p>
      ) : null}
      {message.citations && message.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {message.citations.map((c) => (
            <CitationChip key={`${c.type}-${c.id}`} citation={c} />
          ))}
        </div>
      )}
      {message.actions && message.actions.length > 0 && (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {message.actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              busyId={pendingActionId}
              onConfirm={onConfirm}
              onDismiss={onDismiss}
              onUndo={onUndo}
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
  /**
   * A question to send as soon as the assistant is ready - the header's Ask
   * AI bar hands its question here, so it is asked on the page it came from.
   * Sent once; `onAutoPromptSent` clears it at the source.
   */
  autoPrompt?: string | null;
  onAutoPromptSent?: () => void;
};

export function CopilotWorkspace({
  variant = 'page',
  initialPrompt,
  onExpand,
  autoPrompt,
  onAutoPromptSent,
}: CopilotWorkspaceProps) {
  const router = useRouter();
  const sayOne = useBilingualString();
  const { primary } = useLanguagePreference();
  const isPage = variant === 'page';
  const pageContext = usePageContext();
  const pageMeta = pageContext.route === '/ai' ? undefined : getPageMeta(pageContext.route);
  // The page the assistant reads with each question, shown as a chip the
  // reader can switch off (GitHub Copilot's implicit context). Off holds for
  // this page only: on the next page it reads again.
  const [pageLeftOut, setPageLeftOut] = useState<string | null>(null);
  const readsPage = pageLeftOut !== pageContext.route;
  const [input, setInput] = useState(initialPrompt ?? '');
  const [threadsOpen, setThreadsOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chat = useAIChat({
    agentId: 'general',
    autoCreateConversation: true,
    enableCopilot: true,
    pageContext: readsPage ? pageContext : undefined,
  });
  const agentList = chat.agents ?? [];
  const currentAgentConfig = agentList.find((a) => a.id === chat.currentAgent);

  useEffect(() => {
    if (chat.messages.length === 0) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isStreaming]);

  // Send a handed-over question once. Waits out a reply still streaming
  // rather than dropping the question.
  // `sentPrompt` makes it once even where effects run twice (development);
  // it resets when the prompt clears, so the same question can be asked again.
  const sentPrompt = useRef<string | null>(null);
  useEffect(() => {
    if (!autoPrompt) {
      sentPrompt.current = null;
      return;
    }
    if (chat.isStreaming || sentPrompt.current === autoPrompt) return;
    sentPrompt.current = autoPrompt;
    onAutoPromptSent?.();
    void chat.sendMessage(autoPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chat.sendMessage identity is not stable; the prompt is the trigger
  }, [autoPrompt, chat.isStreaming]);

  const handleConfirm = async (action: CopilotAction) => {
    const result = await chat.confirmAction(action);
    // Whether confirming takes you somewhere is declared with the action, not
    // listed here. This read the two tool ids that existed when it was written,
    // so any capability added afterwards returned an href this component threw
    // away. `shortlist_add` still returns `/shortlist` and still leaves you
    // where you are, because it declares `navigatesOnSuccess` false.
    if (result?.href && getActionSpec(action.tool)?.navigatesOnSuccess) {
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
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-1.5 lg:hidden">
          <button
            type="button"
            className="type-ui min-h-11 rounded-md px-2 text-left font-medium"
            aria-expanded={threadsOpen}
            onClick={() => setThreadsOpen((open) => !open)}
          >
            <BilingualText
              en={threadsOpen ? 'Hide threads' : 'Your threads'}
              el={threadsOpen ? 'Απόκρυψη νημάτων' : 'Τα νήματά σας'}
              compact
            />
          </button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="type-ui min-h-11 gap-1.5"
            onClick={() => {
              chat.clearMessages();
              setThreadsOpen(false);
              inputRef.current?.focus();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <BilingualText en="New question" el="Νέα ερώτηση" compact />
          </Button>
        </div>
      )}
      {isPage && (
        <aside className={cn(
          'w-full shrink-0 flex-col overflow-hidden border-b border-border bg-card/80 lg:flex lg:w-72 lg:max-h-none lg:border-b-0 lg:border-r',
          threadsOpen ? 'flex max-h-[38vh]' : 'hidden',
        )}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <p className="type-identity font-semibold">
              <BilingualText en="Threads" el="Νήματα" compact />
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="type-ui min-h-11 gap-1.5"
              onClick={() => {
                chat.clearMessages();
                inputRef.current?.focus();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <BilingualText en="New" el="Νέα" compact />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chat.conversations.length === 0 ? (
              <div className="space-y-4 px-1 py-2">
                <p className="type-caption text-muted-foreground">
                  {sayOne(
                    'Send a question — it becomes a thread here.',
                    'Στείλτε μια ερώτηση — γίνεται νήμα εδώ.',
                  )}
                </p>
                <div>
                  <p className="type-caption mb-1.5 font-medium uppercase tracking-wide text-muted-foreground">
                    {sayOne('I can read', 'Μπορώ να διαβάσω')}
                  </p>
                  <ul className="flex flex-col">
                    {COPILOT_PRODUCT_LINKS.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="type-ui flex min-h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-muted/70"
                        >
                          <CfbGlyph name={glyphForHref(link.href)} className="icon-sm shrink-0 text-muted-foreground" />
                          <BilingualText en={link.en} el={link.el} compact />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <ul className="space-y-1">
                {chat.conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => void chat.loadConversation(conv.id)}
                      className={cn(
                        'tap-target type-ui min-h-11 w-full rounded-lg px-2.5 py-2 text-left hover:bg-muted/70',
                        chat.conversationId === conv.id && 'bg-primary/10 text-primary-accessible',
                      )}
                    >
                      <span className="line-clamp-2">
                        {conv.title && conv.title !== 'New Conversation' && conv.title !== 'New conversation'
                          ? conv.title
                          : sayOne('New conversation', 'Νέα συνομιλία')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="type-ui h-auto min-h-11 w-full justify-start gap-2 py-1.5 md:min-h-9"
              onClick={() => router.push('/ai/capabilities')}
            >
              <List className="h-4 w-4 shrink-0" />
              <BilingualText en="What I can do" el="Τι μπορώ να κάνω" stacked className="min-w-0 text-left" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              // h-auto + stacked: the inline "AI preferences · Προτιμήσεις AI"
              // did not fit the 288px rail and clipped to "AI preferen…".
              className="type-ui h-auto min-h-11 w-full justify-start gap-2 py-1.5 md:min-h-9"
              onClick={() => router.push('/settings/ai')}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <BilingualText en="AI preferences" el="Προτιμήσεις AI" stacked className="min-w-0 text-left" />
            </Button>
          </div>
        </aside>
      )}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className={cn(
          'flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2',
          !isPage && 'max-sm:flex-wrap',
        )}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CfbGlyph name={getAgentGlyph(chat.currentAgent)} className="icon-sm" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              {isPage ? (
                <h1 className="type-identity truncate font-medium">
                  {currentAgentConfig?.name || 'CoFounderBay Assistant'}
                </h1>
              ) : (
                <p className="type-identity font-medium leading-snug sm:max-w-[9.5rem] sm:truncate">
                  {currentAgentConfig?.name || 'CoFounderBay Assistant'}
                </p>
              )}
              {isPage && (
              <p className="type-support truncate text-muted-foreground">
                {chat.isAIAvailable
                  ? sayOne('Live model · workspace tools', 'Ζωντανό μοντέλο · εργαλεία χώρου')
                  : sayOne('Built-in assistant · tools ready', 'Ενσωματωμένος βοηθός · εργαλεία έτοιμα')}
              </p>
              )}
            </div>
          </div>
          <div className={cn('flex items-center gap-1', !isPage && 'max-sm:basis-full')}>
            {isPage && <PageContextualHelp defaultOpen={false} compact />}
            {agentList.length > 1 && (
              <Select value={chat.currentAgent} onValueChange={(v) => chat.setAgent(v)}>
                <SelectTrigger
                  className="h-8 min-h-8 w-auto gap-1 px-2 type-ui"
                  aria-label={bilingualAria('AI agent', 'Πράκτορας AI')}
                >
                  {/* The heading beside this already names the current agent
                      in full; the trigger is the switch, so it says what it
                      does. Showing the name here cut "Βοηθός CoFounderBay" to
                      "Βοηθός…" in 144px, and the API's names run longer
                      ("Technical Strategy Advisor"). The list keeps them whole. */}
                  <SelectValue>{sayOne('Switch assistant', 'Αλλαγή βοηθού')}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {agentList.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id} className="type-ui">
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {chat.messages.length > 0 && (
              <>
                <button type="button" onClick={chat.retryLastMessage} className={cn('tap-target flex items-center justify-center rounded-xl hover:bg-muted', isPage ? 'h-11 w-11' : 'h-8 w-8')} title={bilingualAria('Retry', 'Επανάληψη')} aria-label={bilingualAria('Retry', 'Επανάληψη')}>
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button type="button" onClick={chat.clearMessages} className={cn('tap-target flex items-center justify-center rounded-xl hover:bg-muted', isPage ? 'h-11 w-11' : 'h-8 w-8')} title={bilingualAria('Clear', 'Καθαρισμός')} aria-label={bilingualAria('Clear', 'Καθαρισμός')}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </>
            )}
            {onExpand && (
                <button type="button" onClick={onExpand} className={cn('tap-target inline-flex items-center justify-center gap-1 rounded-xl px-2 hover:bg-muted', isPage ? 'h-11 w-11' : 'h-11 sm:h-8 sm:w-8 sm:px-0')} title={bilingualAria('Open full page', 'Άνοιγμα πλήρους σελίδας')} aria-label={bilingualAria('Open full page', 'Άνοιγμα πλήρους σελίδας')}>
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground sm:sr-only">
                  <BilingualText en="Full page" el="Πλήρης σελίδα" compact />
                </span>
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex-1 overflow-y-auto',
            chat.messages.length === 0
              ? 'flex flex-col p-3 sm:p-4 lg:px-6 lg:py-5'
              : 'space-y-3 p-3 sm:p-4 lg:px-6',
          )}
        >
          {chat.messages.length === 0 ? (
            <CopilotEmptyState
              surface={isPage ? 'page' : 'popup'}
              onAsk={(en) => void chat.sendMessage(en)}
              onOpenCapabilities={() => router.push('/ai/capabilities')}
            />
          ) : (
            chat.messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'justify-end')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <CfbGlyph name={getAgentGlyph(chat.currentAgent)} className="icon-sm" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2',
                    isPage ? 'max-w-[min(100%,48rem)]' : 'max-w-[min(100%,36rem)]',
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-muted/70',
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="type-identity">{msg.content}</p>
                  ) : (
                    <AssistantBody
                      message={msg}
                      pendingActionId={chat.pendingActionId}
                      onConfirm={(a) => void handleConfirm(a)}
                      onDismiss={chat.dismissAction}
                      onUndo={(a) => void chat.undoAction(a)}
                      onRetry={chat.retryLastMessage}
                    />
                  )}
                  <div className={cn('mt-1 flex items-center gap-1', msg.role === 'user' && 'justify-end')}>
                    <p className={cn('type-caption', msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {formatTime(msg.timestamp, primary)}
                    </p>
                    {msg.role === 'assistant' && !msg.isStreaming && msg.content ? <CopyAnswer content={msg.content} /> : null}
                  </div>
                </div>
              </div>
            ))
          )}
          {(() => {
            // What to ask next, under the latest answer only, and out of the
            // way while the reader is typing.
            const last = chat.messages[chat.messages.length - 1];
            if (!last || last.role !== 'assistant' || last.isStreaming || input.trim()) return null;
            const next = followUpsFor(last.usedTools, last.citations);
            if (!next.length) return null;
            return (
              <div className="flex flex-col items-start gap-1.5 pl-9" aria-label={bilingualAria('Ask next', 'Ρωτήστε μετά')} role="group">
                {next.map((f) => (
                  <Button key={f.en} type="button" size="sm" variant="outline" onClick={() => void chat.sendMessage(f.en)}>
                    <BilingualText en={f.en} el={f.el} compact wrap />
                  </Button>
                ))}
              </div>
            );
          })()}
          <div ref={endRef} />
        </div>

        {chat.error && (
          // The server's own words stay in the tooltip; the line is the reader's.
          <p className="type-caption px-3 text-destructive" title={chat.error}>
            <BilingualText en="The assistant could not finish. Check the connection and try again." el="Ο βοηθός δεν ολοκλήρωσε. Ελέγξτε τη σύνδεση και δοκιμάστε ξανά." compact wrap />
          </p>
        )}

        <form onSubmit={onSubmit} className="shrink-0 border-t border-border p-3">
          {/* One field, the way a composer holds its context: the page this
              question can see, the question, and the rule that a change waits.
              The edge is the neutral field colour and takes the link tone
              only while typing. On /ai the header already names the page. */}
          <div data-ask-frame="" className="rounded-md border border-input bg-card px-3 py-2">
            {pageMeta?.title ? (
              <div className="mb-1.5 flex">
                <button
                  type="button"
                  data-keep-icon=""
                  aria-pressed={readsPage}
                  onClick={() => setPageLeftOut(readsPage ? pageContext.route : null)}
                  className={cn(
                    'type-support inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-muted-foreground hover:text-foreground',
                    readsPage ? 'border-border' : 'border-dashed border-border opacity-70',
                  )}
                  title={readsPage
                    ? bilingualAria('The assistant reads this page with your question. Select to leave it out.', 'Ο βοηθός διαβάζει αυτή τη σελίδα μαζί με την ερώτησή σας. Επιλέξτε για να την αφήσει εκτός.')
                    : bilingualAria('Left out. Select to let the assistant read this page again.', 'Εκτός. Επιλέξτε για να τη διαβάζει ξανά ο βοηθός.')}
                >
                  <span className={cn('min-w-0 truncate', !readsPage && 'line-through')}>
                    <BilingualText
                      en={`This page · ${pageMeta.title}`}
                      el={`Αυτή η σελίδα · ${pageMeta.titleEl ?? pageMeta.title}`}
                      compact
                    />
                  </span>
                  {readsPage ? <X className="h-3 w-3 shrink-0" aria-hidden="true" /> : <Plus className="h-3 w-3 shrink-0" aria-hidden="true" />}
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                aria-label={sayOne('Ask AI', 'Ρωτήστε το AI')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={sayOne(
                  isPage
                    ? 'Search, intro, message, or go…'
                    : 'Search, intro, or go…',
                  isPage
                    ? 'Αναζήτηση, γνωριμία, μήνυμα ή μετάβαση…'
                    : 'Αναζήτηση, γνωριμία ή μετάβαση…',
                )}
                className="type-ui h-11 min-h-11 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:outline-none focus-visible:ring-0"
                disabled={chat.isStreaming}
              />
              {chat.isStreaming ? (
                // While an answer is being written, the send button is Stop
                // (GitHub Copilot Chat): what arrived stays, marked "Stopped".
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={chat.stopStreaming}
                  className="h-11 w-11 shrink-0 rounded-full"
                  title={bilingualAria('Stop answering', 'Διακοπή απάντησης')}
                  aria-label={bilingualAria('Stop answering', 'Διακοπή απάντησης')}
                >
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="h-11 w-11 shrink-0 rounded-full"
                  aria-label={bilingualAria('Send', 'Αποστολή')}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isPage || chat.messages.length > 0 ? (
              <p className="type-support mt-1.5 text-muted-foreground">
                <BilingualText
                  en="Changes wait for your confirmation."
                  el="Οι αλλαγές γίνονται μόνο με την επιβεβαίωσή σας."
                  compact
                  wrap
                />
                {!isPage && chat.messages.length > 0 ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="tap-target-y inline-flex items-center underline-offset-2 hover:underline"
                      onClick={() => router.push('/ai/capabilities')}
                    >
                      <BilingualText
                        en="See everything I can read and change"
                        el="Δείτε όλα όσα μπορώ να διαβάσω και να αλλάξω"
                        compact
                        wrap
                      />
                    </button>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

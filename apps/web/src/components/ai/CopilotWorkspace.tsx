'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  List,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { cn } from '@/lib/utils';
import { getAgentGlyph } from '@/lib/ai-api';
import { useAIChat, type AIMessage } from '@/hooks/useAIChat';
import { usePageContext } from '@/hooks/usePageContext';
import { ActionCard } from '@/components/ai/ActionCard';
import { CitationChip } from '@/components/ai/CitationChip';
import type { CopilotAction } from '@/lib/copilot-types';
import { getActionSpec } from '@/lib/action-registry';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';
import { BilingualText } from '@/components/common/BilingualText';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { bilingualAria } from '@/lib/i18n/format';

/**
 * Starters, split the way the capability contract already splits its actions:
 * a `read` answers a question, a `mutation` changes something you own. The six
 * used to render as one undifferentiated run of chips, so nothing on screen
 * told you that two of them would send a request to another person while the
 * other four only looked something up. `writes` is the same distinction
 * `ActionDeclaration.writes` carries — surfaced here, before the click, rather
 * than only in the confirmation that follows it.
 */
const STARTERS: { en: string; el: string; writes?: boolean }[] = [
  { en: 'What should I do next?', el: 'Τι να κάνω μετά;' },
  { en: 'Find a technical cofounder in Athens', el: 'Βρες τεχνικό συνιδρυτή στην Αθήνα' },
  { en: 'Show my best matches', el: 'Δείξε τις καλύτερες αντιστοιχίσεις' },
  { en: 'Show my research boards', el: 'Δείξε τους πίνακες έρευνας' },
  { en: 'Show my notifications', el: 'Δείξε τις ειδοποιήσεις μου' },
  { en: 'Open my calendar', el: 'Άνοιξε το ημερολόγιό μου' },
  { en: 'How is my fundraising going?', el: 'Πώς πάει η χρηματοδότηση;' },
  // Two adjacent chips named one thing twice - "στη shortlist" here and
  // "από τη λίστα" on the next line. The planner matches both; the reader
  // should not have to.
  { en: 'Save Elena to my shortlist', el: 'Αποθήκευσε την Elena στη λίστα', writes: true },
  { en: 'Remove Elena from my shortlist', el: 'Βγάλε την Elena από τη λίστα', writes: true },
  { en: 'Connect with Elena', el: 'Σύνδεση με την Elena', writes: true },
];

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AssistantBody({
  message,
  pendingActionId,
  onConfirm,
  onDismiss,
  onUndo,
}: {
  message: AIMessage;
  pendingActionId: string | null;
  onConfirm: (action: CopilotAction) => void;
  onDismiss: (action: CopilotAction) => void;
  onUndo: (action: CopilotAction) => void;
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
          <BilingualText en="Working across your graph…" el="Εργασία στο γράφο σας…" compact />
        </div>
      ) : (
        <SanitizedHtml
          className="text-sm leading-relaxed text-foreground"
          html={html}
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
        <aside className="flex w-full shrink-0 flex-col border-b border-border/60 bg-card/80 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
            <p className="text-sm font-semibold">
              <BilingualText en="Threads" el="Νήματα" compact />
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-11 gap-1.5"
              onClick={() => chat.clearMessages()}
            >
              <Plus className="h-3.5 w-3.5" />
              <BilingualText en="New" el="Νέα" compact />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chat.conversations.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                <BilingualText
                  en="New conversations appear here after you send a message."
                  el="Οι νέες συνομιλίες εμφανίζονται εδώ αφού στείλετε μήνυμα."
                />
              </p>
            ) : (
              <ul className="space-y-1">
                {chat.conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => void chat.loadConversation(conv.id)}
                      className={cn(
                        'tap-target min-h-11 w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted/70',
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
          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto min-h-11 w-full justify-start gap-2 py-1.5 md:min-h-9"
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
              className="h-auto min-h-11 w-full justify-start gap-2 py-1.5 md:min-h-9"
              onClick={() => router.push('/settings/ai')}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <BilingualText en="AI preferences" el="Προτιμήσεις AI" stacked className="min-w-0 text-left" />
            </Button>
          </div>
        </aside>
      )}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CfbGlyph name={getAgentGlyph(chat.currentAgent)} className="icon-sm" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={cn('truncate text-sm font-medium', !isPage && 'max-w-[9.5rem]')}>
                {currentAgentConfig?.name || 'CoFounderBay Assistant'}
              </p>
              {isPage && (
              <p className="truncate text-[11px] text-muted-foreground">
                {chat.isAIAvailable
                  ? sayOne('Live model + platform tools', 'Ζωντανό μοντέλο + εργαλεία πλατφόρμας')
                  : sayOne('Platform copilot · tools online', 'Βοηθός πλατφόρμας · εργαλεία ενεργά')}
              </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {agentList.length > 1 && (
              <Select value={chat.currentAgent} onValueChange={(v) => chat.setAgent(v)}>
                <SelectTrigger
                  className={cn(
                    'h-8 min-h-8 w-auto gap-1 px-2 text-xs',
                    isPage ? 'max-w-[11rem]' : 'max-w-[7.5rem]',
                  )}
                  aria-label={bilingualAria('AI agent', 'Πράκτορας AI')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {agentList.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id} className="text-xs">
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
                <button type="button" onClick={onExpand} className={cn('tap-target flex items-center justify-center rounded-xl hover:bg-muted', isPage ? 'h-11 w-11' : 'h-8 w-8')} title={bilingualAria('Open full page', 'Άνοιγμα πλήρους σελίδας')} aria-label={bilingualAria('Open full page', 'Άνοιγμα πλήρους σελίδας')}>
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {chat.messages.length === 0 ? (
            /* `h-full` + `justify-center` rather than a top-pinned block: the
               scroller is the full height of the page, so an intro that
               started at the top left roughly 700px of void between the last
               chip and the composer — the flagship page read as broken rather
               than as ready for input. Centred, the same content sits between
               the header and the composer it belongs to. `min-h-full` keeps it
               scrollable once it outgrows the viewport. */
            <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-5 py-6">
              <div className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CfbGlyph name={getAgentGlyph(chat.currentAgent)} className="icon-sm" aria-hidden="true" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 text-sm">
                  <BilingualText
                    en="I can search the network, explain matches, send intros, open threads, and jump to any page — using the same data as the rest of CoFounderBay. Writes wait for your confirm."
                    el="Μπορώ να ψάξω στο δίκτυο, να εξηγήσω αντιστοιχίσεις, να στείλω συστάσεις, να ανοίξω νήματα και να μεταβώ σε οποιαδήποτε σελίδα — με τα ίδια δεδομένα της πλατφόρμας. Οι εγγραφές περιμένουν επιβεβαίωση."
                  />
                </div>
              </div>

              {([false, true] as const).map((writes) => {
                const group = STARTERS.filter((q) => Boolean(q.writes) === writes);
                if (group.length === 0) return null;
                return (
                  <div key={String(writes)} className="space-y-2">
                    <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                      {writes
                        ? sayOne('Changes something — asks first', 'Αλλάζει κάτι — ρωτά πρώτα')
                        : sayOne('Just looks something up', 'Απλώς αναζητά κάτι')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.map((q) => (
                        <button
                          key={q.en}
                          type="button"
                          onClick={() => void chat.sendMessage(q.en)}
                          className={cn(
                            'min-h-11 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                            // Semantic tokens, not raw palette steps: the
                            // product migrated ~2,000 of those onto the status
                            // scale and these six were left behind, so they
                            // were the only violet in the theme's chrome.
                            writes
                              ? 'border-status-warning-border/50 bg-status-warning-bg text-status-warning hover:bg-status-warning-bg/70'
                              : 'border-border bg-secondary/50 text-foreground hover:bg-secondary',
                          )}
                        >
                          {sayOne(q.en, q.el)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  className="underline-offset-2 hover:underline"
                  onClick={() => router.push('/ai/capabilities')}
                >
                  <BilingualText
                    en="See everything I can read and change"
                    el="Δες όλα όσα μπορώ να διαβάσω και να αλλάξω"
                    compact
                    wrap
                  />
                </button>
              </p>
            </div>
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
                      onUndo={(a) => void chat.undoAction(a)}
                    />
                  )}
                  <p className={cn('mt-1 text-2xs', msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
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

        <form onSubmit={onSubmit} className="shrink-0 border-t border-border/60 p-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sayOne(
                isPage
                  ? 'Ask AI to search, intro, message, or navigate…'
                  : 'Ask to search, intro, or go…',
                isPage
                  ? 'Ρωτήστε το AI να αναζητήσει, να συστήσει, να στείλει μήνυμα ή να πλοηγηθεί…'
                  : 'Αναζήτηση, σύσταση, πλοήγηση…',
              )}
              className="h-11 min-h-11 flex-1 rounded-full border-0 bg-muted/50 px-4 text-sm focus-visible:outline-none focus-visible:ring-0"
              disabled={chat.isStreaming}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chat.isStreaming}
              className="h-11 w-11 rounded-full"
              aria-label={bilingualAria('Send', 'Αποστολή')}
            >
              {chat.isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {!isPage ? (
            <p className="mt-1.5 text-center text-2xs text-muted-foreground">
              <button
                type="button"
                className="underline-offset-2 hover:underline"
                onClick={() => router.push('/ai/capabilities')}
              >
                <BilingualText
                  en="See everything I can read and change"
                  el="Δες όλα όσα μπορώ να διαβάσω και να αλλάξω"
                  compact
                  wrap
                />
              </button>
            </p>
          ) : (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-2xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <BilingualText
              en="Tools use your real Connections, Matches, and Messages APIs. Destructive steps need confirm."
              el="Τα εργαλεία χρησιμοποιούν τις πραγματικές συνδέσεις, αντιστοιχίσεις και μηνύματα. Οι καταστροφικές ενέργειες θέλουν επιβεβαίωση."
            />
          </p>
          )}
        </form>
      </section>
    </div>
  );
}

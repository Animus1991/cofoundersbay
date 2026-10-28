'use client';

import { FormEvent, KeyboardEvent, useEffect, useId, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUp, Check, ChevronDown } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePopupChatOptional } from '@/contexts/PopupChatContext';
import { HOME_ASK, nowStartingPoints, scopedPrompt, slashCommands, type HomeAskAction, type HomeRole } from '@/lib/home-ask';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString, useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { cn } from '@/lib/utils';
import { YourPagesRow } from '@/components/dashboard/YourPages';
import { HomeActionShelf } from '@/components/dashboard/HomeActionShelf';

type Part = { en: string; el: string };

/** Morning from five; before that it is still last night's evening. */
export function partOfDay(hour: number): Part {
  if (hour >= 5 && hour < 12) return { en: dashboardEn('good_morning'), el: dashboardEl('good_morning') };
  if (hour >= 12 && hour < 17) return { en: dashboardEn('good_afternoon'), el: dashboardEl('good_afternoon') };
  return { en: dashboardEn('good_evening'), el: dashboardEl('good_evening') };
}

/**
 * The top of every home: a greeting, one question box and the jobs the role
 * comes back for.
 *
 * GitHub's dashboard (2026) opens on "Good morning, …" over an "Ask anything"
 * box with a scope picker ("All repositories"), and a row of starting points
 * under it. Ours had the same parts scattered: a quiet greeting sentence, a
 * one-line "Ask about this page" field that looked like every other page's,
 * and the assistant's best openings hidden in buttons further down. Here they
 * are one block, at the top, on every role's home; the page title above it is
 * unchanged.
 *
 * - The box sends to the in-page assistant with this page's context (the same
 *   path as the header's field, which this replaces on a home). Enter sends,
 *   Shift+Enter starts a new line, and Send is off while the box is empty.
 * - The scope is said in the question ("About my matches: …"), so what the
 *   assistant was asked is exactly what the chat shows.
 * - A chip asks the assistant a ready question or opens a page; a chip with a
 *   chevron opens a short menu of them.
 * - What waits right now (intro requests, unread messages, notifications)
 *   leads the row as chips with their counts, each asking the assistant to
 *   deal with it; they come from the same counts as the bell and sidebar.
 * - "/" at the start of the box lists the same starting points as commands,
 *   narrowed as you type (Copilot Chat's slash commands): arrows move, Enter
 *   runs the highlighted one, Escape clears.
 * - Under them, "Your pages": what the reader pinned and opens most, each
 *   with its `G` number (`YourPagesRow`, docs §107).
 */
export function HomeAskHero({ role, name, lead }: { role: HomeRole; name?: string | null; lead?: Part }) {
  const sayOne = useBilingualString();
  const { primary } = useLanguagePreference();
  const popup = usePopupChatOptional();
  const router = useRouter();
  const pathname = usePathname();
  const boxId = useId();
  const config = HOME_ASK[role];
  const now = nowStartingPoints(useUnreadCounts());
  const [scopeId, setScopeId] = useState(config.scopes[0]?.id ?? 'all');
  const [value, setValue] = useState('');
  const [part, setPart] = useState<Part | null>(null);
  // The server renders in its own time zone; the greeting waits for the reader's clock.
  useEffect(() => setPart(partOfDay(new Date().getHours())), []);
  const hello = part ?? { en: 'Hello', el: 'Γεια σας' };
  const scope = config.scopes.find((s) => s.id === scopeId) ?? config.scopes[0];
  const [activeCommand, setActiveCommand] = useState(0);
  const commands = slashCommands(config.actions, value);
  const listOpen = commands !== null && commands.length > 0;
  const active = listOpen ? Math.min(activeCommand, commands.length - 1) : -1;

  function send(question: string) {
    const q = question.trim();
    if (!q) return;
    if (popup && !pathname?.startsWith('/ai')) {
      popup.ask(q);
      return;
    }
    router.push(`/ai?q=${encodeURIComponent(q)}`);
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!value.trim()) return;
    send(scopedPrompt(value, scope, primary));
    setValue('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (listOpen && commands) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveCommand((active + step + commands.length) % commands.length);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setValue('');
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        runCommand(commands[active]);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function runCommand(action: HomeAskAction) {
    setValue('');
    setActiveCommand(0);
    run(action);
  }

  function run(action: HomeAskAction) {
    if (action.prompt) send(primary === 'el' ? action.prompt.el : action.prompt.en);
    else if (action.href) router.push(action.href);
  }

  return (
    <section aria-labelledby={`${boxId}-title`} className="space-y-3" data-home-ask="" data-testid={`home-${role}-assistant`}>
      {/* The greeting as it was before the box arrived: one quiet line at
          body size, not a heading (the page title is the heading). */}
      <p id={`${boxId}-title`} className="break-words text-sm text-muted-foreground" data-testid="home-greeting">
        {/* Without a name the greeting is just the greeting: the homes used
            to fill in their role word, so a Greek reader met "Καλημέρα,
            Founder." (docs §70). */}
        <BilingualText
          en={`${hello.en}${name?.trim() ? `, ${name.trim()}` : ''}.${lead ? ` ${lead.en}` : ''}`}
          el={`${hello.el}${name?.trim() ? `, ${name.trim()}` : ''}.${lead ? ` ${lead.el}` : ''}`}
          stacked
          wrap
          secondaryFrom="lg"
        />
      </p>

      <form
        data-testid="home-ask-form"
        onSubmit={submit}
        className="rounded-xl border border-input bg-card shadow-sm transition-colors focus-within:border-primary-muted"
      >
        <label htmlFor={`${boxId}-box`} className="sr-only">
          <BilingualText en="Ask the assistant" el="Ρωτήστε τον βοηθό" compact />
        </label>
        <textarea
          data-testid="home-ask-input"
          id={`${boxId}-box`}
          value={value}
          onChange={(event) => { setValue(event.target.value); setActiveCommand(0); }}
          onKeyDown={onKeyDown}
          // A textarea keeps the textbox role (combobox is not allowed on
          // it); these three still tie it to the command list.
          aria-controls={listOpen ? `${boxId}-commands` : undefined}
          aria-autocomplete="list"
          aria-activedescendant={listOpen ? `${boxId}-command-${active}` : undefined}
          rows={2}
          maxLength={2000}
          placeholder={sayOne('Ask anything, or ask for something to be done', 'Ρωτήστε οτιδήποτε ή ζητήστε να γίνει κάτι')}
          className="block max-h-48 min-h-[3.25rem] w-full resize-none bg-transparent px-4 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {listOpen && commands ? (
          <ul id={`${boxId}-commands`} data-testid="home-command-list" role="listbox" aria-label={bilingualAria('Commands', 'Εντολές')} className="mx-2 mb-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1">
            {commands.map((command, index) => (
              <li
                key={command.id}
                data-testid={`home-command-${command.id}`}
                id={`${boxId}-command-${index}`}
                role="option"
                aria-selected={index === active}
                // mousedown, not click: the box keeps its focus.
                onMouseDown={(event) => { event.preventDefault(); runCommand(command); }}
                onMouseEnter={() => setActiveCommand(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm',
                  index === active ? 'bg-muted text-foreground' : 'text-muted-foreground',
                )}
              >
                <BilingualText en={command.en} el={command.el} compact />
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-center gap-2 px-2 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
               
                className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                aria-label={bilingualAria(`About: ${scope?.en ?? ''}`, `Πλαίσιο: ${scope?.el ?? ''}`)}
                data-testid="home-ask-scope"
              >
                <CfbGlyph name="discover" className="icon-sm" />
                <BilingualText en={scope?.en ?? ''} el={scope?.el ?? ''} compact />
                <ChevronDown className="icon-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" data-testid="home-scope-menu">
              {config.scopes.map((s) => (
                <DropdownMenuItem key={s.id} data-testid={`home-scope-${s.id}`} onSelect={() => setScopeId(s.id)} className="gap-2">
                  <Check className={cn('icon-sm', s.id === scopeId ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                  <BilingualText en={s.en} el={s.el} compact />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="ml-auto hidden text-2xs text-muted-foreground sm:inline">
            <BilingualText en="Enter to send · Shift+Enter for a new line · / for commands" el="Enter για αποστολή · Shift+Enter για νέα γραμμή · / για εντολές" compact />
          </span>
          <Button
            type="submit"
            data-testid="home-ask-submit"
            size="icon"
            disabled={!value.trim()}
            className="ml-auto h-8 w-8 shrink-0 rounded-lg sm:ml-0"
            aria-label={bilingualAria('Send', 'Αποστολή')}
          >
            <ArrowUp className="icon-sm" aria-hidden="true" />
          </Button>
        </div>
      </form>

      <HomeActionShelf actions={config.actions} now={now} run={run} />

      {/* The reader's own pages: pinned, then the most opened (docs §107). */}
      <YourPagesRow />
    </section>
  );
}

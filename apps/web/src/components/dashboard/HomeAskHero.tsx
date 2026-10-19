'use client';

import { FormEvent, KeyboardEvent, useEffect, useId, useState } from 'react';
import Link from 'next/link';
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
import { HOME_ASK, scopedPrompt, type HomeAskAction, type HomeRole } from '@/lib/home-ask';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString, useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { cn } from '@/lib/utils';

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
 */
export function HomeAskHero({ role, name, lead }: { role: HomeRole; name: string; lead?: Part }) {
  const sayOne = useBilingualString();
  const { primary } = useLanguagePreference();
  const popup = usePopupChatOptional();
  const router = useRouter();
  const pathname = usePathname();
  const boxId = useId();
  const config = HOME_ASK[role];
  const [scopeId, setScopeId] = useState(config.scopes[0]?.id ?? 'all');
  const [value, setValue] = useState('');
  const [part, setPart] = useState<Part | null>(null);
  // The server renders in its own time zone; the greeting waits for the reader's clock.
  useEffect(() => setPart(partOfDay(new Date().getHours())), []);
  const hello = part ?? { en: 'Hello', el: 'Γεια σας' };
  const scope = config.scopes.find((s) => s.id === scopeId) ?? config.scopes[0];

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
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function run(action: HomeAskAction) {
    if (action.prompt) send(primary === 'el' ? action.prompt.el : action.prompt.en);
    else if (action.href) router.push(action.href);
  }

  return (
    <section aria-labelledby={`${boxId}-title`} className="space-y-3" data-home-ask="">
      <div className="space-y-0.5">
        <h2 id={`${boxId}-title`} className="text-lg font-semibold leading-tight text-foreground">
          <BilingualText en={`${hello.en}, ${name}`} el={`${hello.el}, ${name}`} compact />
        </h2>
        {lead ? (
          <p className="text-sm text-muted-foreground">
            <BilingualText en={lead.en} el={lead.el} wrap />
          </p>
        ) : null}
      </div>

      <form
        onSubmit={submit}
        className="rounded-xl border border-input bg-card shadow-sm transition-colors focus-within:border-primary-muted"
      >
        <label htmlFor={`${boxId}-box`} className="sr-only">
          <BilingualText en="Ask the assistant" el="Ρωτήστε τον βοηθό" compact />
        </label>
        <textarea
          id={`${boxId}-box`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          maxLength={2000}
          placeholder={sayOne('Ask anything, or ask for something to be done', 'Ρωτήστε οτιδήποτε ή ζητήστε να γίνει κάτι')}
          className="block max-h-48 min-h-[3.25rem] w-full resize-none bg-transparent px-4 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2 px-2 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
               
                className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                aria-label={bilingualAria(`About: ${scope?.en ?? ''}`, `Πλαίσιο: ${scope?.el ?? ''}`)}
              >
                <CfbGlyph name="discover" className="icon-sm" />
                <BilingualText en={scope?.en ?? ''} el={scope?.el ?? ''} compact />
                <ChevronDown className="icon-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {config.scopes.map((s) => (
                <DropdownMenuItem key={s.id} onSelect={() => setScopeId(s.id)} className="gap-2">
                  <Check className={cn('icon-sm', s.id === scopeId ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                  <BilingualText en={s.en} el={s.el} compact />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="ml-auto hidden text-2xs text-muted-foreground sm:inline">
            <BilingualText en="Enter to send · Shift+Enter for a new line" el="Enter για αποστολή · Shift+Enter για νέα γραμμή" compact />
          </span>
          <Button
            type="submit"
            size="icon"
            disabled={!value.trim()}
            className="ml-auto h-8 w-8 shrink-0 rounded-lg sm:ml-0"
            aria-label={bilingualAria('Send', 'Αποστολή')}
          >
            <ArrowUp className="icon-sm" aria-hidden="true" />
          </Button>
        </div>
      </form>

      <ul className="flex flex-wrap gap-2" aria-label={bilingualAria('Starting points', 'Σημεία εκκίνησης')}>
        {config.actions.map((action) => (
          <li key={action.id}>
            {action.items?.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs">
                    <CfbGlyph name={action.glyph} className="icon-sm" />
                    <BilingualText en={action.en} el={action.el} compact />
                    <ChevronDown className="icon-sm text-muted-foreground" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {action.items.map((item) => (
                    <DropdownMenuItem key={item.id} onSelect={() => run(item)} className="gap-2">
                      <CfbGlyph name={item.glyph} className="icon-sm text-muted-foreground" />
                      <BilingualText en={item.en} el={item.el} compact />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : action.href && !action.prompt ? (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs" asChild>
                <Link href={action.href}>
                  <CfbGlyph name={action.glyph} className="icon-sm" />
                  <BilingualText en={action.en} el={action.el} compact />
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs" onClick={() => run(action)}>
                <CfbGlyph name={action.glyph} className="icon-sm" />
                <BilingualText en={action.en} el={action.el} compact />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

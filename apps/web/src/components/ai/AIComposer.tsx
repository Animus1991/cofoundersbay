'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import type { AskPrompt } from '@/lib/page-questions';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { cn } from '@/lib/utils';

/**
 * Inline Ask AI field - an entry to the assistant, not a replacement for it.
 *
 * It asks in place: the in-page assistant opens and sends the question with
 * this page's context (its controls, rail sections and snapshot), so "show
 * only suspended users" can be done here. It used to navigate to /ai?q=,
 * which dropped that context and only pre-filled the question. /ai itself,
 * or a tree without the popup, still goes to the full page.
 *
 * The frame is a field edge (the neutral --input), and it takes the theme's
 * link tone only while the question is being typed. The placeholder says
 * the question is about this page; the control's name stays "Ask AI".
 *
 * Sent empty, it asks the page's ready question, in the reader's language
 * (`lib/page-questions`). The send button's tooltip says which question that
 * is: the field gave no hint that pressing it asked anything in particular.
 */
export function AIComposer({
  prompt,
  className,
}: {
  prompt: AskPrompt;
  className?: string;
}) {
  const { ask, textOf } = useAskAssistant();
  const sayOne = useBilingualString();
  const [value, setValue] = useState('');
  const ready = textOf(prompt);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    ask(value.trim() || prompt);
    setValue('');
  }

  return (
    <form
      onSubmit={submit}
      data-ask-ai=""
      className={cn(
        'flex min-h-10 min-w-0 w-full items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 max-sm:min-h-11',
        className,
      )}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={sayOne('Ask about this page', 'Ρωτήστε για αυτή τη σελίδα')}
        aria-label={bilingualAria('Ask AI', 'Ρωτήστε το AI')}
        className="min-w-0 flex-1 self-stretch bg-transparent text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:shadow-none focus:outline-none focus:ring-0"
      />
      {/* Icon-only submit: a visible "Ask" next to the "Ask AI…" placeholder
          read as two competing controls, and the pair overflowed the header
          slot, clipping the placeholder at every width. */}
      <button
        type="submit"
        aria-label={bilingualAria('Ask AI', 'Ρωτήστε το AI')}
        title={value.trim() ? undefined : sayOne(`Empty, it asks: ${ready}`, `Κενό, ρωτά: ${ready}`)}
        className="tap-target-phone -mr-1.5 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-foreground outline-none hover:bg-secondary focus-visible:outline-none focus-visible:ring-0"
      >
        <ArrowRight className="icon-sm" aria-hidden="true" />
      </button>
    </form>
  );
}

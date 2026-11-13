'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import type { AskPrompt } from '@/lib/page-questions';

interface AIInsightButtonProps {
  /** Asked in place, in the reader's language when a pair is given. */
  prompt: AskPrompt;
  agentId?: string;
  cacheKey?: string;
  context?: Record<string, unknown>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'lg' | 'icon';
  label?: string;
  labelEl?: string;
  /**
   * What this ask is about, when a page shows several: six cards each with
   * "Ask AI" read as six identical buttons to a screen reader. Appended to
   * the visible label, which stays first (SC 2.5.3).
   */
  aboutEn?: string;
  aboutEl?: string;
  /**
   * The question itself ("Ask AI how to hit these dates"), said on hover and
   * to a screen reader while the button shows the short label. It begins
   * with the visible label, or the label is put in front of it (SC 2.5.3).
   */
  question?: { en: string; el: string };
  /** Below `sm` only the spark shows; the name stays. For a card header that also holds a link. */
  compactOnPhone?: boolean;
}

/**
 * "Ask the assistant about this", in one form across the app (docs §123):
 * the spark and a short verb, quiet, at the right of what it is about. A
 * list that repeats it on every row (Today) shows the spark alone.
 *
 * There were two forms for one act: cards ended on full-width sentences
 * ("Ask AI how to hit these dates") whose spark the decorative-icon rule hid,
 * so they read as plain text, while Today's rows had a bare icon. Now every
 * one carries the same spark (kept through that rule) and the short label;
 * the particular question is its name and its tooltip.
 */
export function AIInsightButton({
  prompt,
  className,
  variant = 'ghost',
  size = 'sm',
  label,
  labelEl,
  aboutEn,
  aboutEl,
  question,
  compactOnPhone = false,
}: AIInsightButtonProps) {
  const { ask } = useAskAssistant();
  const { primary } = useLanguagePreference();
  // One language, no wrap: BilingualText+compact inside a 36px-tall button
  // stacked "Ask" over "AI" on Greek-primary pages, and the English default
  // won the first paint. The chip still opens the same assistant.
  const visibleLabel = label
    ? (primary === 'el' && labelEl ? labelEl : label)
    : (primary === 'el' ? 'Ρωτήστε το AI' : 'Ask AI');
  const iconLabel = label ? bilingualAria(label, labelEl) : bilingualAria('Ask AI', 'Ρωτήστε το AI');
  const about = aboutEn ? (primary === 'el' && aboutEl ? aboutEl : aboutEn) : null;
  const asked = question ? (primary === 'el' ? question.el : question.en) : null;
  const name = asked
    ? (asked.startsWith(visibleLabel) ? asked : `${visibleLabel}: ${asked}`)
    : about ? `${visibleLabel}: ${about}` : visibleLabel;

  // In place, like every other Ask: /ai would leave the page and its context behind.
  const openAssistant = () => ask(prompt);
  // A state of the control, not decoration: kept through the card icon rule.
  const spark = (
    <span data-keep-icon="" className="inline-flex shrink-0" aria-hidden="true">
      <CfbGlyph name="spark" className="icon-sm" />
    </span>
  );

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={openAssistant}
        className={cn('h-8 w-8 shrink-0 text-muted-foreground', className)}
        title={iconLabel}
        aria-label={iconLabel}
      >
        {spark}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={openAssistant}
      aria-label={name}
      title={asked || about ? name : undefined}
      className={cn('h-auto min-h-9 gap-1.5 whitespace-nowrap px-2.5', className)}
    >
      {spark}
      <span className={cn(compactOnPhone && 'max-sm:sr-only')}>{visibleLabel}</span>
    </Button>
  );
}

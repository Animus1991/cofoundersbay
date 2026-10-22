'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
}

export function AIInsightButton({
  prompt,
  className,
  variant = 'outline',
  size = 'sm',
  label,
  labelEl,
  aboutEn,
  aboutEl,
}: AIInsightButtonProps) {
  const { ask } = useAskAssistant();
  const { primary } = useLanguagePreference();
  // One language, no wrap: BilingualText+compact inside a 36px-tall outline
  // button stacked "Ask" over "AI" on Greek-primary pages, and the English
  // default won the first paint. The chip still opens the same assistant.
  const visibleLabel = label
    ? (primary === 'el' && labelEl ? labelEl : label)
    : (primary === 'el' ? 'Ρωτήστε το AI' : 'Ask AI');
  const ariaLabel = label ? bilingualAria(label, labelEl) : bilingualAria('Ask AI', 'Ρωτήστε το AI');

  // In place, like every other Ask: /ai would leave the page and its context behind.
  const openAssistant = () => ask(prompt);

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openAssistant}
        className={cn(
          'flex items-center justify-center rounded-full p-1.5 transition-colors',
          'text-status-accent hover:bg-status-accent-bg',
          className,
        )}
        title={ariaLabel}
        aria-label={ariaLabel}
      >
        <Sparkles className="icon-sm" />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={openAssistant}
      // The visible label is the name; repeating it here keeps the two
      // identical (SC 2.5.3) and covers the `icon` size this `size` can carry.
      // `size` is a forwarded union that may name an icon size, so the
      // compile guard asks for a name even though this branch renders text.
      aria-label={aboutEn ? `${visibleLabel}: ${primary === 'el' && aboutEl ? aboutEl : aboutEn}` : visibleLabel}
      className={cn('h-auto min-h-9 gap-1.5 whitespace-nowrap px-2.5', className)}
    >
      {visibleLabel}
    </Button>
  );
}

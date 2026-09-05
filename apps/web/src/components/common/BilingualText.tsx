'use client';

import { cn } from '@/lib/utils';
import {
  resolveBilingualPair,
  useLanguagePreference,
} from '@/lib/i18n/LanguagePreferenceContext';

type BilingualTextProps = {
  en: string;
  el?: string | null;
  className?: string;
  /** Smaller secondary line instead of inline separator (sidebar labels). */
  stacked?: boolean;
  /** Single-line inline with truncation — for tight containers (mode switcher). */
  compact?: boolean;
  primaryClassName?: string;
  secondaryClassName?: string;
};

/**
 * Renders primary language + optional secondary (user preference).
 * English is never removed from the codebase; secondary visibility follows `cfb:language-display`.
 */
export function BilingualText({
  en,
  el,
  className,
  stacked = false,
  compact = false,
  primaryClassName,
  secondaryClassName,
}: BilingualTextProps) {
  const { primary, showSecondary } = useLanguagePreference();
  const resolved = resolveBilingualPair(en, el, primary, showSecondary);

  if (!resolved.secondaryText) {
    return (
      <span lang={resolved.primaryLang} className={cn(className, primaryClassName, compact && 'truncate')}>
        {resolved.primaryText}
      </span>
    );
  }

  if (compact) {
    return (
      <span className={cn('inline-flex min-w-0 max-w-full items-baseline gap-0.5 truncate', className)}>
        <span lang={resolved.primaryLang} className={cn('truncate', primaryClassName)}>
          {resolved.primaryText}
        </span>
        <span className="bilingual-separator shrink-0" aria-hidden="true">
          ·
        </span>
        <span
          lang={resolved.secondaryLang ?? undefined}
          className={cn('bilingual-secondary truncate text-muted-foreground', secondaryClassName)}
        >
          {resolved.secondaryText}
        </span>
      </span>
    );
  }

  if (stacked) {
    return (
      <span className={cn('flex min-w-0 flex-col overflow-hidden', className)}>
        {/* leading-tight, not leading-none: leading-none clips Greek diacritics
            on capitals (Ά, Έ, Ό) and Latin descenders. */}
        <span
          lang={resolved.primaryLang}
          className={cn('truncate leading-tight', primaryClassName)}
        >
          {resolved.primaryText}
        </span>
        <span
          lang={resolved.secondaryLang ?? undefined}
          className={cn('bilingual-secondary truncate text-muted-foreground', secondaryClassName)}
        >
          {resolved.secondaryText}
        </span>
      </span>
    );
  }

  return (
    <span className={cn('min-w-0', className)}>
      <span lang={resolved.primaryLang} className={primaryClassName}>
        {resolved.primaryText}
      </span>
      <span className="bilingual-separator mx-1.5" aria-hidden="true">
        ·
      </span>
      <span
        lang={resolved.secondaryLang ?? undefined}
        className={cn('bilingual-secondary text-muted-foreground', secondaryClassName)}
      >
        {resolved.secondaryText}
      </span>
    </span>
  );
}


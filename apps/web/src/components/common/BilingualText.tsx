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
  /**
   * `stacked` only: let each line wrap instead of truncating.
   *
   * Truncation is right for the sidebar, where the column width is fixed and a
   * clipped label is recoverable by expanding the rail. It is wrong in a stat
   * card, where the column is ~88px on a phone and there is nothing to expand —
   * "Κορυφαίες αντιστοιχίσεις" simply lost a third of itself. Wrapping to a
   * second line costs a few pixels of height and keeps the whole word.
   */
  wrap?: boolean;
  primaryClassName?: string;
  secondaryClassName?: string;
};

/**
 * Renders primary language + optional secondary (user preference).
 * English is never removed from the codebase; secondary visibility follows `cfb:language-display`.
 *
 * Narrow viewports drop the secondary language for the two *inline* variants
 * (see `.bilingual-secondary--inline` in globals.css). Putting both languages on
 * one line roughly doubles every string, and at 360px that was measured pushing
 * labels past 90% clipped — milestone titles rendered as a single letter, and
 * "Open tracker · Άνοιγμα παρακολούθησης" ran 179px beyond the viewport.
 *
 * Nothing is lost: the primary line is already the language the reader chose, and
 * the top-bar switcher changes it. The `stacked` variant keeps both lines, because
 * it was built for two lines and fits — the mobile bottom nav depends on it.
 */
export function BilingualText({
  en,
  el,
  className,
  stacked = false,
  compact = false,
  wrap = false,
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
        <span className="bilingual-separator bilingual-separator--inline shrink-0" aria-hidden="true">
          ·
        </span>
        <span
          lang={resolved.secondaryLang ?? undefined}
          className={cn(
            'bilingual-secondary bilingual-secondary--inline truncate text-muted-foreground',
            secondaryClassName,
          )}
        >
          {resolved.secondaryText}
        </span>
      </span>
    );
  }

  if (stacked) {
    return (
      <span className={cn('flex min-w-0 flex-col', wrap ? 'overflow-visible' : 'overflow-hidden', className)}>
        {/* leading-tight, not leading-none: leading-none clips Greek diacritics
            on capitals (Ά, Έ, Ό) and Latin descenders. */}
        <span
          lang={resolved.primaryLang}
          className={cn(wrap ? 'break-words leading-tight' : 'truncate leading-tight', primaryClassName)}
        >
          {resolved.primaryText}
        </span>
        <span
          lang={resolved.secondaryLang ?? undefined}
          className={cn(
            'bilingual-secondary text-muted-foreground',
            wrap ? 'break-words' : 'truncate',
            secondaryClassName,
          )}
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
      <span className="bilingual-separator bilingual-separator--inline mx-1.5" aria-hidden="true">
        ·
      </span>
      <span
        lang={resolved.secondaryLang ?? undefined}
        className={cn(
          'bilingual-secondary bilingual-secondary--inline text-muted-foreground',
          secondaryClassName,
        )}
      >
        {resolved.secondaryText}
      </span>
    </span>
  );
}


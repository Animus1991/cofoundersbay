'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { cn } from '@/lib/utils';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import type { AskPrompt } from '@/lib/page-questions';
import {
  resolveBilingualPair,
  useLanguagePreference,
} from '@/lib/i18n/LanguagePreferenceContext';

export function useBuilderPrimaryText() {
  const { primary, showSecondary } = useLanguagePreference();
  return (en: string, el: string) => resolveBilingualPair(en, el, primary, showSecondary).primaryText;
}

/** Ask in place when the popup exists; `/ai?q=` only without it (`useAskAssistant`). */
export function useAskInPlace() {
  return useAskAssistant().ask;
}

export function BuilderAskAiButton({
  labelEn,
  labelEl,
  prompt,
  variant = 'outline',
  className,
}: {
  labelEn?: string;
  labelEl?: string;
  prompt?: AskPrompt;
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
}) {
  const { ask, hrefFor, inPlace } = useAskAssistant();
  // One line where it fits, at the same 32px; a long Greek label wraps in
  // the button instead of running past a 320px screen (docs §107).
  const buttonClass = cn('h-auto min-h-8 max-w-full gap-1.5 whitespace-normal py-1 text-xs', className);
  const label = (
    <BilingualText en={labelEn ?? builderEn('ask_ai')} el={labelEl ?? builderEl('ask_ai')} compact wrap />
  );
  if (inPlace && prompt) {
    return (
      <Button type="button" variant={variant} size="sm" className={buttonClass} onClick={() => ask(prompt)}>
        {label}
      </Button>
    );
  }
  const href = hrefFor(prompt);
  return (
    <Button asChild variant={variant} size="sm" className={buttonClass}>
      <Link href={href}>
        {label}
      </Link>
    </Button>
  );
}

export function BuilderStageHeader({
  glyph,
  titleEn,
  titleEl,
  subtitleEn,
  subtitleEl,
  completion,
  extraActions,
  leading,
  meta,
  hideTitle = false,
  showAskAi = true,
  askPrompt,
}: {
  glyph: CfbGlyphName;
  titleEn: string;
  titleEl: string;
  subtitleEn: string;
  subtitleEl: string;
  completion?: number;
  extraActions?: ReactNode;
  /** Replaces the subtitle, for routes whose page header already says it. */
  leading?: ReactNode;
  /** A line under the subtitle, such as the stage's own progress. */
  meta?: ReactNode;
  /** When the AppShell already shows the page title (dedicated routes). */
  hideTitle?: boolean;
  showAskAi?: boolean;
  askPrompt?: AskPrompt;
}) {
  const prompt: AskPrompt = askPrompt ?? {
    en: `Help me complete the "${titleEn}" section of my Startup Builder. What should I write or improve first?`,
    el: `Βοήθησέ με να συμπληρώσω την ενότητα «${titleEl}» του Startup Builder μου. Τι να γράψω ή να βελτιώσω πρώτα;`,
  };
  return (
    // Wraps as whole blocks: the actions sit beside the title while they fit on one line, else below it.
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-[1_1_20rem] items-start gap-3">
        {!hideTitle && (
          <CfbGlyph name={glyph} className="mt-0.5 icon-sm shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          {!hideTitle && (
            <h2 className={BUILDER_STAGE_TITLE}>
              <BilingualText en={titleEn} el={titleEl} />
            </h2>
          )}
          {leading ?? (
            <p className={BUILDER_STAGE_SUBTITLE}>
              <BilingualText en={subtitleEn} el={subtitleEl} />
            </p>
          )}
          {meta}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {completion != null && (
          <Badge variant="outline" className="gap-1.5 rounded-xl text-xs">
            {completion.toFixed(0)}%{' '}
            <BilingualText en={builderEn('complete')} el={builderEl('complete')} compact />
          </Badge>
        )}
        {showAskAi && <BuilderAskAiButton prompt={prompt} />}
        {extraActions}
      </div>
    </div>
  );
}

/** Applications (Αιτήσεις) type — never larger than this ladder. */
export const BUILDER_STAGE_TITLE =
  'page-section font-semibold tracking-tight text-foreground';
export const BUILDER_STAGE_SUBTITLE = 'page-stat-label mt-0.5 text-muted-foreground';
export const BUILDER_CARD_TITLE = 'page-section';
export const BUILDER_STAT = 'page-stat font-semibold tracking-tight';
export const BUILDER_STAT_LABEL = 'page-stat-label text-muted-foreground';

/** Inner stage strips — same `text-xs` as the Applications / main Builder tabs. */
export const BUILDER_SUBTAB_LIST =
  'grid w-full grid-cols-5 rounded-xl';
export const BUILDER_SUBTAB_TRIGGER =
  'min-h-10 gap-1.5 text-xs';
/** Applications header / actions — `size="sm"` + this class. */
export const BUILDER_BTN = 'rounded-xl';

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { cn } from '@/lib/utils';
import {
  resolveBilingualPair,
  useLanguagePreference,
} from '@/lib/i18n/LanguagePreferenceContext';

export function useBuilderPrimaryText() {
  const { primary, showSecondary } = useLanguagePreference();
  return (en: string, el: string) => resolveBilingualPair(en, el, primary, showSecondary).primaryText;
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
  prompt?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
}) {
  const href = prompt ? `/ai?q=${encodeURIComponent(prompt)}` : '/ai';
  return (
    <Button asChild variant={variant} size="sm" className={cn('h-8 gap-1.5 text-xs', className)}>
      <Link href={href}>
        <CfbGlyph name="spark" className="icon-sm" aria-hidden="true" />
        <BilingualText en={labelEn ?? builderEn('ask_ai')} el={labelEl ?? builderEl('ask_ai')} compact />
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
  /** When the AppShell already shows the page title (dedicated routes). */
  hideTitle?: boolean;
  showAskAi?: boolean;
  askPrompt?: string;
}) {
  const prompt =
    askPrompt ??
    `Help me complete the "${titleEn}" section of my Startup Builder. What should I write or improve first?`;
  return (
    <div className={cn('flex flex-col gap-3', hideTitle ? 'sm:flex-row sm:items-center sm:justify-end' : 'sm:flex-row sm:items-start sm:justify-between')}>
      {!hideTitle && (
        <div className="flex min-w-0 items-center gap-3">
          <CfbGlyph name={glyph} className="mt-1 icon-md shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className={BUILDER_STAGE_TITLE}>
              <BilingualText en={titleEn} el={titleEl} />
            </h2>
            <p className={BUILDER_STAGE_SUBTITLE}>
              <BilingualText en={subtitleEn} el={subtitleEl} />
            </p>
          </div>
        </div>
      )}
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
  'builder-title text-lg font-semibold tracking-tight text-foreground';
export const BUILDER_STAGE_SUBTITLE = 'mt-0.5 text-sm text-muted-foreground';
export const BUILDER_CARD_TITLE = 'text-base';
export const BUILDER_STAT = 'text-lg font-semibold tracking-tight';
export const BUILDER_STAT_LABEL = 'text-2xs text-muted-foreground';

/** Inner stage strips — same `text-xs` as the Applications / main Builder tabs. */
export const BUILDER_SUBTAB_LIST =
  'grid w-full grid-cols-5 rounded-xl';
export const BUILDER_SUBTAB_TRIGGER =
  'min-h-10 gap-1.5 text-xs';
/** Applications header / actions — `size="sm"` + this class. */
export const BUILDER_BTN = 'rounded-xl';

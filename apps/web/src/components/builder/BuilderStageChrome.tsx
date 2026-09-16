'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
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
  variant = 'outline',
}: {
  labelEn?: string;
  labelEl?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
}) {
  const { open } = usePopupChat();
  return (
    <Button type="button" variant={variant} size="sm" className="h-8 gap-1.5 text-xs" onClick={() => open()}>
      <CfbGlyph name="spark" className="icon-sm" />
      <BilingualText en={labelEn ?? builderEn('ask_ai')} el={labelEl ?? builderEl('ask_ai')} compact />
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
}) {
  return (
    <div className={cn('flex flex-col gap-3', hideTitle ? 'sm:flex-row sm:items-center sm:justify-end' : 'sm:flex-row sm:items-start sm:justify-between')}>
      {!hideTitle && (
        <div className="flex min-w-0 items-center gap-3">
          <CfbGlyph name={glyph} className="mt-1 icon-md shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              <BilingualText en={titleEn} el={titleEl} />
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
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
        {showAskAi && <BuilderAskAiButton />}
        {extraActions}
      </div>
    </div>
  );
}

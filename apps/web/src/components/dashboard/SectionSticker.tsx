import type { ElementType } from 'react';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { cn } from '@/lib/utils';

/**
 * A section's mark as a tinted round sticker (owner, 2026-11-23): the wash
 * names the section's kind — what waits is amber, people are the accent,
 * finished steps are green, the world around you is the brand tint. The
 * same well replaces the bare glyph on a "waiting on you" row.
 */
export type StickerTint = 'accent' | 'success' | 'warning' | 'info' | 'neutral' | 'primary';

export const STICKER_TINT: Record<StickerTint, string> = {
  accent: 'bg-status-accent-bg text-status-accent',
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  info: 'bg-status-info-bg text-status-info',
  neutral: 'bg-status-neutral-bg text-status-neutral',
  primary: 'bg-primary/10 text-primary-accessible',
};

/** The row kind its glyph already names: a pact waits, a milestone is a step. */
const GLYPH_TINT: Partial<Record<CfbGlyphName, StickerTint>> = {
  pact: 'warning',
  calendar: 'warning',
  bell: 'neutral',
  update: 'info',
  chart: 'info',
  spark: 'info',
  flag: 'success',
  wallet: 'success',
  captable: 'success',
  growth: 'success',
  perk: 'success',
  messages: 'accent',
  intro: 'accent',
  people: 'accent',
  matches: 'accent',
  mentor: 'accent',
  profile: 'accent',
  community: 'accent',
  discover: 'accent',
  feed: 'primary',
  scout: 'primary',
};

export function glyphStickerTint(glyph: CfbGlyphName): StickerTint {
  return GLYPH_TINT[glyph] ?? 'primary';
}

export function SectionSticker({
  glyph,
  icon: Icon,
  tint = 'primary',
  className,
}: {
  glyph?: CfbGlyphName;
  icon?: ElementType;
  tint?: StickerTint;
  className?: string;
}) {
  return (
    <span
      data-keep-icon=""
      aria-hidden="true"
      className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', STICKER_TINT[tint], className)}
    >
      {Icon ? <Icon className="icon-sm" /> : <CfbGlyph name={glyph ?? 'default'} className="icon-sm" />}
    </span>
  );
}

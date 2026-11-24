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

/** The page-header band behind the title sticker (B1.2): the tint's own
   wash, so the band and its mark read as one family. `neutral` and no
   sticker fall back to the page's quiet fill. */
export const STICKER_BAND_BG: Record<StickerTint, string> = {
  accent: 'bg-status-accent-bg',
  success: 'bg-status-success-bg',
  warning: 'bg-status-warning-bg',
  info: 'bg-status-info-bg',
  neutral: 'bg-muted',
  primary: 'bg-primary/10',
};

/** The glyph's ink on the band's card well — the tint's own text tone, which
   the contrast script verifies on the tint and on the card. */
export const STICKER_BAND_GLYPH: Record<StickerTint, string> = {
  accent: 'text-status-accent',
  success: 'text-status-success',
  warning: 'text-status-warning',
  info: 'text-status-info',
  neutral: 'text-status-neutral',
  primary: 'text-primary-accessible',
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

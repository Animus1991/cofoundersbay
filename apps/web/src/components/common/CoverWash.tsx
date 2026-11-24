import type { ElementType, ReactNode } from 'react';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';

/**
 * A card's visual key when the entity has no picture (docs §134): the family
 * wash — a flat tint, never a gradient — with the entity's glyph centred.
 * `primary` is not a semantic tone, so it joins the map by name; `children`
 * replaces the glyph where the mark is a logo or a person's face.
 */
export type CoverWashTone = StatusTone | 'primary';

const WASH: Record<CoverWashTone, { bg: string; icon: string }> = {
  success: { bg: STATUS.success.bg, icon: STATUS.success.icon },
  warning: { bg: STATUS.warning.bg, icon: STATUS.warning.icon },
  danger: { bg: STATUS.danger.bg, icon: STATUS.danger.icon },
  info: { bg: STATUS.info.bg, icon: STATUS.info.icon },
  accent: { bg: STATUS.accent.bg, icon: STATUS.accent.icon },
  neutral: { bg: STATUS.neutral.bg, icon: STATUS.neutral.icon },
  primary: { bg: 'bg-primary/10', icon: 'text-primary-accessible' },
};

export function CoverWash({ tone = 'neutral', icon: Icon, glyph, className, children }: {
  tone?: CoverWashTone;
  /** A lucide icon for the centre; `glyph` takes precedence when both are set. */
  icon?: ElementType;
  glyph?: CfbGlyphName;
  className?: string;
  children?: ReactNode;
}) {
  const t = WASH[tone];
  return (
    <div aria-hidden="true" className={cn('flex h-full w-full items-center justify-center', t.bg, className)}>
      {children ?? (glyph ? (
        <CfbGlyph name={glyph} className={cn('h-10 w-10', t.icon)} />
      ) : Icon ? (
        <Icon className={cn('h-10 w-10', t.icon)} aria-hidden="true" />
      ) : null)}
    </div>
  );
}

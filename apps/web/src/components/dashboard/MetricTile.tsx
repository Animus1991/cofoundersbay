import type { ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { TREND } from '@/lib/semantic-colors';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

/**
 * One figure at the top of a home screen: what it counts, the number, and a
 * line that says what the number means.
 *
 * Each role dashboard drew its own tile. The founder's put the label above a
 * large figure with a quiet glyph and a footer band of equal height, while
 * the investor, mentor, provider and incubator homes put an English-only label
 * over a smaller figure beside a tinted icon block. Moving from one role to
 * another looked like moving between products. This is the founder's
 * anatomy, shared:
 * - the label is bilingual and stacked;
 * - the figure is the largest text in the tile;
 * - the glyph stays quiet and never competes with the figure;
 * - a footer band of fixed height holds a trend or a caption, so a row of
 *   tiles keeps one baseline whether or not each has something to say.
 *
 * With `href` the whole tile is the link to the page that lists what it
 * counts.
 */
/** What the figure counts — picks the tinted well the icon sits in (§134). */
export type MetricTileFamily = 'people' | 'money' | 'time' | 'risk' | 'neutral';

const FAMILY_WELL: Record<MetricTileFamily, string> = {
  people: 'bg-status-accent-bg text-status-accent',
  money: 'bg-status-success-bg text-status-success',
  time: 'bg-status-warning-bg text-status-warning',
  risk: 'bg-status-danger-bg text-status-danger',
  neutral: 'bg-muted text-muted-foreground',
};

/* The family's tint at half strength on the tile itself (B1.4), so a row of
   figures reads as coloured blocks. Neutral keeps the plain card. */
const FAMILY_TINT: Record<MetricTileFamily, string> = {
  people: 'bg-status-accent-bg/50',
  money: 'bg-status-success-bg/50',
  time: 'bg-status-warning-bg/50',
  risk: 'bg-status-danger-bg/50',
  neutral: 'bg-card',
};

export type MetricTileProps = {
  label: string;
  labelEl?: string;
  value: ReactNode;
  /** A lucide icon, or `glyph` for the product's own glyph set. */
  icon?: ElementType;
  glyph?: CfbGlyphName;
  /** The metric family: people, money, time/events, risk/moderation, neutral. */
  family?: MetricTileFamily;
  caption?: string;
  captionEl?: string;
  trend?: { value: number; positive: boolean; en?: string; el?: string };
  href?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  metaClassName?: string;
  /**
   * Centre the label, figure and caption in the tile. Off everywhere except
   * the four founder-dashboard figures that were asked to sit in the middle.
   */
  align?: 'start' | 'center';
  /**
   * The shape behind the change, on the change's own line (a `Sparkline`).
   * Only where a real series exists; a tile with one is as tall as one
   * without (docs §107).
   */
  trendVisual?: ReactNode;
  /**
   * A strip along the tile's bottom edge, inside the card's own padding (a
   * `ProgressSegments`), for a figure that is a part of a whole. Decorative:
   * the caption says the same in words. Adds no height.
   */
  edge?: ReactNode;
};

export function MetricTile({ label, labelEl, value, icon: Icon, glyph, family, caption, captionEl, trend, href, className, labelClassName, valueClassName, metaClassName, align = 'start', trendVisual, edge }: MetricTileProps) {
  const testId = `home-metric-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const centered = align === 'center';
  const symbol = glyph ? (
    <CfbGlyph name={glyph} className="icon-sm shrink-0" />
  ) : Icon ? (
    <Icon className="icon-sm shrink-0" aria-hidden="true" />
  ) : null;
  /* A family puts the icon in its tinted well (§134); without one the icon
     stays the quiet grey mark it was. */
  const mark = symbol ? (
    family ? (
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', FAMILY_WELL[family])}>{symbol}</span>
    ) : (
      <span className="text-muted-foreground/70">{symbol}</span>
    )
  ) : null;
  const content = (
    <Card data-testid={testId} className={cn('relative h-full min-w-0 overflow-hidden transition-colors group-hover:border-primary/30', family && FAMILY_TINT[family], className)}>
      <CardContent className={cn('flex h-full flex-col', centered && 'items-center text-center')}>
        <div className={cn('flex w-full items-start gap-3', centered ? 'flex-col items-center' : 'justify-between')}>
          {centered ? mark : null}
          <div className={cn('min-w-0 flex-1 space-y-1.5', centered && 'w-full')}>
            <p className={cn('page-stat-label leading-snug text-muted-foreground', labelClassName)}>
              <BilingualText en={label} el={labelEl} stacked wrap />
            </p>
            {/* The figure is the tile's visual key (§134): 24px, tabular. */}
            <p data-testid={`${testId}-value`} className={cn('text-2xl font-semibold tabular-nums tracking-tight', valueClassName)}>{value}</p>
          </div>
          {centered ? null : mark}
        </div>
        <div className={cn('mt-auto min-h-[2.75rem] pt-2', centered && 'w-full')}>
          {trend ? (
            <div className="space-y-0.5">
              <p className={cn('page-stat-meta font-medium tabular-nums leading-snug', trend.positive ? TREND.up : TREND.down, metaClassName, trendVisual ? 'flex items-center gap-2' : null, trendVisual && centered ? 'justify-center' : null)}>
                <span>{trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
                {trendVisual ?? null}
              </p>
              {trend.en ? (
                <p className={cn('page-stat-meta leading-snug text-muted-foreground', metaClassName)}>
                  <BilingualText en={trend.en} el={trend.el} stacked wrap />
                </p>
              ) : null}
            </div>
          ) : caption ? (
            <p className={cn('page-stat-meta leading-snug text-muted-foreground', metaClassName)}>
              <BilingualText en={caption} el={captionEl} stacked wrap />
            </p>
          ) : null}
        </div>
      </CardContent>
      {edge ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-2 sm:inset-x-6">
          {edge}
        </div>
      ) : null}
    </Card>
  );
  const destination = href && caption
    ? bilingualAria(caption, captionEl)
    : undefined;
  return href ? (
    <Link href={href} title={destination} data-testid={`${testId}-open`} className="group block h-full min-w-0 w-full rounded-2xl focus-ring">
      {content}
    </Link>
  ) : (
    content
  );
}

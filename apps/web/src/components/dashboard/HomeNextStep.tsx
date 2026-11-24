'use client';

import Link from 'next/link';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, glyphForHref, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { cn } from '@/lib/utils';
import { useAskAssistant } from '@/hooks/useAskAssistant';

/**
 * The one thing a home screen names before its figures - the same anatomy on
 * every role's home, as GitHub's flash ("had recent pushes · Compare & pull
 * request"): a tinted box with an edge of the same hue, the glyph of the page
 * it opens, a short label, the specific thing (a board, a person, a deal) with
 * why when known, and one button on the right.
 *
 * Two tones. `next` (the default) is what comes up: the next session, the
 * board you left, the active deal - the brand's tint. `waiting` is something
 * that waits on you: an inquiry to answer, a request or an application to
 * review, a report to read - the attention tint, so it reads as such before a
 * word is read. The figures and lists below keep the rest.
 */
export function HomeNextStep({
  kickerEn,
  kickerEl,
  title,
  titleEn,
  titleEl,
  href,
  actionEn,
  actionEl,
  reasonEn,
  reasonEl,
  external = false,
  actionVariant = 'default',
  tone = 'next',
  glyph,
  askEn,
  askEl,
  onAsk,
  stacked = false,
}: {
  kickerEn: string;
  kickerEl: string;
  /** A name or title that is the same in both languages. */
  title?: string;
  titleEn?: string;
  titleEl?: string;
  href: string;
  actionEn: string;
  actionEl: string;
  /** A fact about why this is the next step. Omitted when the page does not know one. */
  reasonEn?: string;
  reasonEl?: string;
  external?: boolean;
  actionVariant?: 'default' | 'outline';
  /** `waiting`: it waits on the reader (attention tint). `next`: what comes up (brand tint). */
  tone?: 'next' | 'waiting';
  /** The glyph when the link's own page does not name one (an external meeting link). */
  glyph?: CfbGlyphName;
  /**
   * Ask the assistant about this step, beside the action (the studio's
   * NextMove, docs §109). The parent asks through `useAskAssistant`, so the
   * question stays on this page.
   */
  askEn?: string;
  askEl?: string;
  onAsk?: () => void;
  /**
   * Stack the anatomy for a narrow column (docs §133.9): the icon and label
   * on one row, the title full width under them (clamped to two lines), the
   * two buttons on a row of their own — the inline layout squeezed the title
   * to three lines beside the buttons at ~300px.
   */
  stacked?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const { ask } = useAskAssistant();
  const askNext = onAsk ?? (() => ask({
    en: `What should I do here? ${kickerEn}: ${titleEn ?? title ?? ''}${reasonEn ? `. ${reasonEn}` : ''}`,
    el: `Τι κάνω εδώ; ${kickerEl}: ${titleEl ?? title ?? titleEn ?? ''}${reasonEl ? `. ${reasonEl}` : ''}`,
  }));
  const label = <BilingualText en={actionEn} el={actionEl} compact />;
  const waiting = tone === 'waiting';
  const iconWell = (
    <span
      data-keep-icon=""
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card',
        waiting ? 'text-status-warning' : 'text-primary-accessible',
      )}
      aria-hidden="true"
    >
      <CfbGlyph name={glyph ?? (external ? 'calendar' : glyphForHref(href))} className="icon-md" />
    </span>
  );
  const kicker = (
    <p className={cn('text-xs font-medium', waiting ? 'text-status-warning' : 'text-primary-accessible')}>
      <BilingualText en={kickerEn} el={kickerEl} compact />
    </p>
  );
  const titleBlock = (
    <p className={cn('break-words text-sm font-medium text-foreground', stacked && 'line-clamp-2')} data-testid={`home-next-title-${id}`}>
      {titleEn != null ? <BilingualText en={titleEn} el={titleEl ?? titleEn} compact wrap /> : title}
    </p>
  );
  const reasonBlock = reasonEn ? (
    <p className="break-words text-xs text-muted-foreground" data-testid={`home-next-reason-${id}`}>
      <BilingualText en={reasonEn} el={reasonEl ?? reasonEn} compact wrap />
    </p>
  ) : null;
  const buttons = (
    <>
      <Button type="button" size="sm" variant="ghost" className="max-sm:flex-1" data-next-ask="" data-testid={`home-next-ask-${id}`} onClick={askNext}>
        <BilingualText en={askEn ?? 'Ask'} el={askEl ?? 'Ρωτήστε'} compact />
      </Button>
      <Button asChild size="sm" variant={actionVariant} className="shrink-0 max-sm:flex-1" data-next-open="">
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" data-testid={`home-next-open-${id}`}>
            {label}
          </a>
        ) : (
          <Link href={href} data-testid={`home-next-open-${id}`}>{label}</Link>
        )}
      </Button>
    </>
  );
  return (
    <section
      data-next-step={tone}
      data-testid={`home-next-step-${id}`}
      aria-label={`${kickerEn} · ${kickerEl}`}
      className={cn(
        'flex rounded-lg border px-4 py-3',
        stacked ? 'flex-col gap-1.5' : 'flex-wrap items-center gap-x-4 gap-y-3',
        waiting ? 'border-status-warning-border bg-status-warning-bg' : 'border-primary-muted bg-primary-subtle',
      )}
    >
      {stacked ? (
        <>
          <div className="flex items-center gap-2">{iconWell}{kicker}</div>
          {titleBlock}
          {reasonBlock}
          <div className="mt-1 flex items-center gap-1.5">{buttons}</div>
        </>
      ) : (
        <>
          {iconWell}
          <div className="min-w-0 flex-1">
            {kicker}
            {titleBlock}
            {reasonBlock}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 max-sm:w-full">{buttons}</div>
        </>
      )}
    </section>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { useMyBadges } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';

export function BadgesWidget() {
  const { data: badges, isLoading } = useMyBadges();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CfbGlyph name="award" className="icon-md text-muted-foreground" />
            <BilingualText en="Badges" el="Εμβλήματα" wrap />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CfbGlyph name="award" className="icon-md text-muted-foreground" />
            <BilingualText en="Badges" el="Εμβλήματα" wrap />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center text-muted-foreground">
            <CfbGlyph name="award" className="mx-auto mb-3 icon-lg text-muted-foreground/50" />
            <p className="text-sm">
              <BilingualText en="No badges earned yet" el="Δεν έχετε εμβλήματα ακόμα" />
            </p>
            <p className="mt-1 text-xs">
              <BilingualText
                en="Keep building to unlock achievements."
                el="Συνεχίστε να χτίζετε για να ξεκλειδώσετε επιτεύγματα."
              />
            </p>
            <Link
              href="/achievements"
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary-accessible hover:underline"
            >
              <BilingualText en="See how to earn them" el="Δείτε πώς τα κερδίζετε" wrap />
              <ArrowRight className="icon-sm shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unseenCount = badges.filter((b) => !b.seenAt).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-2 text-base">
          <div className="flex min-w-0 items-center gap-2">
            <CfbGlyph name="award" className="icon-md shrink-0 text-muted-foreground" />
            <BilingualText en="Badges" el="Εμβλήματα" wrap />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-sm font-normal leading-snug text-muted-foreground">
              <BilingualText
                en={`${badges.length} earned`}
                el={`${badges.length} ${badges.length === 1 ? 'αποκτήθηκε' : 'αποκτήθηκαν'}`}
                stacked
                wrap
              />
            </span>
            {unseenCount > 0 && (
              <BadgeUI variant="secondary" className="h-auto min-h-6 gap-1 whitespace-normal">
                <CfbGlyph name="spark" className="icon-sm shrink-0" />
                <BilingualText
                  en={`${unseenCount} new`}
                  el={`${unseenCount} ${unseenCount === 1 ? 'νέο' : 'νέα'}`}
                  stacked
                  wrap
                />
              </BadgeUI>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => {
            const rarityEl = RARITY_EL[badge.rarity] ?? badge.rarity;
            const nameEl = BADGE_NAME_EL[badge.name];
            return (
              <Link
                key={badge.id}
                href="/achievements"
                aria-label={bilingualAria(
                  `${badge.name}, ${badge.rarity}`,
                  `${nameEl ?? badge.name}, ${rarityEl}`,
                )}
                className={cn(
                  'relative flex flex-col items-center overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.04] p-3 text-center transition-colors hover:border-primary/30',
                  !badge.seenAt && 'ring-1 ring-primary/50 shadow-[0_0_36px_-8px_hsl(var(--primary)/0.85)]',
                )}
              >
                {!badge.seenAt && (
                  <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.95)]" />
                )}
                <MedalFace
                  id={badge.id}
                  glyph={glyphForBadge(badge.iconName || badge.category)}
                  rarity={badge.rarity}
                />
                <div className="relative mt-3 w-full text-sm font-semibold leading-snug">
                  {nameEl
                    ? <BilingualText en={badge.name} el={nameEl} stacked wrap />
                    : badge.name}
                </div>
                <div className="relative mt-1.5 w-full text-2xs capitalize text-muted-foreground">
                  <BilingualText en={badge.rarity} el={rarityEl} stacked wrap />
                </div>
              </Link>
            );
          })}
        </div>
        <Link
          href="/achievements"
          className="mt-4 inline-flex max-w-full items-start gap-1.5 text-xs leading-snug text-muted-foreground transition-colors hover:text-foreground"
        >
          <BilingualText
            en="Keep going to unlock more"
            el="Συνεχίστε για να ξεκλειδώσετε περισσότερα"
            stacked
            wrap
          />
          <ArrowRight className="mt-0.5 icon-sm shrink-0" />
        </Link>
      </CardContent>
    </Card>
  );
}

function MedalFace({
  id,
  glyph,
  rarity,
}: {
  id: string;
  glyph: CfbGlyphName;
  rarity: string;
}) {
  const fillId = `cfb-medal-fill-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ring = rarityRing(rarity);

  return (
    <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center" aria-hidden="true">
      <div
        className="pointer-events-none absolute inset-[-6px] rounded-full border opacity-60"
        style={{ borderColor: ring }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={fillId} cx="38%" cy="30%" r="72%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
            <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--card))" stopOpacity="0.95" />
          </radialGradient>
        </defs>
        <circle cx="36" cy="36" r="31" fill={`url(#${fillId})`} />
        <circle
          cx="36"
          cy="36"
          r="31"
          fill="none"
          stroke={ring}
          strokeWidth="3"
        />
        <circle cx="36" cy="36" r="24.5" fill="none" stroke="hsl(var(--primary) / 0.45)" strokeWidth="1.4" />
        <circle cx="36" cy="36" r="20" fill="none" stroke="hsl(var(--background) / 0.55)" strokeWidth="1" />
      </svg>
      <CfbGlyph name={glyph} className="relative icon-lg text-muted-foreground" />
    </div>
  );
}

/** Greek for the preview badges seeded by `lib/preview-api.ts`, keyed by exact name. */
const BADGE_NAME_EL: Record<string, string> = {
  'Early adopter': 'Πρώιμος υποστηρικτής',
};

/** API rarities are lowercase English; the tile showed them raw ("common"). */
const RARITY_EL: Record<string, string> = {
  common: 'Κοινό',
  uncommon: 'Ασυνήθιστο',
  rare: 'Σπάνιο',
  epic: 'Επικό',
  legendary: 'Θρυλικό',
};

function rarityRing(rarity: string): string {
  switch (rarity) {
    case 'legendary':
      return 'hsl(var(--status-warning-mark))';
    case 'epic':
      return 'hsl(var(--status-accent-mark))';
    case 'rare':
      return 'hsl(var(--status-info-mark))';
    case 'uncommon':
      return 'hsl(var(--status-success-mark))';
    default:
      return 'hsl(var(--primary))';
  }
}

function glyphForBadge(iconName: string): CfbGlyphName {
  const map: Record<string, CfbGlyphName> = {
    trophy: 'award',
    star: 'spark',
    medal: 'award',
    fire: 'spark',
    rocket: 'builder',
    target: 'target',
    crown: 'award',
    gem: 'spark',
    progress: 'chart',
    consistency: 'spark',
    collaboration: 'people',
    quality: 'spark',
    learning: 'book',
    execution: 'flag',
  };
  return map[iconName.toLowerCase()] ?? 'award';
}

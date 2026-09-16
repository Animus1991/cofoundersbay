'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { useMyBadges } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';

export function BadgesWidget() {
  const { data: badges, isLoading } = useMyBadges();

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CfbGlyph name="award" className="icon-md text-primary-accessible" />
            <BilingualText en="Badges" el="Εμβλήματα" compact />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CfbGlyph name="award" className="icon-md text-primary-accessible" />
            <BilingualText en="Badges" el="Εμβλήματα" compact />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
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
          </div>
        </CardContent>
      </Card>
    );
  }

  const unseenCount = badges.filter((b) => !b.seenAt).length;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <div className="flex items-center gap-2">
            <CfbGlyph name="award" className="icon-md text-primary-accessible" />
            <BilingualText en="Badges" el="Εμβλήματα" compact />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {/* Greek verbs agree in number: "1 αποκτήθηκαν" is wrong. */}
              <BilingualText
                en={`${badges.length} earned`}
                el={`${badges.length} ${badges.length === 1 ? 'αποκτήθηκε' : 'αποκτήθηκαν'}`}
                compact
              />
            </span>
            {unseenCount > 0 && (
              <BadgeUI variant="secondary" className="gap-1">
                <CfbGlyph name="spark" className="icon-sm" />
                {/* Neuter: το έμβλημα → "1 νέο", "2 νέα". */}
                <BilingualText en={`${unseenCount} new`} el={`${unseenCount} ${unseenCount === 1 ? 'νέο' : 'νέα'}`} compact />
              </BadgeUI>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                'relative flex flex-col items-center rounded-lg p-2.5 transition-colors hover:bg-muted/40',
                !badge.seenAt && 'ring-1 ring-primary/30',
              )}
            >
              {!badge.seenAt && (
                <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
              )}
              <CfbGlyph
                name={glyphForBadge(badge.iconName || badge.category)}
                className={cn('mb-1 icon-lg', getRarityIconColor(badge.rarity))}
              />
              <div className="line-clamp-2 text-center text-xs font-medium">
                {BADGE_NAME_EL[badge.name]
                  ? <BilingualText en={badge.name} el={BADGE_NAME_EL[badge.name]} wrap />
                  : badge.name}
              </div>
              <div className="mt-1 text-2xs capitalize text-muted-foreground">
                <BilingualText en={badge.rarity} el={RARITY_EL[badge.rarity] ?? badge.rarity} compact />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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

function getRarityIconColor(rarity: string): string {
  switch (rarity) {
    case 'legendary':
      return STATUS.warning.icon;
    case 'epic':
      return STATUS.accent.icon;
    case 'rare':
      return STATUS.info.icon;
    case 'uncommon':
      return STATUS.success.icon;
    default:
      return 'text-muted-foreground';
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

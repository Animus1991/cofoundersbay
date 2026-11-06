'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageRail } from '@/components/layout/PageRailContext';
import { CMT } from '@/lib/i18n/strings-commitments';
import { bilingualInline } from '@/lib/i18n/format';
import {
  NO_CHIPS,
  activeChipCount,
  chipSummary,
  type CardChips,
} from '@/lib/need-card-wall';
import { NeedCard } from './NeedCard';
import { NeedCardAlertDialog } from './NeedCardAlertDialog';
import { NonGuaranteeNote } from './NonGuaranteeNote';
import { useNeedCardWall } from './useNeedCardWall';

export { kindsForOpportunityType } from './useNeedCardWall';

/**
 * Other people's need cards, inside Opportunities, as a wall.
 *
 * Structured needs sit above the free-form listings and follow the page's
 * filters (type and remote in the rail, the search words). Their own four
 * facets - category, place, stage, commitment - live in the rail too
 * (`NeedCardChips`), so the page has one filtering surface rather than a
 * second chip row under this heading. Only cards that still take interest
 * appear, plus agreed ones for thirty days; nothing here invites contact
 * outside the ladder.
 */
export function NeedCardsSection({
  type,
  remoteOnly,
  search,
  chips: chipsProp,
  onChipsChange,
  alertOpen,
  onAlertOpenChange,
}: {
  type: string;
  remoteOnly: boolean;
  search: string;
  /** The chips, owned by the page so its assistant controls, the rail and the address bar share them. */
  chips?: CardChips;
  onChipsChange?: (chips: CardChips) => void;
  /** The "alert me" dialog, owned by the page so its assistant command can open it. */
  alertOpen?: boolean;
  onAlertOpenChange?: (open: boolean) => void;
}) {
  const [ownAlertOpen, setOwnAlertOpen] = useState(false);
  const isAlertOpen = alertOpen ?? ownAlertOpen;
  const setAlertOpen = onAlertOpenChange ?? setOwnAlertOpen;
  const [ownChips, setOwnChips] = useState<CardChips>(NO_CHIPS);
  const chips = chipsProp ?? ownChips;
  const setChips = onChipsChange ?? setOwnChips;
  const { openRailSection } = usePageRail();
  const wall = useNeedCardWall({ type, remoteOnly, search, chips });
  const { board, cards } = wall;
  if (!wall.kinds || !wall.ready) return null;

  const active = activeChipCount(chips);
  const summary = chipSummary(chips);
  // Equity and funding words on the wall carry the non-guarantee sentence
  // once, here under the grid, instead of inside every card.
  const anyMoney = cards.some((c) => Boolean(c.offer?.equity) || c.kind === 'investor_intro');

  return (
    <section aria-labelledby="need-cards-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id="need-cards-heading" className="text-base font-semibold text-foreground">
            <BilingualText en={CMT.needs_cards.en} el={CMT.needs_cards.el} compact />
          </h2>
          <p className="text-xs text-muted-foreground"><BilingualText en={CMT.needs_cards_hint.en} el={CMT.needs_cards_hint.el} wrap /></p>
        </div>
        {/* Outline, not ghost: on a phone it may wrap to a row of its own, and
            a ghost button starting a row puts its padding before its letters. */}
        <Button size="sm" variant="outline" asChild>
          <Link href="/commitments/new"><BilingualText en={CMT.write_card.en} el={CMT.write_card.el} compact /></Link>
        </Button>
      </div>
      <NeedCardAlertDialog open={isAlertOpen} onOpenChange={setAlertOpen} kinds={wall.kinds} remoteOnly={remoteOnly} search={search} chips={chips} />

      {!wall.isLoading && !wall.isError && board.length > 0 ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          <BilingualText
            en={active ? `${cards.length} of ${board.length} cards` : `${board.length} ${board.length === 1 ? 'card' : 'cards'}`}
            el={active ? `${cards.length} από ${board.length} κάρτες` : `${board.length} ${board.length === 1 ? 'κάρτα' : 'κάρτες'}`}
            compact
          />
        </p>
      ) : null}

      {wall.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
          {[0, 1].map((i) => (
            <Card key={i}><CardContent className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : wall.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <p role="alert" className="text-sm text-muted-foreground">
            <BilingualText en="The need cards could not be read just now." el="Οι κάρτες ανάγκης δεν διαβάστηκαν αυτή τη στιγμή." wrap />
          </p>
          <Button size="sm" variant="outline" onClick={() => wall.refetch()}>
            <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
          </Button>
        </div>
      ) : cards.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
          {summary && board.length > 0 ? (
            <>
              <p className="text-sm text-foreground">
                <BilingualText en={`No card fits ${summary.en}.`} el={`Καμία κάρτα δεν ταιριάζει σε ${summary.el}.`} wrap />
              </p>
              <Button size="sm" variant="outline" onClick={() => setChips(NO_CHIPS)}>
                <BilingualText en={`Show all ${board.length} cards`} el={`Εμφάνιση και των ${board.length} καρτών`} compact />
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground"><BilingualText en={CMT.empty_filtered.en} el={CMT.empty_filtered.el} wrap /></p>
              {type !== 'all' || remoteOnly || active > 0 ? (
                <Button size="sm" variant="outline" onClick={() => openRailSection('filters')}>
                  <BilingualText en="Show filters" el="Εμφάνιση φίλτρων" compact />
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label={bilingualInline(CMT.needs_cards.en, CMT.needs_cards.el)}>
            {cards.map((card) => (
              <li key={card.id} className="min-w-0">
                <Card className="h-full">
                  <CardContent className="h-full">
                    <NeedCard
                      card={card}
                      compact
                      guaranteeNote={false}
                      actions={
                        <Button size="sm" asChild>
                          <Link href={`/commitments/${encodeURIComponent(card.id)}`}>
                            <BilingualText
                              en={card.myThreadId ? CMT.open_board.en : CMT.interest_title.en}
                              el={card.myThreadId ? CMT.open_board.el : CMT.interest_title.el}
                              compact
                            />
                          </Link>
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          {anyMoney ? <NonGuaranteeNote /> : null}
        </>
      )}
    </section>
  );
}

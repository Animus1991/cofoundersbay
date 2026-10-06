'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isInHistory, type CommitmentKind } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listCommitmentCards } from '@/lib/commitments-api';
import { CMT } from '@/lib/i18n/strings-commitments';
import { qk } from '@/lib/query-keys';
import { NeedCard } from './NeedCard';

/** Which card kinds an opportunity type filter covers; `null` hides the section. */
export function kindsForOpportunityType(type: string): CommitmentKind[] | null {
  if (type === 'all') return ['cofounder', 'equity_role', 'investor_intro'];
  if (type === 'cofounder') return ['cofounder'];
  if (type === 'investment') return ['investor_intro'];
  if (type === 'job' || type === 'partnership') return ['equity_role'];
  return null;
}

/**
 * Other people's need cards, inside Opportunities.
 *
 * Structured needs sit above the free-form listings and follow the same
 * filters (type, remote, search words). Only cards that still take interest
 * appear, plus agreed ones for thirty days; nothing here invites contact
 * outside the ladder.
 */
export function NeedCardsSection({ type, remoteOnly, search }: { type: string; remoteOnly: boolean; search: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const kinds = kindsForOpportunityType(type);
  const query = useQuery({
    queryKey: qk('commitments', 'cards', 'browse'),
    queryFn: () => listCommitmentCards({ limit: 50 }),
    enabled: kinds !== null,
    staleTime: 60_000,
  });
  if (!kinds || now === null) return null;
  const words = search.trim().toLowerCase();
  const cards = (query.data ?? [])
    .filter((c) => !c.isMine && kinds.includes(c.kind))
    .filter((c) => c.outcome === 'open' || c.outcome === 'in_discussion' || (c.outcome === 'agreed' && !isInHistory(c.settledAt, now)))
    .filter((c) => !remoteOnly || c.isRemote)
    .filter((c) => !words || `${c.title} ${c.exists} ${c.goal} ${c.missing} ${c.offer.role} ${c.category} ${c.place ?? ''}`.toLowerCase().includes(words));

  return (
    <section aria-labelledby="need-cards-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id="need-cards-heading" className="text-base font-semibold text-foreground">
            <BilingualText en={CMT.needs_cards.en} el={CMT.needs_cards.el} compact />
          </h2>
          <p className="text-xs text-muted-foreground"><BilingualText en={CMT.needs_cards_hint.en} el={CMT.needs_cards_hint.el} wrap /></p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/commitments/new"><BilingualText en={CMT.write_card.en} el={CMT.write_card.el} compact /></Link>
        </Button>
      </div>
      {query.isLoading ? null : cards.length === 0 ? (
        <p className="text-sm text-muted-foreground"><BilingualText en={CMT.empty_filtered.en} el={CMT.empty_filtered.el} wrap /></p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="p-4">
                <NeedCard
                  card={card}
                  compact
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
          ))}
        </div>
      )}
    </section>
  );
}

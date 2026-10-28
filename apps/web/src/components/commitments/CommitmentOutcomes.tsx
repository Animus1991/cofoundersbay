'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { COMMITMENT_OUTCOMES, isInHistory } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listCommitmentCards, listCommitmentThreads } from '@/lib/commitments-api';
import { waitsOnMe } from '@/lib/commitments-next';
import { CMT } from '@/lib/i18n/strings-commitments';
import { qk } from '@/lib/query-keys';
import { OutcomeChip } from './OutcomeChip';

/**
 * Where the founder's commitments stand, beside the readiness score.
 *
 * Readiness says how ready the startup is; this says whether the people it
 * needs are coming: each outcome with its count, the steps waiting on the
 * reader, and a link to the list. Settled items older than thirty days are
 * history and are not counted here.
 */
/**
 * `waitingShownAbove`: the page already leads with the step that waits on the
 * reader ("Waiting on you · 1 more on Commitments"), so "2 steps wait on you"
 * here was the same count a screen later (founder home, docs §70).
 */
export function CommitmentOutcomes({ waitingShownAbove = false }: { waitingShownAbove?: boolean } = {}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const cardsQ = useQuery({ queryKey: qk('commitments', 'cards', 'mine'), queryFn: () => listCommitmentCards({ mine: true }) });
  const threadsQ = useQuery({ queryKey: qk('commitments', 'threads', 'all'), queryFn: () => listCommitmentThreads('all') });
  const cards = (cardsQ.data ?? []).filter((c) => c.isMine && (now === null || !isInHistory(c.settledAt, now)));
  const waiting = (threadsQ.data ?? []).filter(waitsOnMe).length;

  return (
    <Card data-commitment-outcomes="">
      <CardHeader>
        <CardTitle><BilingualText en={CMT.outcomes.en} el={CMT.outcomes.el} compact /></CardTitle>
        <CardDescription><BilingualText en={CMT.outcomes_hint.en} el={CMT.outcomes_hint.el} wrap /></CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {cardsQ.isLoading || now === null ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : cardsQ.isError ? (
          // A failed read is not "no cards": "Write your first card" showed
          // while the server was down, to someone who has cards.
          <p className="card-body text-muted-foreground">
            <BilingualText en="Your need cards could not be read just now." el="Οι κάρτες σας δεν διαβάστηκαν αυτή τη στιγμή." wrap />
          </p>
        ) : cards.length === 0 ? (
          <div className="space-y-3">
            <p className="card-body text-muted-foreground"><BilingualText en={CMT.empty_mine.en} el={CMT.empty_mine.el} wrap /></p>
            <Button asChild size="sm">
              <Link href="/commitments/new"><BilingualText en={CMT.first_card.en} el={CMT.first_card.el} compact /></Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {COMMITMENT_OUTCOMES.map((o) => {
              const n = cards.filter((c) => c.outcome === o).length;
              return n ? (
                <li key={o} className="flex items-center gap-1.5">
                  <OutcomeChip outcome={o} />
                  <span className="card-body font-semibold tabular-nums text-foreground">{n}</span>
                </li>
              ) : null;
            })}
          </ul>
        )}
        {waiting > 0 && !waitingShownAbove ? (
          <p className="card-body text-foreground">
            <BilingualText en={`${waiting} ${waiting === 1 ? 'step waits' : 'steps wait'} on you`} el={`${waiting} ${waiting === 1 ? 'βήμα περιμένει' : 'βήματα περιμένουν'} από εσάς`} wrap />
          </p>
        ) : null}
        {/* Says where it goes: a bare "Commitments" under a card titled
            "Commitments" read as a second heading. */}
        <Link href="/commitments" className="tap-extend-y inline-block text-sm font-medium text-primary-accessible underline-offset-4 hover:underline">
          <BilingualText en="Open Commitments" el="Άνοιγμα δεσμεύσεων" compact />
        </Link>
      </CardContent>
    </Card>
  );
}

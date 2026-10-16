'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardHead } from '@/components/common/CardAnatomy';
import { listCommitmentCards } from '@/lib/commitments-api';
import { CMT } from '@/lib/i18n/strings-commitments';
import { qk } from '@/lib/query-keys';
import { NeedCard } from './NeedCard';

/**
 * A project's need card, on the project's own page.
 *
 * The project says what it is; the card says what it needs and what it
 * offers for it. The author sees a two-minute prompt when there is none;
 * anyone else sees the card, or nothing.
 */
export function ProjectNeedCard({ projectId, owned }: { projectId: string; owned: boolean }) {
  const query = useQuery({
    queryKey: qk('commitments', 'cards', 'project', projectId),
    queryFn: () => listCommitmentCards({ projectRefs: [projectId] }),
    enabled: Boolean(projectId),
  });
  const card = (query.data ?? []).find((c) => c.outcome !== 'closed') ?? (query.data ?? [])[0];

  if (query.isLoading) return null;
  if (!card) {
    if (!owned) return null;
    return (
      <Card className="border-primary-muted bg-primary-subtle">
        <CardContent className="space-y-3">
          <CardHead
            titleAs="p"
            title={<BilingualText en={CMT.write_card.en} el={CMT.write_card.el} compact />}
            subtitle={<BilingualText en={CMT.guide_intro.en} el={CMT.guide_intro.el} wrap />}
          />
          <Button size="sm" asChild>
            <Link href={`/commitments/new?project=${encodeURIComponent(projectId)}`}>
              <BilingualText en={CMT.two_minutes.en} el={CMT.two_minutes.el} compact />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  // The section's name sits above the card, not as a small heading inside
  // it: inside, it outranked nothing and sat over the card's own title.
  return (
    <section aria-labelledby={`project-need-${projectId}`} className="space-y-3">
      <h2 id={`project-need-${projectId}`} className="text-base font-semibold text-foreground">
        <BilingualText en={CMT.needs_cards.en} el={CMT.needs_cards.el} compact />
      </h2>
      <Card>
      <CardContent>
        <NeedCard
          card={card}
          compact
          showOwner={!card.isMine}
          actions={
            <Button size="sm" asChild>
              <Link href={`/commitments/${encodeURIComponent(card.id)}`}>
                <BilingualText
                  en={card.isMine ? `${CMT.responses.en} · ${card.interestCount ?? 0}` : card.myThreadId ? CMT.open_board.en : CMT.interest_title.en}
                  el={card.isMine ? `${CMT.responses.el} · ${card.interestCount ?? 0}` : card.myThreadId ? CMT.open_board.el : CMT.interest_title.el}
                  compact
                />
              </Link>
            </Button>
          }
        />
      </CardContent>
      </Card>
    </section>
  );
}

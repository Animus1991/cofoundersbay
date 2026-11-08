'use client';

import { useQuery } from '@tanstack/react-query';
import { HomeNextStep } from '@/components/dashboard/HomeNextStep';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { listMilestones, listResearchBoards } from '@/lib/api';
import { PREVIEW_MILESTONE_EL } from '@/lib/i18n/strings-milestones';
import { orderMilestones } from '@/lib/milestone-order';
import { qk } from '@/lib/query-keys';

/**
 * The one thing in progress (docs §116): the research board last worked on,
 * else the next open milestone. Nothing when there is neither.
 */
export function HomeContinue() {
  const { ask } = useAskAssistant();
  const boards = useQuery({
    queryKey: qk('research-boards', false),
    queryFn: () => listResearchBoards({ archived: false }),
    staleTime: 60_000,
    retry: 0,
  });
  const milestones = useQuery({
    queryKey: qk('milestones', 'all', 'all'),
    queryFn: () => listMilestones({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });

  const board = [...(boards.data?.boards ?? [])]
    .filter((item) => item && !item.isArchived)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];
  if (board) {
    return (
      <HomeNextStep
        kickerEn="Continue"
        kickerEl="Συνεχίστε"
        title={board.title}
        href={`/research/${board.id}`}
        actionEn="Continue"
        actionEl="Συνέχεια"
        askEn="Ask"
        askEl="Ρωτήστε"
        onAsk={() => ask({
          en: `What should I do next on the board “${board.title}”?`,
          el: `Τι να κάνω στη συνέχεια στον πίνακα «${board.title}»;`,
        })}
      />
    );
  }
  if (boards.isLoading) return null;

  const next = orderMilestones(milestones.data?.milestones ?? []).find((m) => m.status !== 'completed' && m.status !== 'cancelled');
  if (!next) return null;
  const titleEl = PREVIEW_MILESTONE_EL[next.title]?.title ?? next.title;
  return (
    <HomeNextStep
      kickerEn="Continue"
      kickerEl="Συνεχίστε"
      titleEn={next.title}
      titleEl={titleEl}
      href="/milestones"
      actionEn="Continue"
      actionEl="Συνέχεια"
      askEn="Ask"
      askEl="Ρωτήστε"
      onAsk={() => ask({
        en: `What is left on the milestone “${next.title}”?`,
        el: `Τι απομένει στο ορόσημο «${titleEl}»;`,
      })}
    />
  );
}

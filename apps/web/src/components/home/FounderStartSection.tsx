'use client';

import { useQuery } from '@tanstack/react-query';
import { PhoneFold } from '@/components/common/PhoneFold';
import { FounderPaths } from '@/components/dashboard/FounderPaths';
import { WhatsNewPanel } from '@/components/dashboard/WhatsNewPanel';
import { NextActionBanner, deriveNextAction } from '@/components/gamification/NextActionBanner';
import { OnboardingChecklist, buildOnboardingSteps, useOnboardingChecklistDismissed } from '@/components/gamification/OnboardingChecklist';
import { useRoleOptional } from '@/contexts/RoleContext';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { getMeProfile, getVentureReadiness, listConnectionRequests } from '@/lib/api';
import { starterAudience } from '@/lib/copilot-starters';
import { saysLookingFor } from '@/lib/match-explain';
import { qk, queryKeys } from '@/lib/query-keys';

/**
 * A founder's way in, on Help (docs §116): the first steps, the next action,
 * the three doors and what is new. They left the first page, where they stood between the
 * founder and the people; here they are what someone came to read.
 */
export function FounderStartSection() {
  const role = useRoleOptional()?.primaryRole;
  const isFounder = starterAudience(role) === 'founder';
  const { data: profile } = useQuery({ queryKey: queryKeys.me.profile(), queryFn: getMeProfile, enabled: isFounder, staleTime: 60_000, retry: 0 });
  const { data: vrs } = useQuery({ queryKey: qk('readiness', 'venture'), queryFn: getVentureReadiness, enabled: isFounder, staleTime: 60_000, retry: 0 });
  const { data: requests } = useQuery({ queryKey: queryKeys.connections.pendingReceived(), queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }), enabled: isFounder, retry: 0 });
  const { messages: unreadMessages } = useUnreadCounts();
  const checklistDismissed = useOnboardingChecklistDismissed();
  if (!isFounder) return null;

  const me = profile?.profile;
  const steps = buildOnboardingSteps({
    hasProfile: Boolean(me?.displayName && me?.headline),
    hasPreferences: saysLookingFor(me),
    hasConnection: (vrs?.signals?.connectionCount ?? 0) > 0,
    hasBoard: (vrs?.signals?.boardCount ?? 0) > 0,
    hasArtifact: (vrs?.signals?.docCount ?? 0) > 0,
  });
  // Once the checklist is out of the way; both at once say the same thing twice.
  const nextAction = steps.every((step) => step.done) || checklistDismissed === true
    ? deriveNextAction({
        hasProfile: Boolean(me?.displayName && me?.headline),
        hasPreferences: saysLookingFor(me),
        connectionCount: vrs?.signals?.connectionCount ?? 0,
        boardCount: vrs?.signals?.boardCount ?? 0,
        docCount: vrs?.signals?.docCount ?? 0,
        vrsLowestKey: vrs?.lowestDimension?.key,
        pendingRequests: requests?.connections?.filter((r: { status?: string }) => r.status === 'pending')?.length ?? 0,
        unreadMessages,
      })
    : null;

  return (
    <div className="space-y-4" data-founder-start="">
      <OnboardingChecklist steps={steps} />
      {nextAction ? <NextActionBanner action={nextAction} /> : null}
      <FounderPaths />
      <PhoneFold title={{ en: 'What’s new', el: 'Τι νέο υπάρχει' }}>
        <WhatsNewPanel audience="founder" />
      </PhoneFold>
    </div>
  );
}

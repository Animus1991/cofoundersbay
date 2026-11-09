'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { VentureReadinessCard } from '@/components/gamification/VentureReadinessCard';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { Button } from '@/components/ui/button';
import { useRoleOptional } from '@/contexts/RoleContext';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { getVentureReadiness } from '@/lib/api';
import { starterAudience } from '@/lib/copilot-starters';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { ASK } from '@/lib/page-questions';
import { qk } from '@/lib/query-keys';

/**
 * The founder's progress score, with what moves it, on Overview (docs §120). It
 * measures activity on the platform, so it stays off Readiness, whose own score
 * is the company's readiness for investors.
 */
export function FounderProgressCard() {
  const { ask } = useAskAssistant();
  const isFounder = starterAudience(useRoleOptional()?.primaryRole) === 'founder';
  const { data } = useQuery({ queryKey: qk('readiness', 'venture'), queryFn: () => getVentureReadiness(), enabled: isFounder, staleTime: 60_000, retry: 0 });
  if (!isFounder || !data) return null;
  return (
    <div id="founder-progress" className="scroll-mt-24">
      <VentureReadinessCard
        data={data}
        footer={(
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button variant="outline" size="md" className="w-full gap-1.5" asChild>
                <Link href="/builder" className="w-full">
                  <CfbGlyph name="builder" className="icon-sm" />
                  <BilingualText en="Open Builder" el="Άνοιγμα Builder" compact wrap />
                </Link>
              </Button>
              <Button variant="outline" size="md" className="w-full gap-1.5" asChild>
                <Link href="/expert-reviews" className="w-full">
                  <CfbGlyph name="award" className="icon-sm" />
                  <BilingualText en="Get Expert Review" el="Αξιολόγηση ειδικού" compact wrap />
                </Link>
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-auto min-h-9 w-full gap-1.5 py-1.5 leading-snug" onClick={() => ask(ASK.dashReadiness)}>
              <CfbGlyph name="spark" className="icon-sm shrink-0" aria-hidden="true" />
              <BilingualText en={dashboardEn('ask_ai_readiness')} el={dashboardEl('ask_ai_readiness')} compact wrap />
            </Button>
          </div>
        )}
      />
    </div>
  );
}

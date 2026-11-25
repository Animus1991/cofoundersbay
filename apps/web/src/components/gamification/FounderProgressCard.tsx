'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { VentureReadinessCard } from '@/components/gamification/VentureReadinessCard';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { Button } from '@/components/ui/button';
import { useRoleOptional } from '@/contexts/RoleContext';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { getVentureReadiness } from '@/lib/api';
import { starterAudience } from '@/lib/copilot-starters';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { ventureDimensionEl } from '@/lib/i18n/venture-dimensions';
import { ASK } from '@/lib/page-questions';
import { qk } from '@/lib/query-keys';

/**
 * The founder's progress score, with what moves it, on Overview (docs §120). It
 * measures activity on the platform, so it stays off Readiness, whose own score
 * is the company's readiness for investors.
 */
export function FounderProgressCard() {
  const isFounder = starterAudience(useRoleOptional()?.primaryRole) === 'founder';
  const { data } = useQuery({ queryKey: qk('readiness', 'venture'), queryFn: () => getVentureReadiness(), enabled: isFounder, staleTime: 60_000, retry: 0 });
  if (!isFounder || !data) return null;
  return (
    <div id="founder-progress" className="scroll-mt-24">
      <VentureReadinessCard
        data={data}
        aside={(
          <AIInsightButton
            variant="card"
            prompt={ASK.dashReadiness}
            label={dashboardEn('ask_ai_readiness')}
            labelEl={dashboardEl('ask_ai_readiness')}
          />
        )}
        footer={(
          /* One row from sm, each button as wide as its words: three bars
             across the whole card read as three banners (docs §147). */
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center" data-progress-actions="">
            {/* One next action: what would move the score most is the lowest
                dimension, so its own page is the card's one filled button. */}
            {data.lowestDimension?.href ? (
              <Button size="md" className="w-full gap-1.5 sm:w-auto" asChild>
                <Link href={data.lowestDimension.href} data-progress-next="">
                  <BilingualText
                    en={`Raise your lowest: ${data.lowestDimension.label} (${data.lowestDimension.score}%)`}
                    el={`Ανεβάστε τη χαμηλότερη: ${ventureDimensionEl(data.lowestDimension.key, data.lowestDimension.label)} (${data.lowestDimension.score}%)`}
                    compact
                    wrap
                  />
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" size="md" className="w-full gap-1.5 sm:w-auto" asChild>
              <Link href="/builder">
                <CfbGlyph name="builder" className="icon-sm" />
                <BilingualText en="Open Builder" el="Άνοιγμα Builder" compact wrap />
              </Link>
            </Button>
            <Button variant="outline" size="md" className="w-full gap-1.5 sm:w-auto" asChild>
              <Link href="/expert-reviews">
                <CfbGlyph name="award" className="icon-sm" />
                <BilingualText en="Get Expert Review" el="Αξιολόγηση ειδικού" compact wrap />
              </Link>
            </Button>
          </div>
        )}
      />
    </div>
  );
}

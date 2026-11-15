'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeaturePlan } from '@/hooks/useFeaturePlan';
import { PLAN_FEATURE_LABELS, type PlanFeatureKey } from '@/lib/billing';
import { BilingualText } from '@/components/common/BilingualText';

type FeatureGateProps = {
  feature: PlanFeatureKey;
  /** Content shown when the user HAS access */
  children: ReactNode;
  /** Content shown when blocked. Defaults to an upgrade prompt. */
  fallback?: ReactNode;
  /** If true, renders nothing when blocked instead of the fallback */
  silent?: boolean;
};

/**
 * Wraps any UI element with a plan-based access check.
 * When the user lacks the required feature, either the fallback or a
 * default upgrade prompt is shown.
 *
 * Usage:
 *   <FeatureGate feature="advancedMatching">
 *     <AdvancedMatchingUI />
 *   </FeatureGate>
 */
export function FeatureGate({ feature, children, fallback, silent }: FeatureGateProps) {
  const { hasFeature, isLoading } = useFeaturePlan();

  if (isLoading) return null;
  if (hasFeature(feature)) return <>{children}</>;
  if (silent) return null;
  if (fallback) return <>{fallback}</>;

  return <UpgradePrompt feature={feature} />;
}

function UpgradePrompt({ feature }: { feature: PlanFeatureKey }) {
  // The pricing page's own labels, in both languages: this prompt was English only.
  const label = PLAN_FEATURE_LABELS[feature] ?? { en: feature, el: feature };
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted" data-keep-icon="">
        <Lock className="icon-md text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          <BilingualText en={`${label.en} needs another plan`} el={`${label.el}: χρειάζεται άλλο πρόγραμμα`} wrap />
        </p>
        <p className="text-xs text-muted-foreground">
          <BilingualText en="Your current plan does not include it." el="Το τρέχον πρόγραμμά σας δεν το περιλαμβάνει." wrap />
        </p>
      </div>
      <Button size="sm" className="gap-2" asChild>
        <Link href="/pricing"><BilingualText en="See plans" el="Δείτε τα προγράμματα" compact /></Link>
      </Button>
    </div>
  );
}

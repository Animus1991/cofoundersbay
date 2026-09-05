'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { STATUS } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';
import { getVentureReadiness, type VentureReadiness } from '@/lib/api';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Tier thresholds are shared by the gauge, the tier label and every dimension
 * bar, so a colour always means the same band throughout the card.
 * Uses semantic status tokens rather than raw palette classes so the hues stay
 * correct on the alliance / cofounder / system themes too, not just light+dark.
 */
function scoreTier(score: number): {
  labelEn: string; labelEl: string; color: string; ring: string; bar: string;
} {
  if (score >= 80) return { labelEn: 'High',     labelEl: 'Υψηλή',    color: STATUS.success.text, ring: 'stroke-status-success', bar: '[&>div]:bg-status-success' };
  if (score >= 55) return { labelEn: 'Growing',  labelEl: 'Αυξανόμενη', color: STATUS.warning.text, ring: 'stroke-status-warning', bar: '[&>div]:bg-status-warning' };
  if (score >= 30) return { labelEn: 'Early',    labelEl: 'Πρώιμη',   color: STATUS.info.text,    ring: 'stroke-status-info',    bar: '[&>div]:bg-status-info'    };
  return             { labelEn: 'Building', labelEl: 'Σε δόμηση', color: 'text-muted-foreground', ring: 'stroke-muted-foreground', bar: '[&>div]:bg-muted-foreground' };
}

/* ── Sub-component: Radial gauge ─────────────────────────────────────────── */

function RadialGauge({ score }: { score: number }) {
  const { labelEn, labelEl, color, ring } = scoreTier(score);
  const circumference = 2 * Math.PI * 15.5;
  const dash = (score / 100) * circumference;

  return (
    <div
      className="relative h-20 w-20 shrink-0"
      role="img"
      aria-label={bilingualAria(
        `Venture readiness ${score} out of 100 — ${labelEn}`,
        `Ετοιμότητα εγχειρήματος ${score} στα 100 — ${labelEl}`,
      )}
    >
      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
        <circle
          cx="18" cy="18" r="15.5"
          fill="none" strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          className={ring}
          strokeLinecap="round"
        />
      </svg>
      {/* The number needs a unit to be self-explanatory: 42 alone is ambiguous. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-base font-bold leading-none text-foreground tabular-nums">
          {score}
          <span className="text-xs font-medium text-muted-foreground">/100</span>
        </span>
        <span className={cn('mt-0.5 text-xs font-medium', color)}>{labelEn}</span>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

interface VentureReadinessCardProps {
  /** Pre-fetched data; if omitted, component fetches itself */
  data?: VentureReadiness;
  /** Show a compact inline version (sidebar) vs full card */
  compact?: boolean;
  className?: string;
  /**
   * Optional actions rendered below the dimension list — used by the founder
   * dashboard so readiness has exactly one home instead of two cards showing
   * the same score.
   */
  footer?: ReactNode;
}

export function VentureReadinessCard({ data: prefetched, compact = false, className, footer }: VentureReadinessCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['venture-readiness'],
    queryFn: getVentureReadiness,
    enabled: !prefetched,
    staleTime: 5 * 60 * 1000,
  });

  const vrs = prefetched ?? data;

  if (isLoading && !vrs) {
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!vrs) return null;

  const { labelEn: tierEn, labelEl: tierEl, color: tierColor } = scoreTier(vrs.overall);
  const dimensionCount = vrs.dimensions.length;

  return (
    <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-indigo-500/5', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={cn('flex items-center gap-2', compact ? 'text-sm' : 'text-base')}>
            <TrendingUp className="icon-sm text-primary-accessible" aria-hidden="true" />
            <BilingualText en="Venture Readiness Score" el="Βαθμός ετοιμότητας εγχειρήματος" />
          </CardTitle>
          <Link href="/achievements" className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-1">
              <BilingualText en="History" el="Ιστορικό" compact />
              <ArrowRight className="icon-sm" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3 flex items-center gap-4">
          <RadialGauge score={vrs.overall} />
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-semibold', tierColor)}>
              <BilingualText en={`${tierEn} readiness`} el={`${tierEl} ετοιμότητα`} />
            </p>
            {/* Count comes from the payload — it was hardcoded to 6 while the API returns 8. */}
            <p className="mt-0.5 text-xs text-muted-foreground">
              <BilingualText
                en={`Weighted across ${dimensionCount} dimensions of founder progress`}
                el={`Ζυγισμένος σε ${dimensionCount} διαστάσεις προόδου ιδρυτή`}
              />
            </p>
            {vrs.lowestDimension && (
              <p className={cn('mt-2 flex items-center gap-1.5 text-xs', STATUS.warning.text)}>
                <Zap className="icon-sm shrink-0" aria-hidden="true" />
                <span>
                  <BilingualText en="Weakest" el="Ασθενέστερη" compact />
                  {': '}
                  <Link href={vrs.lowestDimension.href} className="font-medium underline underline-offset-2">
                    {vrs.lowestDimension.label}
                  </Link>{' '}
                  ({vrs.lowestDimension.score}%)
                </span>
              </p>
            )}
          </div>
        </div>

        <ul className={cn('space-y-1.5', compact && 'hidden')}>
          {vrs.dimensions.map((dim) => {
            const { color, bar } = scoreTier(dim.score);
            return (
              <li key={dim.key}>
                <Link href={dim.href} className="group block rounded-sm">
                  <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground transition-colors group-hover:text-foreground">
                      {dim.label}
                      {/* Spell out what the parenthesised number is — a bare (15%) next to
                          another percentage reads as a second score. */}
                      <span className="ml-1 text-muted-foreground/60">
                        · <BilingualText en={`weight ${dim.weight}%`} el={`βάρος ${dim.weight}%`} compact />
                      </span>
                    </span>
                    <span className={cn('shrink-0 font-semibold tabular-nums', color)}>{dim.score}%</span>
                  </div>
                  <Progress value={dim.score} className={cn('h-1.5 transition-all', bar)} />
                </Link>
              </li>
            );
          })}
        </ul>

        {footer && <div className="mt-4 border-t border-border/60 pt-3">{footer}</div>}
      </CardContent>
    </Card>
  );
}

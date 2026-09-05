'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getVentureReadiness, type VentureReadiness } from '@/lib/api';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function scoreTier(score: number): { label: string; color: string; ring: string } {
  if (score >= 80) return { label: 'High',    color: 'text-emerald-600', ring: 'stroke-emerald-500' };
  if (score >= 55) return { label: 'Growing', color: 'text-amber-600',   ring: 'stroke-amber-500'   };
  if (score >= 30) return { label: 'Early',   color: 'text-blue-600',    ring: 'stroke-blue-500'    };
  return               { label: 'Building', color: 'text-muted-foreground', ring: 'stroke-muted-foreground' };
}

/* ── Sub-component: Radial gauge ─────────────────────────────────────────── */

function RadialGauge({ score }: { score: number }) {
  const { label, color, ring } = scoreTier(score);
  const circumference = 2 * Math.PI * 15.5;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
        <circle
          cx="18" cy="18" r="15.5"
          fill="none" strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          className={ring}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground tabular-nums">{score}</span>
        <span className={cn('text-[10px] font-medium', color)}>{label}</span>
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
}

export function VentureReadinessCard({ data: prefetched, compact = false, className }: VentureReadinessCardProps) {
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

  const { label: tierLabel, color: tierColor } = scoreTier(vrs.overall);

  return (
    <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-indigo-500/5', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={cn('flex items-center gap-2', compact ? 'text-sm' : 'text-base')}>
            <TrendingUp className="h-4 w-4 text-primary-accessible" />
            Venture Readiness Score
          </CardTitle>
          <Link href="/achievements">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              History <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-3">
          <RadialGauge score={vrs.overall} />
          <div className="flex-1 min-w-0">
            <p className={cn('font-semibold text-sm', tierColor)}>{tierLabel} Readiness</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Weighted across 6 dimensions of founder progress
            </p>
            {vrs.lowestDimension && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Lowest: <Link href={vrs.lowestDimension.href} className="font-medium underline underline-offset-2">
                    {vrs.lowestDimension.label}
                  </Link> ({vrs.lowestDimension.score}%)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={cn('space-y-1.5', compact && 'hidden')}>
          {vrs.dimensions.map((dim) => {
            const { color } = scoreTier(dim.score);
            return (
              <Link key={dim.key} href={dim.href} className="group block">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {dim.label}
                    <span className="text-muted-foreground/50 ml-1">({dim.weight}%)</span>
                  </span>
                  <span className={cn('font-semibold tabular-nums', color)}>{dim.score}%</span>
                </div>
                <Progress
                  value={dim.score}
                  className={cn(
                    'h-1.5 transition-all',
                    dim.score >= 80 ? '[&>div]:bg-emerald-500' :
                    dim.score >= 55 ? '[&>div]:bg-amber-500' :
                    dim.score >= 30 ? '[&>div]:bg-blue-500' :
                    '[&>div]:bg-muted-foreground',
                  )}
                />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

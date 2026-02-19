'use client';

import { Users, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/common/StatCard';
import { cn } from '@/lib/utils';

export type DashboardStatsData = {
  activeProfiles: number;
  matchesThisWeek: number;
  trendPercent?: number;
};

const defaultData: DashboardStatsData = {
  activeProfiles: 2430,
  matchesThisWeek: 148,
  trendPercent: 12,
};

type DashboardStatsProps = {
  data?: DashboardStatsData | null;
  className?: string;
};

export function DashboardStats({ data = defaultData, className }: DashboardStatsProps) {
  const stats = data ?? defaultData;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Active profiles"
            value={stats.activeProfiles.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
            trend={stats.trendPercent != null ? { value: stats.trendPercent, label: 'vs last week' } : undefined}
          />
          <StatCard
            label="Matches this week"
            value={String(stats.matchesThisWeek)}
            icon={<Zap className="h-5 w-5" />}
          />
        </div>
        {/* Mini chart placeholder - bar style */}
        <div className="flex items-end gap-1 rounded-lg bg-muted/40 p-3" aria-hidden>
          {[65, 80, 45, 90, 70, 85, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-primary/30 transition-all hover:bg-primary/50"
              style={{ height: `${h}%`, minHeight: 4 }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { BarChart3, Download, RefreshCw, Rocket, TrendingUp, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { downloadCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '@/lib/api';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const UserRoleChart = dynamic(
  () => import('../dashboard/Charts').then((m) => ({ default: m.UserRoleChart })),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-lg bg-muted/40" /> },
);

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30d');

  /*
   * Six figures written into the source, over an `admin/stats` endpoint that
   * counts every one of them. `usersByRole` is what the role tiles read, so
   * the headline and the breakdown below it are the same arithmetic instead
   * of two lists that happen to add up.
   *
   * Tenants read a dash: the platform stats count users, connections and
   * content, not workspaces, and a tenant count is not derivable from them.
   */
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    staleTime: 60_000,
    retry: 0,
  });

  const stats = data?.stats;
  const byRole = stats?.usersByRole ?? {};
  const METRICS = {
    totalUsers: stats?.totalUsers ?? null,
    activeUsers: stats?.activeUsersThisMonth ?? null,
    totalStartups: byRole.founder ?? null,
    totalMentors: byRole.mentor ?? null,
    totalInvestors: byRole.investor ?? null,
    totalTenants: null as number | null,
  };
  const dash = '\u2014';

  return (
    <AppShell
      title="Global analytics"
      description="Platform growth, engagement, and role distribution — export for board or investor updates."
      showHelp
      actions={
        <div className="flex flex-wrap gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger aria-label="Time range" className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          {/* Both had no handler. */}
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={cn('icon-sm mr-1.5', isFetching && 'animate-spin')} aria-hidden="true" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv('platform-analytics', ['metric', 'value'], [
                ...Object.entries(METRICS).map(([k, v]) => [k, v ?? '']),
                ...Object.entries(byRole).map(([role, n]) => [`users_${role}`, n as number]),
              ])
            }
          >
            <Download className="icon-sm mr-1.5" aria-hidden="true" /> Export
          </Button>
        </div>
      }
    >
      <HelpCallout id="admin-analytics" title="Reading these metrics">
        <p>
          <strong>Active users</strong> logged in during the selected range. Role charts show signup mix — use this to
          balance supply (mentors/investors) vs demand (founders). Tenant count reflects white-label communities.
        </p>
      </HelpCallout>

      <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total users', value: METRICS.totalUsers ?? dash, icon: Users },
          { label: 'Active users', value: METRICS.activeUsers ?? dash, icon: TrendingUp },
          { label: 'Startups', value: METRICS.totalStartups ?? dash, icon: Rocket },
          { label: 'Mentors', value: METRICS.totalMentors ?? dash, icon: BarChart3 },
          { label: 'Investors', value: METRICS.totalInvestors ?? dash, icon: TrendingUp },
          { label: 'Tenants', value: METRICS.totalTenants ?? dash, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="icon-sm" />
                <span className="text-sm">{label}</span>
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums">{value.toLocaleString('en-GB')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Users by role</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRoleChart
            data={[
              // The same `usersByRole` the tiles above read, so the chart and
              // the headline cannot disagree about how many mentors there are.
              { name: 'Founders', value: byRole.founder ?? 0 },
              { name: 'Mentors', value: byRole.mentor ?? 0 },
              { name: 'Investors', value: byRole.investor ?? 0 },
              {
                name: 'Other',
                value: Math.max(
                  0,
                  (stats?.totalUsers ?? 0)
                    - (byRole.founder ?? 0)
                    - (byRole.mentor ?? 0)
                    - (byRole.investor ?? 0),
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}

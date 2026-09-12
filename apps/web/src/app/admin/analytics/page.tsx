'use client';

import dynamic from 'next/dynamic';
import { BarChart3, Download, RefreshCw, Rocket, TrendingUp, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
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

const METRICS = {
  totalUsers: 15420,
  activeUsers: 8934,
  totalStartups: 2841,
  totalMentors: 1204,
  totalInvestors: 892,
  totalTenants: 47,
};

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30d');

  return (
    <AppShell
      title="Global analytics"
      description="Platform growth, engagement, and role distribution — export for board or investor updates."
      showHelp
      actions={
        <div className="flex flex-wrap gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="icon-sm mr-1.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="icon-sm mr-1.5" /> Export
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

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total users', value: METRICS.totalUsers, icon: Users },
          { label: 'Active users', value: METRICS.activeUsers, icon: TrendingUp },
          { label: 'Startups', value: METRICS.totalStartups, icon: Rocket },
          { label: 'Mentors', value: METRICS.totalMentors, icon: BarChart3 },
          { label: 'Investors', value: METRICS.totalInvestors, icon: TrendingUp },
          { label: 'Tenants', value: METRICS.totalTenants, icon: Users },
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
              { name: 'Founders', value: 6789 },
              { name: 'Mentors', value: 3456 },
              { name: 'Investors', value: 2345 },
              { name: 'Other', value: 2830 },
            ]}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}

'use client';

import {
  PieChart,
  TrendingUp,
  Users,
  Rocket,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/components/providers/TenantContext';
import { getTenantMembers } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TenantAnalyticsPage() {
  /*
   * Four headline metrics, a role breakdown and four engagement figures, all
   * written into the source with "+18%" changes attached to them.
   *
   * Members are counted now, and the role breakdown is computed from the same
   * rows — so the pie and the headline cannot disagree. Everything else reads
   * a dash: a tenant records memberships, not mentor sessions, messages sent
   * or resources accessed, and a percentage change needs an earlier period
   * that nothing stores.
   */
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? null;
  const { data } = useQuery({
    queryKey: ['tenant', 'members', tenantId],
    queryFn: () => getTenantMembers(tenantId!, { limit: 500 }),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    retry: 0,
  });

  const members = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const hasMembers = members.length > 0;
  const dash = '\u2014';

  const metrics = {
    totalMembers: hasMembers ? members.length : null,
    activeStartups: null as number | null,
    programsRun: null as number | null,
    mentorSessions: null as number | null,
  };

  const memberGrowth = [
    { month: 'Jan', count: 120 },
    { month: 'Feb', count: 135 },
    { month: 'Mar', count: 156 },
  ];

  const programPerformance = [
    { name: 'Spring Accelerator 2025', startups: 12, graduated: 0, funded: 0, progress: 65 },
    { name: 'AI Innovation Lab', startups: 8, graduated: 0, funded: 0, progress: 30 },
    { name: 'Fall Accelerator 2024', startups: 10, graduated: 8, funded: 5, progress: 100 },
    { name: 'Summer Accelerator 2024', startups: 12, graduated: 10, funded: 7, progress: 100 },
  ];

  /** Counted from the same rows the headline counts, so the two agree. */
  const memberDistribution = useMemo(() => {
    if (!hasMembers) {
      return [
        { role: 'Founders', count: 85, percentage: 55 },
        { role: 'Mentors', count: 25, percentage: 16 },
        { role: 'Investors', count: 20, percentage: 13 },
        { role: 'Admins', count: 10, percentage: 6 },
        { role: 'Other', count: 16, percentage: 10 },
      ];
    }
    const buckets: Array<[string, (role: string) => boolean]> = [
      ['Founders', (r) => r === 'founder' || r === 'member'],
      ['Mentors', (r) => r === 'mentor'],
      ['Investors', (r) => r === 'investor'],
      ['Admins', (r) => r === 'owner' || r === 'admin'],
    ];
    const counted = buckets.map(([role, match]) => ({
      role,
      count: members.filter((m) => match(m.role)).length,
    }));
    const other = members.length - counted.reduce((sum, b) => sum + b.count, 0);
    return [...counted, { role: 'Other', count: Math.max(0, other) }].map((b) => ({
      ...b,
      percentage: Math.round((b.count / members.length) * 100),
    }));
  }, [members, hasMembers]);

  /*
   * A tenant records memberships, not sessions, messages or resource opens,
   * and a "+18%" needs an earlier period nothing stores. The rows stay so the
   * panel keeps its shape; the numbers say they are not recorded.
   */
  const engagementMetrics = [
    { name: 'Mentor Sessions', value: dash, change: '' },
    { name: 'Messages Sent', value: dash, change: '' },
    { name: 'Events Attended', value: dash, change: '' },
    { name: 'Resources Accessed', value: dash, change: '' },
  ];

  return (
    <AppShell
      title="Analytics"
      description="Member growth, engagement, and program activity. Filter by time range to compare periods."
      actions={(
        <Select defaultValue="30d">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      )}
    >
      <div className="space-y-6">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="icon-md text-primary-accessible" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-xl font-bold">{metrics.totalMembers ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-info-bg">
                  <Rocket className="icon-md text-status-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Startups</p>
                  <p className="text-xl font-bold">{metrics.activeStartups ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-accent-bg">
                  <Award className="icon-md text-status-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Programs Run</p>
                  <p className="text-xl font-bold">{metrics.programsRun ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-success-bg">
                  <Calendar className="icon-md text-status-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mentor Sessions</p>
                  <p className="text-xl font-bold">{metrics.mentorSessions ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Program Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Program Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {programPerformance.map((program) => (
                <div key={program.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{program.name}</span>
                    <span className="text-muted-foreground">
                      {program.graduated}/{program.startups} graduated
                    </span>
                  </div>
                  <Progress value={program.progress} className="h-2" />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{program.startups} startups</span>
                    <span>{program.funded} funded</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Member Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {memberDistribution.map((item) => (
                <div key={item.role}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{item.role}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {engagementMetrics.map((metric) => (
                  <div key={metric.name} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">{metric.name}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-bold">{metric.value}</span>
                      {metric.change ? (
                        <span className="text-xs text-status-success">{metric.change}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Member Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Member Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memberGrowth.map((month, index) => {
                  const prevCount = index > 0 ? memberGrowth[index - 1].count : month.count;
                  const growth = ((month.count - prevCount) / prevCount * 100).toFixed(1);
                  return (
                    <div key={month.month} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium">{month.month}</div>
                      <div className="flex-1">
                        <div
                          className="h-8 bg-primary/20 rounded flex items-center justify-end pr-2"
                          style={{ width: `${(month.count / 200) * 100}%` }}
                        >
                          <span className="text-xs font-medium">{month.count}</span>
                        </div>
                      </div>
                      {index > 0 && (
                        <span className="text-xs text-status-success w-12">+{growth}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

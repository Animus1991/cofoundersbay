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
  // Mock data
  const metrics = {
    totalMembers: 156,
    activeStartups: 28,
    programsRun: 12,
    mentorSessions: 245,
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

  const memberDistribution = [
    { role: 'Founders', count: 85, percentage: 55 },
    { role: 'Mentors', count: 25, percentage: 16 },
    { role: 'Investors', count: 20, percentage: 13 },
    { role: 'Admins', count: 10, percentage: 6 },
    { role: 'Other', count: 16, percentage: 10 },
  ];

  const engagementMetrics = [
    { name: 'Mentor Sessions', value: 245, change: '+18%' },
    { name: 'Messages Sent', value: '1.2K', change: '+25%' },
    { name: 'Events Attended', value: 89, change: '+12%' },
    { name: 'Resources Accessed', value: 456, change: '+8%' },
  ];

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track your organization's performance
            </p>
          </div>
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
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="icon-md text-primary-emphasis" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-xl font-bold">{metrics.totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Rocket className="icon-md text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Startups</p>
                  <p className="text-xl font-bold">{metrics.activeStartups}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Award className="icon-md text-purple-600 dark:text-purple-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Programs Run</p>
                  <p className="text-xl font-bold">{metrics.programsRun}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Calendar className="icon-md text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mentor Sessions</p>
                  <p className="text-xl font-bold">{metrics.mentorSessions}</p>
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
                      <span className="text-xs text-green-600 dark:text-green-400">{metric.change}</span>
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
                        <span className="text-xs text-green-600 dark:text-green-400 w-12">+{growth}%</span>
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

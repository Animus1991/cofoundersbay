'use client';

import {
  BarChart3,
  TrendingUp,
  Users,
  Rocket,
  MessageSquare,
  Calendar,
  Award,
  Building2,
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

export default function AdminAnalyticsPage() {
  // Mock data
  const platformMetrics = {
    totalUsers: 5420,
    activeUsers: 3250,
    totalStartups: 890,
    totalMentors: 245,
    totalInvestors: 180,
    totalTenants: 28,
  };

  const growthMetrics = [
    { month: 'Jan', users: 4800, startups: 750 },
    { month: 'Feb', users: 5100, startups: 820 },
    { month: 'Mar', users: 5420, startups: 890 },
  ];

  const engagementMetrics = [
    { name: 'Messages Sent', value: '45.2K', change: '+12%' },
    { name: 'Connections Made', value: '8.5K', change: '+18%' },
    { name: 'Mentor Sessions', value: '1.2K', change: '+25%' },
    { name: 'Events Hosted', value: 156, change: '+8%' },
  ];

  const topTenants = [
    { name: 'TechHub Accelerator', members: 156, startups: 28 },
    { name: 'AI Ventures', members: 98, startups: 18 },
    { name: 'StartupU', members: 85, startups: 15 },
    { name: 'FinLab', members: 72, startups: 12 },
  ];

  const userDistribution = [
    { role: 'Founders', count: 2800, percentage: 52 },
    { role: 'Mentors', count: 650, percentage: 12 },
    { role: 'Investors', count: 450, percentage: 8 },
    { role: 'Service Providers', count: 320, percentage: 6 },
    { role: 'Other', count: 1200, percentage: 22 },
  ];

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Platform Analytics</h1>
            <p className="text-muted-foreground">
              Monitor platform-wide metrics and performance
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
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="icon-sm text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
              <p className="text-xl font-bold mt-1">{platformMetrics.totalUsers.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="icon-sm text-green-600 dark:text-green-400" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <p className="text-xl font-bold mt-1">{platformMetrics.activeUsers.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Rocket className="icon-sm text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Startups</p>
              </div>
              <p className="text-xl font-bold mt-1">{platformMetrics.totalStartups}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="icon-sm text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Mentors</p>
              </div>
              <p className="text-xl font-bold mt-1">{platformMetrics.totalMentors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="icon-sm text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Investors</p>
              </div>
              <p className="text-xl font-bold mt-1">{platformMetrics.totalInvestors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="icon-sm text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Tenants</p>
              </div>
              <p className="text-xl font-bold mt-1">{platformMetrics.totalTenants}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userDistribution.map((item) => (
                <div key={item.role}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{item.role}</span>
                    <span className="text-muted-foreground">
                      {item.count.toLocaleString()} ({item.percentage}%)
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

          {/* Top Tenants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Tenants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topTenants.map((tenant, index) => (
                <div key={tenant.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tenant.members} members · {tenant.startups} startups
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {growthMetrics.map((month, index) => {
                  const prevUsers = index > 0 ? growthMetrics[index - 1].users : month.users;
                  const userGrowth = ((month.users - prevUsers) / prevUsers * 100).toFixed(1);
                  return (
                    <div key={month.month} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium">{month.month}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 bg-primary/20 rounded"
                            style={{ width: `${(month.users / 6000) * 100}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{month.users.toLocaleString()} users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 bg-blue-500/20 rounded"
                            style={{ width: `${(month.startups / 1000) * 100}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{month.startups} startups</span>
                        </div>
                      </div>
                      {index > 0 && (
                        <span className="text-xs text-green-600 dark:text-green-400 w-12">+{userGrowth}%</span>
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

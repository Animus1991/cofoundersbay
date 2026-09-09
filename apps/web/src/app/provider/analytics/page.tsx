'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageCircle,
  Star,
  Users,
  DollarSign,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import { useDemoData } from '@/contexts/DemoDataContext';

// ── Mock analytics data ───────────────────────────────────────────────────────

const MOCK_OVERVIEW = {
  profileViews: { value: 342, change: 18, trend: 'up' as const },
  inquiries: { value: 27, change: 35, trend: 'up' as const },
  activeProjects: { value: 6, change: 0, trend: 'neutral' as const },
  avgRating: { value: 4.8, change: -2, trend: 'down' as const },
  revenue: { value: 8400, change: 22, trend: 'up' as const },
  responseRate: { value: 94, change: 6, trend: 'up' as const },
};

const MOCK_WEEKLY_VIEWS = [
  { day: 'Mon', views: 42, inquiries: 3 },
  { day: 'Tue', views: 58, inquiries: 5 },
  { day: 'Wed', views: 35, inquiries: 2 },
  { day: 'Thu', views: 71, inquiries: 7 },
  { day: 'Fri', views: 63, inquiries: 6 },
  { day: 'Sat', views: 28, inquiries: 2 },
  { day: 'Sun', views: 19, inquiries: 1 },
];

const MOCK_CONVERSIONS = [
  { stage: 'Profile Views', count: 342, pct: 100, color: 'bg-blue-500' },
  { stage: 'Inquiry Sent', count: 27, pct: 7.9, color: 'bg-violet-500' },
  { stage: 'Response Given', count: 25, pct: 7.3, color: 'bg-primary' },
  { stage: 'Project Started', count: 18, pct: 5.3, color: 'bg-green-500' },
  { stage: 'Project Completed', count: 14, pct: 4.1, color: 'bg-emerald-600' },
];

const MOCK_TRAFFIC_SOURCES = [
  { source: 'Direct Search', visits: 148, pct: 43 },
  { source: 'Recommendations', visits: 89, pct: 26 },
  { source: 'Community Posts', visits: 62, pct: 18 },
  { source: 'Mentor Referrals', visits: 43, pct: 13 },
];

const MOCK_TOP_SERVICES = [
  { name: 'Legal Consultation', inquiries: 12, revenue: 3600, rating: 4.9 },
  { name: 'Contract Drafting', inquiries: 8, revenue: 2800, rating: 4.7 },
  { name: 'IP Registration', inquiries: 5, revenue: 2000, rating: 5.0 },
  { name: 'Fundraising Legal', inquiries: 2, revenue: 0, rating: null },
];


function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <ArrowUp className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />;
  if (trend === 'down') return <ArrowDown className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit = '',
  change,
  trend,
  format = 'number',
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unit?: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percent';
}) {
  const displayValue = format === 'currency'
    ? `$${value.toLocaleString()}`
    : format === 'percent'
    ? `${value}%`
    : value.toLocaleString();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="rounded-md bg-primary/10 p-1.5">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums">{displayValue}{unit}</p>
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs',
          trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
        )}>
          <TrendIcon trend={trend} />
          <span>{trend !== 'neutral' ? `${Math.abs(change)}%` : 'No change'} vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProviderAnalyticsPage() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();
  const [period, setPeriod] = useState('30d');

  const overview = showDemoData ? MOCK_OVERVIEW : null;
  const weeklyViews = showDemoData ? MOCK_WEEKLY_VIEWS : [];
  const conversions = showDemoData ? MOCK_CONVERSIONS : [];
  const trafficSources = showDemoData ? MOCK_TRAFFIC_SOURCES : [];
  const topServices = showDemoData ? MOCK_TOP_SERVICES : [];
  const maxViews = weeklyViews.length ? Math.max(...weeklyViews.map(d => d.views)) : 1;

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-60" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="icon-lg text-primary" aria-hidden="true" />
              Analytics
            </h1>
            <p className="text-muted-foreground">Track your profile performance and service metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
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
              <RefreshCw className="icon-sm" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Metric Grid */}
        {overview && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard icon={Eye} label="Profile Views" value={overview.profileViews.value} change={overview.profileViews.change} trend={overview.profileViews.trend} />
          <MetricCard icon={MessageCircle} label="Inquiries" value={overview.inquiries.value} change={overview.inquiries.change} trend={overview.inquiries.trend} />
          <MetricCard icon={Users} label="Active Projects" value={overview.activeProjects.value} change={overview.activeProjects.change} trend={overview.activeProjects.trend} />
          <MetricCard icon={Star} label="Avg. Rating" value={overview.avgRating.value} change={overview.avgRating.change} trend={overview.avgRating.trend} />
          <MetricCard icon={DollarSign} label="Revenue" value={overview.revenue.value} change={overview.revenue.change} trend={overview.revenue.trend} format="currency" />
          <MetricCard icon={Clock} label="Response Rate" value={overview.responseRate.value} change={overview.responseRate.change} trend={overview.responseRate.trend} format="percent" />
        </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Traffic</TabsTrigger>
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* Traffic */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Daily Views & Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-44">
                    {weeklyViews.map(d => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col gap-0.5">
                          <div
                            className="w-full rounded-t bg-primary/80 min-h-[2px] transition-all"
                            style={{ height: `${(d.views / maxViews) * 140}px` }}
                          />
                          <div
                            className="w-full bg-violet-500/70 min-h-[2px]"
                            style={{ height: `${(d.inquiries / 7) * 30}px` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{d.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary/80 inline-block" />Profile Views</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500/70 inline-block" />Inquiries</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trafficSources.map(src => (
                    <div key={src.source}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{src.source}</span>
                        <span className="font-medium">{src.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${src.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Funnel */}
          <TabsContent value="funnel">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Acquisition Funnel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversions.map((stage, i) => (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs">{stage.count.toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs tabular-nums">{stage.pct}%</Badge>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={cn('h-2 rounded-full transition-all', stage.color)}
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  Overall conversion rate: <span className="font-semibold text-foreground">4.1%</span> — above platform average of 2.8%
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {topServices.map(svc => (
                    <div key={svc.name} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">{svc.inquiries} inquiries</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${svc.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                      {svc.rating != null ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                          <span className="text-sm font-medium">{svc.rating}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs shrink-0">No reviews</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

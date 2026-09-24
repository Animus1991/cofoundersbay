'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  DollarSign,
  Eye,
  Filter,
  LineChart,
  PieChart,
  Rocket,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/useSession';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';
import { getMeProfile } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext?: string;
  trend?: { value: number; positive: boolean };
  href?: string;
}) {
  const content = (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            {trend && (
              <p className={cn('text-xs', trend.positive ? 'text-status-success' : 'text-status-danger')}>
                {trend.positive ? '+' : ''}{trend.value}% this month
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="icon-md text-primary-accessible" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function StartupCard({ startup }: { startup: any }) {
  const stageColors: Record<string, string> = {
    'pre-seed': 'bg-status-accent-bg text-status-accent border-status-accent-border',
    'seed': 'bg-status-info-bg text-status-info border-status-info-border',
    'series-a': 'bg-status-success-bg text-status-success border-status-success-border',
    'series-b': 'bg-status-warning-bg text-status-warning border-status-warning-border',
  };

  return (
    <Link
      href={`/investor/scouting`}
      className="group flex items-start gap-3 rounded-lg border p-3 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={startup.logoUrl} />
        <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible font-semibold">
          {startup.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{startup.name}</p>
          {startup.isHot && (
            <Badge variant="destructive" size="sm">HOT</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{startup.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" size="sm" className={cn(stageColors[startup.stage] || '')}>
            {startup.stage}
          </Badge>
          <span className="text-xs text-muted-foreground">{startup.industry}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-primary-accessible">{startup.raising}</p>
        <p className="text-xs text-muted-foreground">{startup.matchScore}% match</p>
      </div>
    </Link>
  );
}

function DealCard({ deal }: { deal: any }) {
  const statusColors: Record<string, string> = {
    'reviewing': 'bg-status-info-bg text-status-info',
    'due-diligence': 'bg-status-warning-bg text-status-warning',
    'negotiating': 'bg-status-accent-bg text-status-accent',
    'closed': 'bg-status-success-bg text-status-success',
    'passed': 'bg-gray-500/10 text-muted-foreground',
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={deal.logoUrl} />
        <AvatarFallback className="rounded-lg bg-muted">
          {deal.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{deal.name}</p>
        <p className="text-xs text-muted-foreground">{deal.stage} · {deal.amount}</p>
      </div>
      <Badge size="sm" className={cn(statusColors[deal.status] || '')}>
        {deal.status.replace('-', ' ')}
      </Badge>
    </div>
  );
}

function PortfolioItem({ company }: { company: any }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={company.logoUrl} />
        <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible">
          {company.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{company.name}</p>
        <p className="text-xs text-muted-foreground">Invested {company.investedDate}</p>
      </div>
      <div className="text-right">
        <p className={cn(
          'text-sm font-semibold',
          company.returnMultiple >= 1 ? 'text-status-success' : 'text-status-danger'
        )}>
          {company.returnMultiple}x
        </p>
        <p className="text-xs text-muted-foreground">{company.currentValue}</p>
      </div>
    </div>
  );
}

export default function InvestorDashboard() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName || 'Investor';

  const investorStats = showDemoData ? {
    dealFlow: 24,
    activeDeals: 5,
    portfolioCompanies: 12,
    totalInvested: '$2.4M',
    portfolioValue: '$8.7M',
    avgReturn: '3.6x',
  } : {
    dealFlow: 0,
    activeDeals: 0,
    portfolioCompanies: 0,
    totalInvested: '$0',
    portfolioValue: '$0',
    avgReturn: '—',
  };

  const trendingStartups = showDemoData ? [
    { id: '1', name: 'NeuralFlow AI', description: 'Enterprise AI automation platform', stage: 'seed', industry: 'AI/ML', raising: '$1.5M', matchScore: 92, isHot: true, logoUrl: null },
    { id: '2', name: 'GreenGrid', description: 'Sustainable energy management', stage: 'pre-seed', industry: 'CleanTech', raising: '$500K', matchScore: 87, isHot: false, logoUrl: null },
    { id: '3', name: 'HealthSync', description: 'Patient data interoperability', stage: 'seed', industry: 'HealthTech', raising: '$2M', matchScore: 84, isHot: true, logoUrl: null },
  ] : [];

  const activeDeals = showDemoData ? [
    { id: '1', name: 'TechVenture', stage: 'Seed', amount: '$500K', status: 'due-diligence', logoUrl: null },
    { id: '2', name: 'DataFlow', stage: 'Series A', amount: '$2M', status: 'negotiating', logoUrl: null },
    { id: '3', name: 'CloudScale', stage: 'Seed', amount: '$750K', status: 'reviewing', logoUrl: null },
  ] : [];

  const portfolio = showDemoData ? [
    { id: '1', name: 'AIStartup', investedDate: 'Jan 2024', returnMultiple: 2.4, currentValue: '$600K', logoUrl: null },
    { id: '2', name: 'FinTech Co', investedDate: 'Mar 2023', returnMultiple: 1.8, currentValue: '$450K', logoUrl: null },
    { id: '3', name: 'SaaS Platform', investedDate: 'Jun 2023', returnMultiple: 3.2, currentValue: '$800K', logoUrl: null },
  ] : [];

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${getTimeBasedGreeting()}, ${displayName}`}
      description="Pipeline health, deal flow, and portfolio performance — in one view."
      actions={
        <Badge variant="outline" className="gap-1.5">
          <DollarSign className="icon-sm" />
          Investor
        </Badge>
      }
    >
      <div className="space-y-6">

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={Briefcase}
            label="Deal Flow"
            value={investorStats.dealFlow}
            subtext="This month"
            trend={{ value: 18, positive: true }}
          />
          <StatCard
            icon={Target}
            label="Active Deals"
            value={investorStats.activeDeals}
            subtext="In pipeline"
          />
          <StatCard
            icon={Building2}
            label="Portfolio"
            value={investorStats.portfolioCompanies}
            subtext={investorStats.portfolioValue}
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Return"
            value={investorStats.avgReturn}
            subtext="Multiple"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trending Startups */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Rocket className="icon-sm text-primary-accessible" />
                    Trending Startups
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Had no handler; scouting is where startups are filtered. */}
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/investor/scouting">
                        <Filter className="mr-1.5 icon-sm" aria-hidden="true" />
                        Filter
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/discover">
                        View all <ArrowRight className="ml-1 icon-sm" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {trendingStartups.map((startup) => (
                  <StartupCard key={startup.id} startup={startup} />
                ))}
              </CardContent>
            </Card>

            {/* Active Deals */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="icon-sm text-primary-accessible" />
                    Active Deals
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/investor/pipeline">
                      View all <ArrowRight className="ml-1 icon-sm" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
                {activeDeals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active deals in pipeline
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Performance */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="icon-sm text-primary-accessible" />
                    Portfolio Companies
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/investor/portfolio">
                      View all <ArrowRight className="ml-1 icon-sm" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {portfolio.map((company) => (
                  <PortfolioItem key={company.id} company={company} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/investor/scouting">
                    <Search className="mr-2 icon-sm" />
                    Scout Startups
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/investor/watchlist">
                    <Star className="mr-2 icon-sm" />
                    My Watchlist
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/investor/pipeline">
                    <Target className="mr-2 icon-sm" />
                    Deal Pipeline
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/investor/portfolio">
                    <LineChart className="mr-2 icon-sm" />
                    Portfolio
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/investor/analytics">
                    <BarChart3 className="mr-2 icon-sm" />
                    Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Investment Thesis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Investment Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Preferred Stages</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">Pre-seed</Badge>
                    <Badge variant="secondary">Seed</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">AI/ML</Badge>
                    <Badge variant="outline">FinTech</Badge>
                    <Badge variant="outline">SaaS</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Check Size</p>
                  <p className="text-sm font-medium">$100K - $500K</p>
                </div>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/profile">
                    Edit Preferences
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="icon-sm" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Viewed NeuralFlow AI</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Shortlisted GreenGrid</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-muted-foreground">Meeting with HealthSync</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

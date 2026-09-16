'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, TrendingUp, TrendingDown, DollarSign,
  MoreVertical, ExternalLink, Users, PieChart, Download,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/EmptyState';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

const ChartFallback = () => <Skeleton className="h-[200px] w-full rounded-lg" />;
const PortfolioValueChart = dynamic(
  () => import('./InvestorPortfolioCharts').then((m) => ({ default: m.PortfolioValueChart })),
  { ssr: false, loading: ChartFallback },
);
const SectorMixChart = dynamic(
  () => import('./InvestorPortfolioCharts').then((m) => ({ default: m.SectorMixChart })),
  { ssr: false, loading: ChartFallback },
);

const PORTFOLIO_VALUE_HISTORY = [
  { month: 'Oct', value: 200 },
  { month: 'Nov', value: 215 },
  { month: 'Dec', value: 250 },
  { month: 'Jan', value: 310 },
  { month: 'Feb', value: 445 },
  { month: 'Mar', value: 535 },
];

const SECTOR_DISTRIBUTION = [
  { name: 'FoodTech', value: 50, color: '#f97316' },
  { name: 'Cybersecurity', value: 100, color: '#6366f1' },
  { name: 'Enterprise', value: 75, color: '#0ea5e9' },
  { name: 'Logistics', value: 50, color: '#22c55e' },
];

type Investment = {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  investedAt: string;
  amount: string;
  currentValue: string;
  returnPct: number;
  stage: string;
  status: 'active' | 'exited' | 'written_off';
  teamSize: number;
  lastUpdate: string;
};

const MOCK_INVESTMENTS: Investment[] = [
  { id: '1', name: 'FoodTech Pro', industry: 'FoodTech', investedAt: 'Feb 2025', amount: '$50K', currentValue: '$75K', returnPct: 50, stage: 'Seed', status: 'active', teamSize: 5, lastUpdate: '1 week ago' },
  { id: '2', name: 'CloudSecure', industry: 'Cybersecurity', investedAt: 'Jan 2025', amount: '$100K', currentValue: '$120K', returnPct: 20, stage: 'Series A', status: 'active', teamSize: 12, lastUpdate: '3 days ago' },
  { id: '3', name: 'DataVault', industry: 'Enterprise', investedAt: 'Dec 2024', amount: '$75K', currentValue: '$90K', returnPct: 20, stage: 'Seed', status: 'active', teamSize: 8, lastUpdate: '2 weeks ago' },
  { id: '4', name: 'QuickShip', industry: 'Logistics', investedAt: 'Oct 2024', amount: '$50K', currentValue: '$250K', returnPct: 400, stage: 'Series B', status: 'exited', teamSize: 25, lastUpdate: 'Exited Mar 2025' },
];

function InvestmentCard({ investment }: { investment: Investment }) {
  const statusColors: Record<string, string> = {
    active: 'bg-status-success-bg text-status-success border-status-success-border',
    exited: 'bg-status-info-bg text-status-info border-status-info-border',
    written_off: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
  };

  const isPositive = investment.returnPct >= 0;

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={investment.logoUrl} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible font-semibold">
              {investment.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/startups/${investment.id}`} className="font-semibold hover:text-primary-accessible transition-colors">
                    {investment.name}
                  </Link>
                  <Badge variant="outline" className={cn('text-xs', statusColors[investment.status])}>
                    {investment.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{investment.industry} · {investment.stage}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Open actions for ${investment.name}`}>
                    <MoreVertical className="icon-sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/startups/${investment.id}`}>View Startup</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>View Documents</DropdownMenuItem>
                  <DropdownMenuItem>Add Update</DropdownMenuItem>
                  <DropdownMenuItem>Export Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Invested</p>
                <p className="text-sm font-medium">{investment.amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Value</p>
                <p className="text-sm font-medium">{investment.currentValue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Return</p>
                <p className={cn('text-sm font-medium flex items-center gap-1', isPositive ? 'text-status-success' : 'text-status-danger')}>
                  {isPositive ? <TrendingUp className="icon-sm" /> : <TrendingDown className="icon-sm" />}
                  {isPositive ? '+' : ''}{investment.returnPct}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invested</p>
                <p className="text-sm font-medium">{investment.investedAt}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />
                {investment.teamSize} team members
              </span>
              <span>Last update: {investment.lastUpdate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestorPortfolioPage() {
  const { showDemoData } = useDemoData();
  const investments = showDemoData ? MOCK_INVESTMENTS : [];
  const valueHistory = showDemoData ? PORTFOLIO_VALUE_HISTORY : [];
  const sectorData = showDemoData ? SECTOR_DISTRIBUTION : [];

  const totalInvested = 275000;
  const totalValue = 535000;
  const totalReturn = ((totalValue - totalInvested) / totalInvested) * 100;

  if (!showDemoData && investments.length === 0) {
    return (
      <AppShell title="Portfolio" description="Track your investments and returns">
        <EmptyState
          illustration="default"
          title="No portfolio companies yet"
          description="Start investing through your deal pipeline to build your portfolio."
          askAiPrompt="My investor portfolio is empty. What should I review in the pipeline before marking a company as invested?"
          action={<Button asChild><Link href="/investor/pipeline"><TrendingUp className="mr-2 icon-sm" />View Pipeline</Link></Button>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Portfolio"
      description="Track your investments and returns"
      actions={
        <Button variant="outline" size="sm">
          <Download className="mr-2 icon-sm" />Export Report
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Invested', value: '$275K', icon: DollarSign, color: 'text-foreground' },
            { label: 'Current Value', value: '$535K', icon: TrendingUp, color: 'text-primary-accessible' },
            { label: 'Total Return', value: `+${totalReturn.toFixed(0)}%`, icon: PieChart, color: 'text-status-success' },
            { label: 'Companies', value: investments.length, icon: Briefcase, color: 'text-status-info' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('icon-sm', color)} /></div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Value Over Time</TabsTrigger>
            <TabsTrigger value="sectors">Sector Mix</TabsTrigger>
          </TabsList>
          <TabsContent value="performance">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Portfolio Value (K USD)</CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioValueChart data={valueHistory} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sectors">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Investment by Sector (K USD)</CardTitle>
              </CardHeader>
              <CardContent>
                <SectorMixChart data={sectorData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Portfolio List */}
        <div className="space-y-3">
          {investments.map((investment) => (
            <InvestmentCard key={investment.id} investment={investment} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

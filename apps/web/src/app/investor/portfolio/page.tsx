'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, TrendingUp, TrendingDown, DollarSign,
  MoreVertical, ExternalLink, Users, PieChart, Download,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, PieChart as RPieChart,
  Pie, Cell, Legend,
} from 'recharts';
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
import { useChartTheme } from '@/lib/chart-theme';

const PORTFOLIO_VALUE_HISTORY = [
  { month: 'Oct', value: 200 },
  { month: 'Nov', value: 215 },
  { month: 'Dec', value: 250 },
  { month: 'Jan', value: 310 },
  { month: 'Feb', value: 445 },
  { month: 'Mar', value: 535 },
];

const SECTOR_DISTRIBUTION = [
  { name: 'FoodTech', value: 50 },
  { name: 'Cybersecurity', value: 100 },
  { name: 'Enterprise', value: 75 },
  { name: 'Logistics', value: 50 },
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
    active: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    exited: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    written_off: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  const isPositive = investment.returnPct >= 0;

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={investment.logoUrl} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary-emphasis font-semibold">
              {investment.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/startups/${investment.id}`} className="font-semibold hover:text-primary-emphasis transition-colors">
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
                  <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="icon-sm" aria-hidden="true" />
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
                <p className={cn('text-sm font-medium flex items-center gap-1', isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                  {isPositive ? <TrendingUp className="icon-2xs" aria-hidden="true" /> : <TrendingDown className="icon-2xs" aria-hidden="true" />}
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
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
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
  const theme = useChartTheme();
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
          action={<Button asChild><Link href="/investor/pipeline"><TrendingUp className="mr-2 icon-sm" aria-hidden="true" />View Pipeline</Link></Button>}
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
          <Download className="mr-2 icon-sm" aria-hidden="true" />Export Report
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Invested', value: '$275K', icon: DollarSign, color: 'text-foreground' },
            { label: 'Current Value', value: '$535K', icon: TrendingUp, color: 'text-primary-emphasis' },
            { label: 'Total Return', value: `+${totalReturn.toFixed(0)}%`, icon: PieChart, color: 'text-green-600 dark:text-green-400' },
            { label: 'Companies', value: investments.length, icon: Briefcase, color: 'text-blue-600 dark:text-blue-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('h-4 w-4', color)} /></div>
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
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={valueHistory}>
                    <defs>
                      <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}K`} />
                    <RechartsTooltip formatter={(v: number) => [`$${v}K`, 'Value']} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#portGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sectors">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Investment by Sector (K USD)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RPieChart>
                    <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: $${value}K`} labelLine={false}>
                      {sectorData.map((entry, i) => (
                        <Cell key={entry.name} fill={theme.series[i % theme.series.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip formatter={(v: number) => [`$${v}K`, 'Invested']} />
                  </RPieChart>
                </ResponsiveContainer>
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

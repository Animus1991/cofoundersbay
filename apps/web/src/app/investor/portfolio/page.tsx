'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MoreVertical,
  ExternalLink,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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

function InvestmentCard({ investment }: { investment: Investment }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    exited: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    written_off: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  const isPositive = investment.returnPct >= 0;

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={investment.logoUrl} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
              {investment.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/startups/${investment.id}`} className="font-semibold hover:text-primary transition-colors">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
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
                <p className={cn('text-sm font-medium flex items-center gap-1', isPositive ? 'text-green-600' : 'text-red-600')}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
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
                <Users className="h-3.5 w-3.5" />
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
  // Mock data
  const investments: Investment[] = [
    {
      id: '1',
      name: 'FoodTech Pro',
      industry: 'FoodTech',
      investedAt: 'Feb 2025',
      amount: '$50K',
      currentValue: '$75K',
      returnPct: 50,
      stage: 'Seed',
      status: 'active',
      teamSize: 5,
      lastUpdate: '1 week ago',
    },
    {
      id: '2',
      name: 'CloudSecure',
      industry: 'Cybersecurity',
      investedAt: 'Jan 2025',
      amount: '$100K',
      currentValue: '$120K',
      returnPct: 20,
      stage: 'Series A',
      status: 'active',
      teamSize: 12,
      lastUpdate: '3 days ago',
    },
    {
      id: '3',
      name: 'DataVault',
      industry: 'Enterprise',
      investedAt: 'Dec 2024',
      amount: '$75K',
      currentValue: '$90K',
      returnPct: 20,
      stage: 'Seed',
      status: 'active',
      teamSize: 8,
      lastUpdate: '2 weeks ago',
    },
    {
      id: '4',
      name: 'QuickShip',
      industry: 'Logistics',
      investedAt: 'Oct 2024',
      amount: '$50K',
      currentValue: '$250K',
      returnPct: 400,
      stage: 'Series B',
      status: 'exited',
      teamSize: 25,
      lastUpdate: 'Exited Mar 2025',
    },
  ];

  const totalInvested = 275000;
  const totalValue = 535000;
  const totalReturn = ((totalValue - totalInvested) / totalInvested) * 100;

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">
              Track your investments and returns
            </p>
          </div>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">${(totalInvested / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p className="text-2xl font-bold text-green-600">+{totalReturn.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Companies</p>
              <p className="text-2xl font-bold">{investments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Investments</h2>
          {investments.map((investment) => (
            <InvestmentCard key={investment.id} investment={investment} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

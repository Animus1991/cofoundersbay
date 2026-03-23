'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Calendar,
  Download,
  ArrowUpRight,
  Star,
  CheckCircle2,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { getMeProfile } from '@/lib/api';

// ── Mock data (replace with real API calls) ──────────────────────────────────

const MOCK_TRANSACTIONS = [
  { id: '1', mentee: { name: 'Alex K.', avatarUrl: null }, type: 'session', duration: 60, amount: 120, currency: 'USD', date: '2025-01-22', status: 'paid', topic: 'Product strategy review' },
  { id: '2', mentee: { name: 'Maria P.', avatarUrl: null }, type: 'session', duration: 30, amount: 60, currency: 'USD', date: '2025-01-20', status: 'paid', topic: 'Fundraising pitch feedback' },
  { id: '3', mentee: { name: 'Nikos L.', avatarUrl: null }, type: 'session', duration: 45, amount: 90, currency: 'USD', date: '2025-01-18', status: 'paid', topic: 'GTM strategy' },
  { id: '4', mentee: { name: 'Sofia A.', avatarUrl: null }, type: 'session', duration: 60, amount: 120, currency: 'USD', date: '2025-01-15', status: 'pending', topic: 'Co-founder selection' },
  { id: '5', mentee: { name: 'Panos D.', avatarUrl: null }, type: 'session', duration: 30, amount: 60, currency: 'USD', date: '2025-01-12', status: 'paid', topic: 'MVP validation' },
  { id: '6', mentee: { name: 'Elena T.', avatarUrl: null }, type: 'session', duration: 60, amount: 120, currency: 'USD', date: '2025-01-10', status: 'paid', topic: 'Investor readiness' },
];

const MOCK_MONTHLY = [
  { month: 'Aug', earned: 180, sessions: 3 },
  { month: 'Sep', earned: 300, sessions: 5 },
  { month: 'Oct', earned: 240, sessions: 4 },
  { month: 'Nov', earned: 420, sessions: 7 },
  { month: 'Dec', earned: 360, sessions: 6 },
  { month: 'Jan', earned: 570, sessions: 6 },
];

const maxEarned = Math.max(...MOCK_MONTHLY.map(m => m.earned));

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents);
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  iconColor = 'text-primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: { value: number; positive: boolean };
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            {trend && (
              <p className={cn('text-xs flex items-center gap-1', trend.positive ? 'text-green-500' : 'text-red-500')}>
                {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.positive ? '+' : ''}{trend.value}% vs last month
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MentorEarningsPage() {
  const { hasSession, mounted } = useSession();
  const [period, setPeriod] = useState('this_month');

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const totalEarned = MOCK_TRANSACTIONS.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = MOCK_TRANSACTIONS.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const totalSessions = MOCK_TRANSACTIONS.length;
  const avgPerSession = totalSessions > 0 ? totalEarned / MOCK_TRANSACTIONS.filter(t => t.status === 'paid').length : 0;

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-60" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
              <Wallet className="h-6 w-6 text-primary" />
              Earnings
            </h1>
            <p className="text-muted-foreground">Track your mentoring income and session history</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="last_month">Last month</SelectItem>
                <SelectItem value="last_3">Last 3 months</SelectItem>
                <SelectItem value="last_6">Last 6 months</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Total Earned"
            value={formatCurrency(totalEarned)}
            sub="from paid sessions"
            trend={{ value: 58, positive: true }}
          />
          <StatCard
            icon={Clock}
            label="Pending Payout"
            value={formatCurrency(pendingAmount)}
            sub="awaiting release"
            iconColor="text-amber-500"
          />
          <StatCard
            icon={BarChart3}
            label="Sessions"
            value={String(totalSessions)}
            sub="this period"
            trend={{ value: 20, positive: true }}
          />
          <StatCard
            icon={Star}
            label="Avg. Per Session"
            value={formatCurrency(avgPerSession)}
            sub="blended rate"
          />
        </div>

        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="chart">Monthly Overview</TabsTrigger>
            <TabsTrigger value="payout">Payout Settings</TabsTrigger>
          </TabsList>

          {/* Transactions */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Session History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {MOCK_TRANSACTIONS.map(tx => (
                    <div key={tx.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={tx.mentee.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {tx.mentee.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{tx.mentee.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tx.topic}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{formatCurrency(tx.amount)}</p>
                        <p className="text-xs text-muted-foreground">{tx.duration} min</p>
                      </div>
                      <Badge
                        variant={tx.status === 'paid' ? 'secondary' : 'outline'}
                        className={cn(
                          'text-xs shrink-0',
                          tx.status === 'paid' ? 'text-green-600 bg-green-500/10' : 'text-amber-600 bg-amber-500/10'
                        )}
                      >
                        {tx.status === 'paid' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" />Paid</>
                        ) : 'Pending'}
                      </Badge>
                      <p className="text-xs text-muted-foreground w-20 text-right">{tx.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart */}
          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-48">
                  {MOCK_MONTHLY.map(m => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-primary">{formatCurrency(m.earned)}</span>
                      <div
                        className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors min-h-[4px]"
                        style={{ height: `${(m.earned / maxEarned) * 160}px` }}
                        title={`${m.sessions} sessions`}
                      />
                      <span className="text-xs text-muted-foreground">{m.month}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border my-4" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">{formatCurrency(MOCK_MONTHLY.reduce((s, m) => s + m.earned, 0))}</p>
                    <p className="text-xs text-muted-foreground">6-month total</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{MOCK_MONTHLY.reduce((s, m) => s + m.sessions, 0)}</p>
                    <p className="text-xs text-muted-foreground">Total sessions</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {formatCurrency(MOCK_MONTHLY.reduce((s, m) => s + m.earned, 0) / MOCK_MONTHLY.reduce((s, m) => s + m.sessions, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg per session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout */}
          <TabsContent value="payout">
            <Card>
              <CardHeader><CardTitle className="text-base">Payout Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">No payout method connected</p>
                    <p className="text-xs text-muted-foreground">Connect Stripe or bank account to receive payouts</p>
                  </div>
                  <Button size="sm">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {['Stripe Connect', 'Bank Transfer (SEPA)', 'PayPal', 'Wise'].map(method => (
                    <div key={method} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm font-medium">{method}</span>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Payouts are processed within 2–5 business days after session completion.
                  Platform fee: 10% per transaction.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

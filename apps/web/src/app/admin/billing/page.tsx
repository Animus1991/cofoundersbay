'use client';

import { useState } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Invoice = {
  id: string;
  tenant: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  date: string;
  plan: string;
};

type Subscription = {
  id: string;
  tenant: string;
  plan: string;
  amount: string;
  status: 'active' | 'cancelled' | 'past_due';
  nextBilling: string;
  members: number;
};

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const statusColors: Record<string, string> = {
    paid: 'bg-green-500/10 text-green-600 border-green-500/20',
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    overdue: 'bg-red-500/10 text-red-600 border-red-500/20',
    failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{invoice.tenant}</span>
          <Badge variant="outline" className={cn('text-xs', statusColors[invoice.status])}>
            {invoice.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{invoice.plan} · {invoice.date}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{invoice.amount}</p>
        <p className="text-xs text-muted-foreground">#{invoice.id}</p>
      </div>
      <Button variant="ghost" size="sm">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SubscriptionRow({ subscription }: { subscription: Subscription }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    cancelled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    past_due: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{subscription.tenant}</span>
          <Badge variant="outline" className={cn('text-xs', statusColors[subscription.status])}>
            {subscription.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {subscription.plan} · {subscription.members} members
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{subscription.amount}/mo</p>
        <p className="text-xs text-muted-foreground">Next: {subscription.nextBilling}</p>
      </div>
    </div>
  );
}

export default function AdminBillingPage() {
  const [search, setSearch] = useState('');

  // Mock data
  const revenueMetrics = {
    mrr: '$24,500',
    arr: '$294,000',
    activeSubscriptions: 28,
    avgRevPerTenant: '$875',
  };

  const invoices: Invoice[] = [
    { id: 'INV-001', tenant: 'TechHub Accelerator', amount: '$499', status: 'paid', date: 'Mar 15, 2025', plan: 'Enterprise' },
    { id: 'INV-002', tenant: 'AI Ventures', amount: '$299', status: 'paid', date: 'Mar 14, 2025', plan: 'Pro' },
    { id: 'INV-003', tenant: 'StartupU', amount: '$499', status: 'pending', date: 'Mar 12, 2025', plan: 'Enterprise' },
    { id: 'INV-004', tenant: 'FinLab', amount: '$299', status: 'overdue', date: 'Mar 1, 2025', plan: 'Pro' },
    { id: 'INV-005', tenant: 'GreenTech Hub', amount: '$199', status: 'paid', date: 'Feb 28, 2025', plan: 'Starter' },
  ];

  const subscriptions: Subscription[] = [
    { id: '1', tenant: 'TechHub Accelerator', plan: 'Enterprise', amount: '$499', status: 'active', nextBilling: 'Apr 15', members: 156 },
    { id: '2', tenant: 'AI Ventures', plan: 'Pro', amount: '$299', status: 'active', nextBilling: 'Apr 14', members: 98 },
    { id: '3', tenant: 'StartupU', plan: 'Enterprise', amount: '$499', status: 'active', nextBilling: 'Apr 12', members: 85 },
    { id: '4', tenant: 'FinLab', plan: 'Pro', amount: '$299', status: 'past_due', nextBilling: 'Overdue', members: 72 },
    { id: '5', tenant: 'GreenTech Hub', plan: 'Starter', amount: '$199', status: 'active', nextBilling: 'Mar 28', members: 45 },
  ];

  const filteredInvoices = invoices.filter(
    (i) => !search || i.tenant.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter(
    (s) => !search || s.tenant.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground">
              Manage subscriptions and invoices
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Revenue Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground">MRR</p>
              </div>
              <p className="text-2xl font-bold mt-1">{revenueMetrics.mrr}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">ARR</p>
              </div>
              <p className="text-2xl font-bold mt-1">{revenueMetrics.arr}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-muted-foreground">Active Subs</p>
              </div>
              <p className="text-2xl font-bold mt-1">{revenueMetrics.activeSubscriptions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-muted-foreground">Avg/Tenant</p>
              </div>
              <p className="text-2xl font-bold mt-1">{revenueMetrics.avgRevPerTenant}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions">
          <TabsList>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {filteredSubscriptions.map((subscription) => (
                  <SubscriptionRow key={subscription.id} subscription={subscription} />
                ))}
                {filteredSubscriptions.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No subscriptions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {filteredInvoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
                {filteredInvoices.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No invoices found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

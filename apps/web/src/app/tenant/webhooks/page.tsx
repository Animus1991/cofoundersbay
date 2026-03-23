'use client';

import { useState } from 'react';
import {
  Webhook,
  Plus,
  Copy,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';

type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
  successRate: number;
  totalDeliveries: number;
};

const MOCK_WEBHOOKS: WebhookItem[] = [
  {
    id: '1',
    url: 'https://hooks.zapier.com/hooks/catch/abc123/xyz',
    events: ['application.submitted', 'startup.graduated', 'milestone.completed'],
    isActive: true,
    lastTriggered: '5 minutes ago',
    successRate: 98,
    totalDeliveries: 342,
  },
  {
    id: '2',
    url: 'https://api.slack.com/webhooks/T00/B00/token',
    events: ['user.joined', 'event.created'],
    isActive: true,
    lastTriggered: '1 hour ago',
    successRate: 100,
    totalDeliveries: 87,
  },
  {
    id: '3',
    url: 'https://api.crm-tool.io/webhooks/incoming',
    events: ['application.submitted', 'startup.created'],
    isActive: false,
    lastTriggered: '3 days ago',
    successRate: 72,
    totalDeliveries: 25,
  },
];

const ALL_EVENTS = [
  'application.submitted', 'application.reviewed', 'startup.created', 'startup.graduated',
  'user.joined', 'milestone.completed', 'event.created', 'program.started',
];

function WebhookCard({ webhook }: { webhook: WebhookItem }) {
  const [active, setActive] = useState(webhook.isActive);
  const truncUrl = webhook.url.length > 48 ? webhook.url.slice(0, 48) + '…' : webhook.url;

  return (
    <Card className={cn('transition-all', !active && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded truncate max-w-xs">{truncUrl}</code>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {webhook.events.map(e => (
                <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {webhook.lastTriggered && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{webhook.lastTriggered}</span>}
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {webhook.successRate}% success · {webhook.totalDeliveries} deliveries
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={active} onCheckedChange={setActive} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                <DropdownMenuItem><RefreshCw className="mr-2 h-4 w-4" />Resend Last</DropdownMenuItem>
                <DropdownMenuItem><ArrowRight className="mr-2 h-4 w-4" />View Logs</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantWebhooksPage() {
  return (
    <AppShell>
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Webhook className="h-6 w-6 text-primary" />
              Webhooks
            </h1>
            <p className="text-muted-foreground">Send real-time event notifications to external services</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" />Add Webhook</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Active Webhooks', value: MOCK_WEBHOOKS.filter(w => w.isActive).length },
            { label: 'Total Deliveries', value: MOCK_WEBHOOKS.reduce((s, w) => s + w.totalDeliveries, 0) },
            { label: 'Avg Success Rate', value: `${Math.round(MOCK_WEBHOOKS.reduce((s, w) => s + w.successRate, 0) / MOCK_WEBHOOKS.length)}%` },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="space-y-3">
          {MOCK_WEBHOOKS.map(w => <WebhookCard key={w.id} webhook={w} />)}
        </div>

        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Webhook className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Add a new webhook endpoint</p>
            <p className="text-xs text-muted-foreground mt-1">Connect Zapier, Slack, or any HTTP endpoint</p>
            <Button size="sm" className="mt-4"><Plus className="mr-1.5 h-4 w-4" />Add Webhook</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

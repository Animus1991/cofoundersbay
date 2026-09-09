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
  MoreVertical,
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
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

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
              <Button aria-label="Copy" variant="ghost" size="icon">
                <Copy className="icon-sm" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {webhook.events.map(e => (
                <Badge key={e} variant="secondary" size="sm">{e}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {webhook.lastTriggered && <span className="flex items-center gap-1"><Clock className="icon-sm" aria-hidden="true" />{webhook.lastTriggered}</span>}
              <span className="flex items-center gap-1">
                <Activity className="icon-sm" aria-hidden="true" />
                {webhook.successRate}% success · {webhook.totalDeliveries} deliveries
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={active} onCheckedChange={setActive} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="More options" variant="ghost" size="icon">
                  <MoreVertical className="icon-sm" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Edit className="mr-2 icon-sm" aria-hidden="true" />Edit</DropdownMenuItem>
                <DropdownMenuItem><RefreshCw className="mr-2 icon-sm" aria-hidden="true" />Resend Last</DropdownMenuItem>
                <DropdownMenuItem><ArrowRight className="mr-2 icon-sm" aria-hidden="true" />View Logs</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive-emphasis"><Trash2 className="mr-2 icon-sm" aria-hidden="true" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantWebhooksPage() {
  const { showDemoData } = useDemoData();
  const webhooks = showDemoData ? MOCK_WEBHOOKS : [];

  const avgSuccess = webhooks.length > 0
    ? Math.round(webhooks.reduce((s, w) => s + w.successRate, 0) / webhooks.length)
    : 0;

  return (
    <AppShell
      title="Webhooks"
      description="Send real-time event notifications to external services"
      actions={<Button size="sm"><Plus className="mr-2 icon-sm" aria-hidden="true" />Add Webhook</Button>}
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Active Webhooks', value: webhooks.filter(w => w.isActive).length },
            { label: 'Total Deliveries', value: webhooks.reduce((s, w) => s + w.totalDeliveries, 0) },
            { label: 'Avg Success Rate', value: `${avgSuccess}%` },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>
          ))}
        </div>

        {webhooks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Webhook className="icon-lg mx-auto text-muted-foreground/40 mb-3" aria-hidden="true" />
              <p className="font-medium">No webhooks configured</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Connect Zapier, Slack, or any HTTP endpoint to receive real-time events</p>
              <Button size="sm"><Plus className="mr-1.5 icon-sm" aria-hidden="true" />Add Webhook</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {webhooks.map(w => <WebhookCard key={w.id} webhook={w} />)}
            </div>
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Add another endpoint</p>
                <Button size="sm" variant="outline" className="mt-2"><Plus className="mr-1.5 icon-sm" aria-hidden="true" />Add Webhook</Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

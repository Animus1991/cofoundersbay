'use client';

import { useState } from 'react';
import {
  Webhook,
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
import { EmptyTenantWebhooks } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { UnavailableButton } from '@/components/common/UnavailableButton';
import { BilingualText } from '@/components/common/BilingualText';

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
    <Card className={cn('transition-all', !active && 'surface-inactive')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded truncate max-w-xs">{truncUrl}</code>
              <Button aria-label="Copy URL" variant="ghost" size="icon" onClick={() => void navigator.clipboard?.writeText(webhook.url)}>
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
            <Switch checked={active} onCheckedChange={setActive} aria-label={`Deliver to ${truncUrl}`} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="More options" variant="ghost" size="icon">
                  <MoreVertical className="icon-sm" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* No webhook service exists, so none of these can act.
                    They stay visible - they are what this surface is for -
                    and say why they are unavailable instead of silently
                    closing the menu. */}
                <UnavailableMenuItem icon={<Edit className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="Edit" el="Επεξεργασία" reasonEn="No webhook backend yet." reasonEl="Δεν υπάρχει ακόμη backend webhooks." />
                <UnavailableMenuItem icon={<RefreshCw className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="Resend Last" el="Επαναποστολή τελευταίου" reasonEn="No deliveries are sent yet." reasonEl="Δεν αποστέλλονται ακόμη παραδόσεις." />
                <UnavailableMenuItem icon={<ArrowRight className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="View Logs" el="Αρχεία καταγραφής" reasonEn="No delivery log exists yet." reasonEl="Δεν υπάρχει ακόμη αρχείο παραδόσεων." />
                <UnavailableMenuItem className="text-destructive-accessible" icon={<Trash2 className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="Delete" el="Διαγραφή" reasonEn="Sample endpoint - nothing to delete." reasonEl="Δείγμα - δεν υπάρχει κάτι να διαγραφεί." />
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
      descriptionEl="Στείλτε ειδοποιήσεις συμβάντων σε πραγματικό χρόνο σε εξωτερικές υπηρεσίες"
      actions={
        // Had no handler; there is no webhook service to register one with.
        <UnavailableButton
          en="Add webhook"
          el="Νέο webhook"
          reasonEn="Sending events out needs a delivery service the platform does not run yet."
          reasonEl="Η αποστολή συμβάντων χρειάζεται υπηρεσία παράδοσης που η πλατφόρμα δεν έχει ακόμη."
        />
      }
    >
      <div className="space-y-5">
        {showDemoData && (
          <SampleDataNotice
            surface="Webhooks"
            detail="These endpoints are illustrative - webhook delivery has no backend yet, so nothing here sends, retries or logs."
            askAiPrompt="Why does the webhooks page show sample endpoints?"
          />
        )}
        <div className="grid grid-cols-2 kpi-odd-span-md gap-3 md:grid-cols-3">
          {[
            { label: 'Active Webhooks', value: webhooks.filter(w => w.isActive).length },
            { label: 'Total Deliveries', value: webhooks.reduce((s, w) => s + w.totalDeliveries, 0) },
            { label: 'Avg Success Rate', value: `${avgSuccess}%` },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="page-stat text-xl font-bold">{s.value}</p></CardContent></Card>
          ))}
        </div>

        {webhooks.length === 0 ? (
          <EmptyTenantWebhooks />
        ) : (
          <>
            <div className="space-y-3">
              {webhooks.map(w => <WebhookCard key={w.id} webhook={w} />)}
            </div>
            {/* The header's "Add webhook" is the one place to add one; this
                card repeated it as a second disabled button. */}
            <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
              <BilingualText
                en="New endpoints are added from the header once webhook delivery is available."
                el="Νέα endpoints προστίθενται από την κεφαλίδα μόλις γίνει διαθέσιμη η αποστολή webhooks."
                wrap
              />
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

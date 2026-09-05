'use client';

import { useState } from 'react';
import { AlertTriangle, Shield, Lock, Activity, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

type SecurityEvent = {
  id: string;
  level: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  time: string;
};

const EVENTS: SecurityEvent[] = [
  { id: '1', level: 'warning', category: 'Auth', message: '5 failed logins from same IP (203.0.113.42)', time: '10m ago' },
  { id: '2', level: 'info', category: 'SSO', message: 'Tenant acme-corp SAML metadata refreshed', time: '1h ago' },
  { id: '3', level: 'critical', category: 'API', message: 'Unusual spike in /api/admin export calls', time: '3h ago' },
  { id: '4', level: 'info', category: 'Session', message: 'User session revoked (password reset)', time: '6h ago' },
];

const LEVEL_TONE: Record<SecurityEvent['level'], StatusTone> = {
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

export default function SecurityMonitoringPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');

  const filtered = EVENTS.filter(
    (e) =>
      (level === 'all' || e.level === level) &&
      (!search || e.message.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <AppShell
      title="Security monitoring"
      description="Authentication anomalies, API abuse signals, and SSO events in real time."
    >
      <HelpCallout id="admin-security" title="Security events">
        <p>
          <strong>Critical</strong> events need immediate review. Failed-login clusters may indicate credential
          stuffing; export spikes may indicate data exfiltration attempts. Cross-check with audit log for context.
        </p>
      </HelpCallout>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Events (24h)', value: EVENTS.length, icon: Activity },
          { label: 'Critical', value: EVENTS.filter((e) => e.level === 'critical').length, icon: AlertTriangle },
          { label: 'Auth warnings', value: EVENTS.filter((e) => e.category === 'Auth').length, icon: Lock },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="icon-md text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-9"
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mt-4">
        {filtered.map((e) => (
          <div key={e.id} className="flex flex-wrap items-start gap-3 border-b px-4 py-3 last:border-b-0">
            <Shield className="icon-sm mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{e.message}</p>
              <p className="text-xs text-muted-foreground">{e.category} · {e.time}</p>
            </div>
            <Badge variant="outline" className={cn('border capitalize', STATUS[LEVEL_TONE[e.level]].chip)}>{e.level}</Badge>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}

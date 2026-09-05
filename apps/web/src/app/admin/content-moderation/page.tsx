'use client';

import { useState } from 'react';
import { Flag, Search, Shield, Users, CheckCircle2, XCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

type Report = {
    id: string;
  type: 'post' | 'profile' | 'message';
        reason: string;
  reporter: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
};

const REPORTS: Report[] = [
  { id: '1', type: 'post', reason: 'Spam / promotional', reporter: 'user_42', status: 'open', createdAt: '2h ago' },
  { id: '2', type: 'profile', reason: 'Misleading credentials', reporter: 'user_88', status: 'open', createdAt: '5h ago' },
  { id: '3', type: 'message', reason: 'Harassment', reporter: 'user_12', status: 'resolved', createdAt: '1d ago' },
];

export default function ContentModerationPage() {
  const [tab, setTab] = useState('open');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(REPORTS);
  const { success } = useToast();

  const filtered = items.filter(
    (r) =>
      (tab === 'all' || r.status === tab) &&
      (!search || r.reason.toLowerCase().includes(search.toLowerCase())),
  );

  const resolve = (id: string, status: Report['status']) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    success('Report updated', `Marked as ${status}.`);
  };

  return (
    <AppShell
      title="Content moderation"
      description="Review flagged posts, profiles, and messages. Resolve or dismiss with one action."
    >
      <HelpCallout id="admin-content-moderation" title="Moderation queue">
        <p>
          Open items need a decision: <strong>Resolve</strong> if action was taken (warn/suspend content),
          <strong> Dismiss</strong> if the report was invalid. Resolved items stay in history for audit.
        </p>
      </HelpCallout>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
                    <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="pl-9"
          />
              </div>
            </div>

              <Card>
        {filtered.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <Flag className="icon-sm text-status-warning shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium capitalize">{r.type} · {r.reason}</p>
              <p className="text-xs text-muted-foreground">Reported by {r.reporter} · {r.createdAt}</p>
                    </div>
            <Badge variant="outline" className="capitalize">{r.status}</Badge>
            {r.status === 'open' && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => resolve(r.id, 'resolved')}>
                  <CheckCircle2 className="icon-sm mr-1" /> Resolve
                                  </Button>
                <Button size="sm" variant="ghost" onClick={() => resolve(r.id, 'dismissed')}>
                  <XCircle className="icon-sm mr-1" /> Dismiss
                                </Button>
                              </div>
                          )}
                        </div>
        ))}
        {filtered.length === 0 && (
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="mx-auto icon-lg opacity-40" />
            <p className="mt-2">No reports in this queue</p>
          </CardContent>
        )}
      </Card>
    </AppShell>
  );
}

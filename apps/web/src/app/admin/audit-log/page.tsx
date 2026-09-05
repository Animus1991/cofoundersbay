'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Search, Filter, RefreshCw, Download, User,
  Trash2, PenLine, Plus, Eye, LogIn, LogOut, Settings,
  AlertTriangle, CheckCircle2, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { listAdminAuditLogs, type AdminAuditLogItem } from '@/lib/api';

const ACTION_ICONS: Record<string, React.ElementType> = {
  create: Plus,
  update: PenLine,
  delete: Trash2,
  view: Eye,
  login: LogIn,
  logout: LogOut,
  ban: AlertTriangle,
  unban: CheckCircle2,
  role_change: User,
  config: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-status-success-bg text-status-success border-status-success-border',
  update: 'bg-status-info-bg text-status-info border-status-info-border',
  delete: 'bg-status-danger-bg text-status-danger border-status-danger-border',
  view: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
  login: 'bg-primary/10 text-primary-accessible border-primary/20',
  logout: 'bg-muted text-muted-foreground border-border',
  ban: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  unban: 'bg-status-success-bg text-status-success border-status-success-border',
  role_change: 'bg-status-accent-bg text-status-accent border-status-accent-border',
};

const ENTITY_TYPES = ['all', 'user', 'tenant', 'program', 'event', 'group', 'job', 'automation', 'sso', 'report'];
const ACTION_TYPES = ['all', 'create', 'update', 'delete', 'view', 'login', 'logout', 'ban', 'unban', 'role_change'];

const MOCK_LOGS: AdminAuditLogItem[] = [
  { id: '1', actorId: 'u1', actorEmail: 'admin@cofounderbay.com', action: 'role_change', entityType: 'user', entityId: 'u42', meta: { from: 'founder', to: 'platform_admin' }, createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: '2', actorId: 'u1', actorEmail: 'admin@cofounderbay.com', action: 'ban', entityType: 'user', entityId: 'u87', meta: { reason: 'Spam content' }, createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: '3', actorId: 'u1', actorEmail: 'admin@cofounderbay.com', action: 'create', entityType: 'program', entityId: 'p12', meta: { name: 'Accelerator Cohort 2025' }, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '4', actorId: 'u2', actorEmail: 'ops@cofounderbay.com', action: 'delete', entityType: 'automation', entityId: 'a5', meta: { name: 'Welcome Email Sequence' }, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: '5', actorId: 'u1', actorEmail: 'admin@cofounderbay.com', action: 'update', entityType: 'tenant', entityId: 't3', meta: { field: 'plan', from: 'starter', to: 'pro' }, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: '6', actorId: 'u3', actorEmail: 'support@cofounderbay.com', action: 'view', entityType: 'user', entityId: 'u31', meta: { reason: 'Support request' }, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: '7', actorId: 'u2', actorEmail: 'ops@cofounderbay.com', action: 'create', entityType: 'sso', entityId: 's1', meta: { provider: 'okta', tenantId: 't5' }, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: '8', actorId: 'u1', actorEmail: 'admin@cofounderbay.com', action: 'unban', entityType: 'user', entityId: 'u55', meta: { reason: 'Appeal approved' }, createdAt: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: '9', actorId: 'u1', actorEmail: 'admin@cofounderbay.com', action: 'delete', entityType: 'group', entityId: 'g9', meta: { name: 'Spam Community', reason: 'Violated ToS' }, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: '10', actorId: 'u4', actorEmail: 'content@cofounderbay.com', action: 'update', entityType: 'program', entityId: 'p8', meta: { field: 'status', value: 'published' }, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AuditLogRow({ log }: { log: AdminAuditLogItem }) {
  const ActionIcon = ACTION_ICONS[log.action.toLowerCase()] ?? Settings;
  const colorClass = ACTION_COLORS[log.action.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border';

  const metaStr = Object.entries(log.meta ?? {})
    .filter(([k]) => !['actorId'].includes(k))
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(' · ');

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={cn('rounded-lg p-2 border shrink-0 mt-0.5', colorClass)}>
        <ActionIcon className="icon-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{log.actorEmail}</span>
          <Badge variant="outline" className={cn('text-xs', colorClass)}>
            {log.action}
          </Badge>
          <Badge variant="secondary" className="text-xs">{log.entityType}</Badge>
          {log.entityId && (
            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              #{log.entityId}
            </code>
          )}
        </div>
        {metaStr && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{metaStr}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(log.createdAt)}</span>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function AdminAuditLogPage() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-audit-logs', entityType, action, page],
    queryFn: () =>
      listAdminAuditLogs({
        entityType: entityType !== 'all' ? entityType : undefined,
        action: action !== 'all' ? action : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const logs = data?.logs ?? MOCK_LOGS;
  const total = data?.total ?? MOCK_LOGS.length;

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppShell
      title="Audit Log"
      description="Track all administrative actions on the platform"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('mr-2 icon-sm', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 icon-sm" />
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder="Search by actor, entity, action..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t === 'all' ? 'All Entities' : t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={(v) => { setAction(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a} value={a}>{a === 'all' ? 'All Actions' : a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="icon-sm text-primary-accessible" />
              Activity Log
            </CardTitle>
            <span className="text-xs text-muted-foreground">{total} total entries</span>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No audit log entries</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting filters</p>
              </div>
            ) : (
              <div>
                {filtered.map((log) => (
                  <AuditLogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                <ChevronLeft className="icon-sm" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isFetching}
              >
                Next
                <ChevronRight className="icon-sm" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

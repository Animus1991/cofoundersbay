'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Flag,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  MessageSquare,
  User,
  FileText,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatRelativeTime } from '@/lib/utils';
import { listAdminReports, resolveAdminReport, type AdminReportItem } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * The page's own row from the moderation queue row.
 *
 * `/api/admin/reports` and `resolveAdminReport` have existed all along; this
 * screen listed a fixed array and its two menu items had no handler.
 *
 * `priority` has no field on the model. Rather than invent one, it is derived
 * from the report type: harassment is the category a moderator should see
 * first, and that is a rule stated here rather than a number pretending to be
 * measured.
 */
const REPORT_TYPE_MAP: Record<string, Report['type']> = {
  spam: 'spam',
  harassment: 'user',
  fake: 'user',
  inappropriate: 'content',
  other: 'content',
};

const REPORT_PRIORITY: Record<string, Report['priority']> = {
  harassment: 'high',
  fake: 'high',
  inappropriate: 'medium',
  spam: 'medium',
  other: 'low',
};

function toPageReport(row: AdminReportItem): Report {
  return {
    id: row.id,
    type: REPORT_TYPE_MAP[row.type] ?? 'content',
    reason: row.reason,
    reporterName: row.reporter?.name ?? row.reporter?.email ?? '\u2014',
    targetName: row.reported?.name ?? row.reported?.email ?? '\u2014',
    targetType: row.reported?.role ?? 'user',
    status: row.status === 'reviewed' ? 'reviewing' : row.status,
    priority: REPORT_PRIORITY[row.type] ?? 'low',
    createdAt: row.createdAt,
    targetId: row.reported?.id,
    reporterId: row.reporter?.id,
    reporterEmail: row.reporter?.email,
    context: row.context,
  };
}

type Report = {
  id: string;
  type: 'user' | 'message' | 'content' | 'spam';
  reason: string;
  description?: string;
  reporterName: string;
  reporterAvatar?: string;
  targetName: string;
  targetType: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  /** Live rows only: the reported and reporting accounts. */
  targetId?: string;
  reporterId?: string;
  reporterEmail?: string;
  context?: unknown;
};

type ResolveFn = (report: Report, resolution: 'resolved' | 'dismissed') => void;

function ReportCard({
  report,
  onResolve,
  onView,
}: {
  onView: (report: Report) => void;
  report: Report;
  /** Absent for the illustrative rows, which have nothing to write to. */
  onResolve?: ResolveFn;
}) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: 'bg-gray-500/10 text-muted-foreground border-gray-500/20', icon: <Clock className="icon-sm" /> },
    reviewing: { color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: <AlertTriangle className="icon-sm" /> },
    resolved: { color: 'bg-status-success-bg text-status-success border-status-success-border', icon: <CheckCircle2 className="icon-sm" /> },
    dismissed: { color: 'bg-gray-500/10 text-muted-foreground border-gray-500/20', icon: <XCircle className="icon-sm" /> },
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-500/10 text-muted-foreground',
    medium: 'bg-status-warning-bg text-status-warning',
    high: 'bg-status-danger-bg text-status-danger',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    user: <User className="icon-sm" aria-hidden="true" />,
    message: <MessageSquare className="icon-sm" aria-hidden="true" />,
    content: <FileText className="icon-sm" aria-hidden="true" />,
    spam: <AlertTriangle className="icon-sm" aria-hidden="true" />,
  };

  const config = statusConfig[report.status];

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="p-2 rounded-lg bg-secondary h-fit">
            {typeIcons[report.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{report.reason}</span>
                  <Badge variant="outline" className={cn('text-xs', priorityColors[report.priority])}>
                    {report.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Reported: <span className="font-medium">{report.targetName}</span> ({report.targetType})
                </p>
                {report.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {report.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs flex items-center gap-1', config.color)}>
                  {config.icon}
                  {report.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="icon-sm" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* These three had no handler. */}
                    <DropdownMenuItem onSelect={() => onView(report)}>View Details</DropdownMenuItem>
                    {report.targetId ? (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/user-detail/${report.targetId}`}>View Target</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem disabled>View Target</DropdownMenuItem>
                    )}
                    {report.reporterEmail ? (
                      <DropdownMenuItem asChild>
                        <a href={`mailto:${report.reporterEmail}?subject=${encodeURIComponent(`Your report: ${report.reason}`)}`}>Contact Reporter</a>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem disabled>Contact Reporter</DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-status-success"
                      disabled={!onResolve || report.status === 'resolved'}
                      onClick={() => onResolve?.(report, 'resolved')}
                    >
                      Mark Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-muted-foreground"
                      disabled={!onResolve || report.status === 'dismissed'}
                      onClick={() => onResolve?.(report, 'dismissed')}
                    >
                      Dismiss
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Avatar className="icon-sm">
                  <AvatarImage src={report.reporterAvatar} />
                  <AvatarFallback className="text-2xs">{report.reporterName[0]}</AvatarFallback>
                </Avatar>
                {report.reporterName}
              </span>
              <span><RelativeTime date={report.createdAt} format={formatRelativeTime} /></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown when the moderation queue is empty. */
const SEED_REPORTS: Report[] = [
  {
    id: '1',
    type: 'user',
    reason: 'Harassment',
    description: 'User sent multiple unwanted messages after being asked to stop.',
    reporterName: 'John Doe',
    targetName: 'Mike Johnson',
    targetType: 'User',
    status: 'pending',
    priority: 'high',
    createdAt: '2025-03-21T10:00:00.000Z',
  },
  {
    id: '2',
    type: 'spam',
    reason: 'Spam Content',
    description: 'Posting promotional links in community discussions.',
    reporterName: 'Jane Smith',
    targetName: 'Tom Brown',
    targetType: 'User',
    status: 'reviewing',
    priority: 'medium',
    createdAt: '2025-03-20T10:00:00.000Z',
  },
  {
    id: '3',
    type: 'content',
    reason: 'Inappropriate Content',
    description: 'Profile contains misleading information about credentials.',
    reporterName: 'Sarah Williams',
    targetName: 'Alex Chen',
    targetType: 'Profile',
    status: 'pending',
    priority: 'medium',
    createdAt: '2025-03-19T10:00:00.000Z',
  },
  {
    id: '4',
    type: 'message',
    reason: 'Offensive Language',
    reporterName: 'David Kim',
    targetName: 'Conversation #1234',
    targetType: 'Message',
    status: 'resolved',
    priority: 'low',
    createdAt: '2025-03-18T10:00:00.000Z',
  },
];

export default function AdminReportsPage() {
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Report | null>(null);
  const [type, setType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pending');

  // Mock data
  /*
   * The real moderation queue. The illustrative rows below are what an
   * empty queue shows; they carry no resolve handler, because there is
   * nothing behind them to resolve.
   */
  const qc = useQueryClient();
  const { success, error: showError } = useToast();
  const { data } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => listAdminReports({ limit: 100 }),
    staleTime: 30_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.reports ?? []).map(toPageReport), [data]);
  const isLive = live.length > 0;
  const reports: Report[] = isLive ? live : SEED_REPORTS;

  const resolve = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: 'resolved' | 'dismissed' }) =>
      resolveAdminReport(id, resolution),
    onSuccess: (_r, variables) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      success(variables.resolution === 'resolved' ? 'Report resolved' : 'Report dismissed');
    },
    onError: (err) =>
      showError('Could not update the report', err instanceof Error ? err.message : undefined),
  });

  const onResolve: ResolveFn = (report, resolution) =>
    resolve.mutate({ id: report.id, resolution });


  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !search ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.targetName.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'all' || r.type === type;
    const matchesTab = activeTab === 'all' || r.status === activeTab;
    return matchesSearch && matchesType && matchesTab;
  });

  const statusCounts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    reviewing: reports.filter((r) => r.status === 'reviewing').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-xl font-bold">{reports.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-status-warning">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-xl font-bold text-status-info">{statusCounts.reviewing}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-xl font-bold text-status-success">{statusCounts.resolved}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="reviewing">In Review ({statusCounts.reviewing})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({statusCounts.resolved})</TabsTrigger>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger aria-label="Report type" className="w-full sm:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} onResolve={isLive ? onResolve : undefined} onView={setViewing} />
          ))}
          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="font-medium">No reports found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All caught up!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Dialog open={viewing !== null} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.reason}</DialogTitle>
            <DialogDescription>
              {viewing ? `${viewing.reporterName} reported ${viewing.targetName}` : ''}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="capitalize">{viewing.type}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{viewing.status}</dd>
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="capitalize">{viewing.priority}</dd>
              <dt className="text-muted-foreground">Filed</dt>
              <dd>{new Date(viewing.createdAt).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</dd>
              {viewing.description && (
                <>
                  <dt className="col-span-2 text-muted-foreground">Description</dt>
                  <dd className="col-span-2 whitespace-pre-line">{viewing.description}</dd>
                </>
              )}
              {viewing.context != null && (
                <>
                  <dt className="col-span-2 text-muted-foreground">Context</dt>
                  <dd className="col-span-2">
                    <pre tabIndex={0} className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-2 text-xs">{JSON.stringify(viewing.context, null, 2)}</pre>
                  </dd>
                </>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

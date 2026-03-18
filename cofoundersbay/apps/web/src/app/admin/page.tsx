'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Flag,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  BarChart3,
  Search,
  MoreHorizontal,
  Clock,
  RefreshCw,
  GraduationCap,
  Plus,
  Trash2,
  Calendar,
  UserCheck,
  Mail,
  Send,
  ChevronRight,
  Download,
  Star,
  StarOff,
  Layers,
  Briefcase,
} from 'lucide-react';
import {
  listAdminReports,
  listAdminUsers,
  updateAdminReport,
  updateAdminUserModeration,
  getAdminStats,
  banUser,
  unbanUser,
  changeUserRole,
  listAdminAuditLogs,
  listAdminCohorts,
  createAdminCohort,
  deleteAdminCohort,
  listAdminEmailTemplates,
  getAdminEmailTemplatePreview,
  testSendAdminEmail,
  featureContent,
  removeContent,
  listEvents,
  listJobs,
  getMe,
  type AdminReportItem,
  type AdminUserItem,
  type AdminPlatformStats,
  type AdminAuditLogItem,
  type AdminCohortItem,
  type AdminEmailTemplate,
} from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatCard } from '@/components/common/StatCard';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const reportTypeConfig: Record<AdminReportItem['type'], { label: string; color: string }> = {
  spam: { label: 'Spam', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400' },
  harassment: { label: 'Harassment', color: 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400' },
  fake: { label: 'Fake Profile', color: 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400' },
  inappropriate: { label: 'Inappropriate', color: 'bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400' },
  other: { label: 'Other', color: 'bg-gray-500/15 text-gray-700 border-gray-500/30 dark:text-gray-400' },
};

const reportStatusConfig: Record<AdminReportItem['status'], { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-600 dark:text-amber-400', icon: Clock },
  reviewed: { label: 'Under Review', color: 'text-blue-600 dark:text-blue-400', icon: Eye },
  resolved: { label: 'Resolved', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
  dismissed: { label: 'Dismissed', color: 'text-muted-foreground', icon: XCircle },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function EmailTemplatesTab() {
  const { success, error: showError } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: listAdminEmailTemplates,
  });

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['admin-email-preview', selectedId],
    queryFn: () => getAdminEmailTemplatePreview(selectedId!),
    enabled: !!selectedId,
  });

  const templates: AdminEmailTemplate[] = listData?.templates ?? [];

  async function handleTestSend() {
    if (!selectedId || !testEmail) return;
    setSending(true);
    try {
      const result = await testSendAdminEmail(selectedId, testEmail);
      if (result.sent) success('Email sent', `Test email sent to ${testEmail}`);
      else showError('Not sent', result.reason ?? 'Email not configured');
    } catch {
      showError('Failed', 'Could not send test email');
    } finally {
      setSending(false);
    }
  }

  return (
    <TabsContent value="email" className="mt-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Template list */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Templates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {listLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : (
              templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedId(tpl.id)}
                  className={`flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                    selectedId === tpl.id ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Preview panel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-sm font-semibold">
                {selectedId ? `Preview: ${templates.find(t => t.id === selectedId)?.name ?? selectedId}` : 'Select a template'}
              </CardTitle>
              {selectedId && (
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="h-8 w-48 text-xs"
                  />
                  <Button
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={handleTestSend}
                    disabled={!testEmail || sending}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? 'Sending…' : 'Test Send'}
                  </Button>
                </div>
              )}
            </div>
            {selectedId && preview && (
              <p className="text-xs text-muted-foreground mt-1">
                Subject: <span className="font-medium text-foreground">{preview.subject}</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!selectedId && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Select a template to preview it</p>
              </div>
            )}
            {selectedId && previewLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full mt-4" />
              </div>
            )}
            {selectedId && preview && !previewLoading && (
              <div className="rounded-lg border border-border overflow-hidden">
                <iframe
                  srcDoc={preview.html}
                  title="Email preview"
                  className="w-full min-h-[400px] bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

function ReportCard({
  report,
  onResolve,
  onDismiss,
  onBanUser,
  isActing,
}: {
  report: AdminReportItem;
  onResolve: () => void;
  onDismiss: () => void;
  onBanUser: () => void;
  isActing: boolean;
}) {
  const typeConf = reportTypeConfig[report.type];
  const statusConf = reportStatusConfig[report.status];
  const StatusIcon = statusConf.icon;

  return (
    <Card className="group">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link href={`/profiles/${report.reported.id}`}>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-destructive/20 text-destructive">
                  {report.reported.name?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/profiles/${report.reported.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {report.reported.name || report.reported.email}
                </Link>
                <Badge variant="outline" className="text-xs">{report.reported.role}</Badge>
                <Badge variant="outline" className={cn('text-xs', typeConf.color)}>
                  {typeConf.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Reported by {report.reporter.name || report.reporter.email} · {formatTimeAgo(report.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('flex items-center gap-1 text-xs', statusConf.color)}>
              <StatusIcon className="h-3 w-3" />
              {statusConf.label}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isActing}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/profiles/${report.reported.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onResolve} className="text-emerald-400">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDismiss}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onBanUser} className="text-destructive">
                  <Ban className="h-4 w-4 mr-2" />
                  Ban user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-secondary/40 p-3">
          <p className="text-sm text-foreground">{report.reason}</p>
        </div>

        {report.status === 'pending' && (
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onDismiss} disabled={isActing}>
              Dismiss
            </Button>
            <Button size="sm" onClick={onResolve} disabled={isActing}>
              Resolve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserRow({
  user,
  onSuspend,
  onBan,
  onActivate,
  isActing,
}: {
  user: AdminUserItem;
  onSuspend: () => void;
  onBan: () => void;
  onActivate: () => void;
  isActing: boolean;
}) {
  const displayName = user.profile?.displayName ?? user.email;

  return (
    <div className="flex items-center gap-4 border-b border-border/40 p-4 transition-colors hover:bg-secondary/30">
      <Link href={`/profiles/${user.id}`}>
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user.profile?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/profiles/${user.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
            {displayName}
          </Link>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              user.moderationStatus === 'active' ? 'text-emerald-400 border-emerald-500/30' :
              user.moderationStatus === 'suspended' ? 'text-amber-400 border-amber-500/30' :
              'text-red-400 border-red-500/30',
            )}
          >
            {user.moderationStatus}
          </Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm capitalize text-foreground">{user.role}</p>
        {user.lastSeenAt && (
          <p className="text-xs text-muted-foreground">{formatTimeAgo(user.lastSeenAt)}</p>
        )}
      </div>
      <div className="hidden text-right md:block">
        <p className="text-sm text-foreground">{user.reportsCount} reports</p>
        <p className="text-xs text-muted-foreground">
          Joined {formatTimeAgo(user.createdAt)}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isActing}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/profiles/${user.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.moderationStatus === 'active' && (
            <DropdownMenuItem onClick={onSuspend} className="text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Suspend
            </DropdownMenuItem>
          )}
          {user.moderationStatus === 'suspended' && (
            <DropdownMenuItem onClick={onActivate} className="text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="mr-2 h-4 w-4" />
              Reactivate
            </DropdownMenuItem>
          )}
          {user.moderationStatus !== 'banned' && (
            <DropdownMenuItem onClick={onBan} className="text-destructive">
              <Ban className="mr-2 h-4 w-4" />
              Ban permanently
            </DropdownMenuItem>
          )}
          {user.moderationStatus === 'banned' && (
            <DropdownMenuItem onClick={onActivate} className="text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="mr-2 h-4 w-4" />
              Unban
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('reports');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          router.replace('/');
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        router.replace('/');
      });
  }, [router]);

  const [userSearch, setUserSearch] = useState('');
  const [cohortSearch, setCohortSearch] = useState('');
  const [showNewCohort, setShowNewCohort] = useState(false);
  const [newCohort, setNewCohort] = useState({ name: '', slug: '', description: '', startDate: '', endDate: '', capacity: '' });

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => getAdminStats(),
    staleTime: 30_000,
  });

  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => listAdminReports({ limit: 100 }),
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => listAdminUsers({ q: userSearch || undefined, limit: 100 }),
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => listAdminAuditLogs({ limit: 50 }),
    enabled: activeTab === 'audit',
  });

  const { data: cohortsData, isLoading: cohortsLoading, refetch: refetchCohorts } = useQuery({
    queryKey: ['admin-cohorts', cohortSearch],
    queryFn: () => listAdminCohorts({ q: cohortSearch || undefined, limit: 50 }),
    enabled: activeTab === 'cohorts',
  });

  const createCohortMutation = useMutation({
    mutationFn: (data: Parameters<typeof createAdminCohort>[0]) => createAdminCohort(data),
    onSuccess: () => {
      void refetchCohorts();
      setShowNewCohort(false);
      setNewCohort({ name: '', slug: '', description: '', startDate: '', endDate: '', capacity: '' });
      success('Cohort created', 'New program created successfully.');
    },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Could not create cohort'),
  });

  const deleteCohortMutation = useMutation({
    mutationFn: (cohortId: string) => deleteAdminCohort(cohortId),
    onSuccess: () => { void refetchCohorts(); success('Deleted', 'Cohort removed.'); },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Could not delete cohort'),
  });

  const { data: eventsData, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => listEvents({ limit: 50 }),
    enabled: activeTab === 'content',
    retry: 1,
  });

  const { data: jobsData, isLoading: jobsLoading, isError: jobsError, refetch: refetchJobs } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => listJobs({ limit: 50 }),
    enabled: activeTab === 'content',
    retry: 1,
  });

  const featureMutation = useMutation({
    mutationFn: ({ type, id, featured }: { type: 'event' | 'group' | 'job'; id: string; featured: boolean }) =>
      featureContent(type, id, featured),
    onSuccess: (_, { featured }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      success(featured ? 'Featured' : 'Unfeatured', 'Content visibility updated.');
    },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Please try again'),
  });

  const removeContentMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'event' | 'group' | 'job'; id: string }) =>
      removeContent(type, id, 'Removed by admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      success('Removed', 'Content removed from the platform.');
    },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Please try again'),
  });

  const exportAuditLogCSV = () => {
    const logs = auditData?.logs ?? [];
    if (!logs.length) return;
    const header = 'Actor,Action,Entity Type,Entity ID,Timestamp\n';
    const rows = logs.map((l) =>
      [l.actorEmail, l.action, l.entityType, l.entityId ?? '', new Date(l.createdAt).toISOString()].join(','),
    );
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = statsData?.stats;

  const reportMutation = useMutation({
    mutationFn: ({ id, status, banUserId }: {
      id: string;
      status: AdminReportItem['status'];
      banUserId?: string;
    }) =>
      updateAdminReport(id, {
        status,
        moderationStatus: banUserId ? 'banned' : undefined,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (vars.banUserId) success('User banned', 'Report resolved and user banned.');
      else if (vars.status === 'resolved') success('Report resolved', 'Action recorded.');
      else success('Report dismissed', 'No action taken.');
    },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Please try again'),
  });

  const userMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' | 'banned' }) =>
      updateAdminUserModeration(userId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const labels: Record<string, string> = {
        active: 'reactivated',
        suspended: 'suspended',
        banned: 'banned',
      };
      success(`User ${labels[vars.status]}`, `The user account has been ${labels[vars.status]}.`);
    },
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Please try again'),
  });

  const reports = reportsData?.reports ?? [];
  const users = usersData?.users ?? [];
  const pendingReports = reports.filter((r) => r.status === 'pending').length;
  const isActing = reportMutation.isPending || userMutation.isPending;

  const filteredUsers = userSearch
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
          (u.profile?.displayName ?? '').toLowerCase().includes(userSearch.toLowerCase()),
      )
    : users;

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Shield className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell
      title="Admin Dashboard"
      description="Manage users, moderate content, and monitor platform health"
      actions={
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => { void refetchReports(); void refetchUsers(); }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="Total Users"
          value={statsLoading ? '…' : (stats?.totalUsers ?? 0).toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          trend={stats?.newUsersThisWeek ? { value: stats.newUsersThisWeek, label: 'this week' } : undefined}
        />
        <StatCard
          label="Active Today"
          value={statsLoading ? '…' : (stats?.activeUsersToday ?? 0).toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Reports"
          value={statsLoading ? '…' : (stats?.pendingReports ?? pendingReports).toString()}
          icon={<Flag className="h-5 w-5" />}
          trend={(stats?.pendingReports ?? pendingReports) > 0 ? { value: -(stats?.pendingReports ?? pendingReports), label: 'open' } : undefined}
        />
        <StatCard
          label="Connections"
          value={statsLoading ? '…' : (stats?.totalConnections ?? 0).toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Messages"
          value={statsLoading ? '…' : (stats?.totalMessages ?? 0).toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Events"
          value={statsLoading ? '…' : (stats?.totalEvents ?? 0).toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="h-4 w-4" />
            Reports
            {pendingReports > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Layers className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Cohorts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Shield className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Moderation Queue
              {pendingReports > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">({pendingReports} pending)</span>
              )}
            </h2>
          </div>

          {reportsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-5">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : reports.filter((r) => r.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                <h3 className="text-lg font-semibold text-foreground">All clear!</h3>
                <p className="text-sm text-muted-foreground">No pending reports to review</p>
              </CardContent>
            </Card>
          ) : (
            reports
              .filter((r) => r.status === 'pending')
              .map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  isActing={isActing}
                  onResolve={() =>
                    reportMutation.mutate({ id: report.id, status: 'resolved' })
                  }
                  onDismiss={() =>
                    reportMutation.mutate({ id: report.id, status: 'dismissed' })
                  }
                  onBanUser={() =>
                    reportMutation.mutate({
                      id: report.id,
                      status: 'resolved',
                      banUserId: report.reported.id,
                    })
                  }
                />
              ))
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base">User Management</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-border/40 p-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isActing={isActing}
                    onSuspend={() => userMutation.mutate({ userId: user.id, status: 'suspended' })}
                    onBan={() => userMutation.mutate({ userId: user.id, status: 'banned' })}
                    onActivate={() => userMutation.mutate({ userId: user.id, status: 'active' })}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Management Tab */}
        <TabsContent value="content" className="mt-6 space-y-6">
          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Events
              </h2>
              <Button variant="ghost" size="sm" onClick={() => void refetchEvents()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
            </div>
            {eventsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-border/40 p-4">
                  <Skeleton className="h-8 w-8 rounded shrink-0" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div>
                </div>
              ))
            ) : eventsError ? (
              <Card><CardContent className="py-8 text-center text-sm text-destructive">Failed to load events. <button className="underline" onClick={() => void refetchEvents()}>Retry</button></CardContent></Card>
            ) : (eventsData?.events ?? []).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No events found</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  {(eventsData?.events ?? []).map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between gap-4 border-b border-border/40 p-4 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.mode} · {ev.attendeesCount} attendees</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          className={ev.isFeatured ? 'text-amber-500' : 'text-muted-foreground'}
                          onClick={() => featureMutation.mutate({ type: 'event', id: ev.id, featured: !ev.isFeatured })}
                          disabled={featureMutation.isPending}
                        >
                          {ev.isFeatured ? <StarOff className="h-4 w-4 mr-1" /> : <Star className="h-4 w-4 mr-1" />}
                          {ev.isFeatured ? 'Unfeature' : 'Feature'}
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="text-destructive"
                          onClick={() => removeContentMutation.mutate({ type: 'event', id: ev.id })}
                          disabled={removeContentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Jobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Job Postings
              </h2>
              <Button variant="ghost" size="sm" onClick={() => void refetchJobs()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
            </div>
            {jobsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-border/40 p-4">
                  <Skeleton className="h-8 w-8 rounded shrink-0" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div>
                </div>
              ))
            ) : jobsError ? (
              <Card><CardContent className="py-8 text-center text-sm text-destructive">Failed to load jobs. <button className="underline" onClick={() => void refetchJobs()}>Retry</button></CardContent></Card>
            ) : (jobsData?.jobs ?? []).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No job postings found</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  {(jobsData?.jobs ?? []).map((job) => (
                    <div key={job.id} className="flex items-center justify-between gap-4 border-b border-border/40 p-4 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{job.type ?? 'Full-time'} · {job.location ?? 'Remote'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          className={job.isFeatured ? 'text-amber-500' : 'text-muted-foreground'}
                          onClick={() => featureMutation.mutate({ type: 'job', id: job.id, featured: !job.isFeatured })}
                          disabled={featureMutation.isPending}
                        >
                          {job.isFeatured ? <StarOff className="h-4 w-4 mr-1" /> : <Star className="h-4 w-4 mr-1" />}
                          {job.isFeatured ? 'Unfeature' : 'Feature'}
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="text-destructive"
                          onClick={() => removeContentMutation.mutate({ type: 'job', id: job.id })}
                          disabled={removeContentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cohorts…"
                value={cohortSearch}
                onChange={(e) => setCohortSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button size="sm" className="gap-2" onClick={() => setShowNewCohort(!showNewCohort)}>
              <Plus className="h-4 w-4" />
              New Cohort
            </Button>
          </div>

          {showNewCohort && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Cohort / Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Name *</label>
                    <Input placeholder="e.g. Spring 2025 Accelerator" value={newCohort.name}
                      onChange={(e) => setNewCohort(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                    <Input placeholder="spring-2025" value={newCohort.slug} onChange={(e) => setNewCohort(p => ({ ...p, slug: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                    <Input type="date" value={newCohort.startDate} onChange={(e) => setNewCohort(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">End Date</label>
                    <Input type="date" value={newCohort.endDate} onChange={(e) => setNewCohort(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Capacity</label>
                    <Input type="number" placeholder="50" value={newCohort.capacity} onChange={(e) => setNewCohort(p => ({ ...p, capacity: e.target.value }))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <Input placeholder="Short description…" value={newCohort.description} onChange={(e) => setNewCohort(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" disabled={!newCohort.name || !newCohort.slug || createCohortMutation.isPending}
                    onClick={() => createCohortMutation.mutate({
                      name: newCohort.name,
                      slug: newCohort.slug,
                      description: newCohort.description || undefined,
                      startDate: newCohort.startDate || undefined,
                      endDate: newCohort.endDate || undefined,
                      capacity: newCohort.capacity ? parseInt(newCohort.capacity) : undefined,
                    })}>
                    {createCohortMutation.isPending ? 'Creating…' : 'Create'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewCohort(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {cohortsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-5"><div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64" /></div></CardContent></Card>
            ))
          ) : (cohortsData?.cohorts ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">No cohorts yet</h3>
                <p className="text-sm text-muted-foreground">Create your first cohort or program above</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(cohortsData?.cohorts ?? []).map((cohort) => (
                <Card key={cohort.id} className="group">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{cohort.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">/{cohort.slug}</p>
                        {cohort.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{cohort.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <UserCheck className="h-3 w-3" />
                            {cohort._count.members} members
                          </Badge>
                          {cohort.startDate && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {new Date(cohort.startDate).toLocaleDateString()}
                            </Badge>
                          )}
                          {cohort.capacity && (
                            <Badge variant="outline" className="text-xs">Cap: {cohort.capacity}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => deleteCohortMutation.mutate(cohort.id)}
                        disabled={deleteCohortMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Users by Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-foreground">{role}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">New Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Today</span>
                  <Badge variant="secondary">{stats?.newUsersToday ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">This Week</span>
                  <Badge variant="secondary">{stats?.newUsersThisWeek ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">This Month</span>
                  <Badge variant="secondary">{stats?.newUsersThisMonth ?? 0}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">DAU</span>
                  <Badge variant="secondary">{stats?.activeUsersToday ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">WAU</span>
                  <Badge variant="secondary">{stats?.activeUsersThisWeek ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">MAU</span>
                  <Badge variant="secondary">{stats?.activeUsersThisMonth ?? 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Templates Tab */}
        <EmailTemplatesTab />

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Admin Audit Log</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAuditLogCSV}
                  disabled={!auditData?.logs?.length}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {auditLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-border/40 p-4">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                ))
              ) : (auditData?.logs ?? []).length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No audit logs yet</p>
                </div>
              ) : (
                (auditData?.logs ?? []).map((log) => (
                  <div key={log.id} className="flex items-start gap-4 border-b border-border/40 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{log.actorEmail}</span>
                        <Badge variant="outline" className="text-xs">{log.action}</Badge>
                        <Badge variant="secondary" className="text-xs">{log.entityType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {log.entityId && <span>ID: {log.entityId.slice(0, 8)}… · </span>}
                        {formatTimeAgo(log.createdAt)}
                      </p>
                      {log.meta && Object.keys(log.meta).length > 0 && (
                        <pre className="mt-2 rounded bg-secondary/40 p-2 text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

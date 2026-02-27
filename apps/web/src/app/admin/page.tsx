'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import {
  listAdminReports,
  listAdminUsers,
  updateAdminReport,
  updateAdminUserModeration,
  type AdminReportItem,
  type AdminUserItem,
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
  spam: { label: 'Spam', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  harassment: { label: 'Harassment', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  fake: { label: 'Fake Profile', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  inappropriate: { label: 'Inappropriate', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  other: { label: 'Other', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

const reportStatusConfig: Record<AdminReportItem['status'], { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-400', icon: Clock },
  reviewed: { label: 'Under Review', color: 'text-blue-400', icon: Eye },
  resolved: { label: 'Resolved', color: 'text-emerald-400', icon: CheckCircle },
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
            <DropdownMenuItem onClick={onSuspend} className="text-amber-400">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Suspend
            </DropdownMenuItem>
          )}
          {user.moderationStatus === 'suspended' && (
            <DropdownMenuItem onClick={onActivate} className="text-emerald-400">
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
            <DropdownMenuItem onClick={onActivate} className="text-emerald-400">
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
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [userSearch, setUserSearch] = useState('');

  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => listAdminReports({ limit: 100 }),
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => listAdminUsers({ q: userSearch || undefined, limit: 100 }),
  });

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={usersLoading ? '…' : users.length.toString()}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Reports"
          value={reportsLoading ? '…' : pendingReports.toString()}
          icon={<Flag className="h-5 w-5" />}
          trend={pendingReports > 0 ? { value: -pendingReports, label: 'open' } : undefined}
        />
        <StatCard
          label="Suspended"
          value={usersLoading ? '…' : users.filter((u) => u.moderationStatus === 'suspended').length.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Banned"
          value={usersLoading ? '…' : users.filter((u) => u.moderationStatus === 'banned').length.toString()}
          icon={<Ban className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports">
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
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Detailed platform analytics coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

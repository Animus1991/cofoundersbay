'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Flag,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  MessageSquare,
  TrendingUp,
  Activity,
  BarChart3,
  Settings,
  Search,
  MoreHorizontal,
  Calendar,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

// Mock data
type Report = {
  id: string;
  type: 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reportedUser: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  reporterUser: {
    id: string;
    name: string;
  };
  reason: string;
  createdAt: Date;
  context?: string;
};

const mockReports: Report[] = [
  {
    id: '1',
    type: 'spam',
    status: 'pending',
    reportedUser: { id: 'u1', name: 'John Spammer', role: 'founder' },
    reporterUser: { id: 'u2', name: 'Alex User' },
    reason: 'Sending promotional messages to multiple users',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    context: 'Check out my amazing opportunity...',
  },
  {
    id: '2',
    type: 'fake',
    status: 'pending',
    reportedUser: { id: 'u3', name: 'Fake Investor', role: 'investor' },
    reporterUser: { id: 'u4', name: 'Maria Founder' },
    reason: 'Profile claims to be VC but has fake credentials',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3',
    type: 'harassment',
    status: 'reviewed',
    reportedUser: { id: 'u5', name: 'Rude Person', role: 'mentor' },
    reporterUser: { id: 'u6', name: 'George Startup' },
    reason: 'Aggressive behavior in messages',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    context: 'Your idea is terrible and you should quit...',
  },
];

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  joinedAt: Date;
  lastActive: Date;
  reportsCount: number;
  profileComplete: number;
};

const mockUsers: UserData[] = [
  {
    id: 'u1',
    name: 'Alex Papadopoulos',
    email: 'alex@example.com',
    role: 'founder',
    status: 'active',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    lastActive: new Date(Date.now() - 1000 * 60 * 5),
    reportsCount: 0,
    profileComplete: 85,
  },
  {
    id: 'u2',
    name: 'Maria Mentor',
    email: 'maria@example.com',
    role: 'mentor',
    status: 'active',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    lastActive: new Date(Date.now() - 1000 * 60 * 60),
    reportsCount: 1,
    profileComplete: 100,
  },
  {
    id: 'u3',
    name: 'George Investor',
    email: 'george@example.com',
    role: 'investor',
    status: 'suspended',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    reportsCount: 3,
    profileComplete: 60,
  },
];

const reportTypeConfig: Record<Report['type'], { label: string; color: string }> = {
  spam: { label: 'Spam', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  harassment: { label: 'Harassment', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  fake: { label: 'Fake Profile', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  inappropriate: { label: 'Inappropriate', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  other: { label: 'Other', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

const statusConfig: Record<Report['status'], { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-400', icon: Clock },
  reviewed: { label: 'Under Review', color: 'text-blue-400', icon: Eye },
  resolved: { label: 'Resolved', color: 'text-emerald-400', icon: CheckCircle },
  dismissed: { label: 'Dismissed', color: 'text-muted-foreground', icon: XCircle },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ReportCard({ report, onResolve, onDismiss, onBan }: {
  report: Report;
  onResolve: () => void;
  onDismiss: () => void;
  onBan: () => void;
}) {
  const typeConf = reportTypeConfig[report.type];
  const statusConf = statusConfig[report.status];
  const StatusIcon = statusConf.icon;

  return (
    <Card className="group">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={report.reportedUser.avatar || undefined} />
              <AvatarFallback className="bg-destructive/20 text-destructive">
                {report.reportedUser.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{report.reportedUser.name}</span>
                <Badge variant="outline" className={cn('text-xs', typeConf.color)}>
                  {typeConf.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Reported by {report.reporterUser.name} • {formatTimeAgo(report.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('flex items-center gap-1 text-xs', statusConf.color)}>
              <StatusIcon className="h-3 w-3" />
              {statusConf.label}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View messages
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
                <DropdownMenuItem onClick={onBan} className="text-destructive">
                  <Ban className="h-4 w-4 mr-2" />
                  Ban user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-lg bg-secondary/40">
          <p className="text-sm text-foreground">{report.reason}</p>
          {report.context && (
            <p className="mt-2 text-xs text-muted-foreground italic">"{report.context}"</p>
          )}
        </div>

        {report.status === 'pending' && (
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button size="sm" onClick={onResolve}>
              Take action
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserRow({ user, onSuspend, onBan, onActivate }: {
  user: UserData;
  onSuspend: () => void;
  onBan: () => void;
  onActivate: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/40 hover:bg-secondary/30 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary">
          {user.name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{user.name}</span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              user.status === 'active' ? 'text-emerald-400 border-emerald-500/30' :
              user.status === 'suspended' ? 'text-amber-400 border-amber-500/30' :
              'text-red-400 border-red-500/30'
            )}
          >
            {user.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="hidden sm:block text-right">
        <p className="text-sm text-foreground">{user.role}</p>
        <p className="text-xs text-muted-foreground">Profile: {user.profileComplete}%</p>
      </div>
      <div className="hidden md:block text-right">
        <p className="text-sm text-foreground">{user.reportsCount} reports</p>
        <p className="text-xs text-muted-foreground">Active {formatTimeAgo(user.lastActive)}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            View profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MessageSquare className="h-4 w-4 mr-2" />
            Send message
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === 'active' && (
            <DropdownMenuItem onClick={onSuspend} className="text-amber-400">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Suspend
            </DropdownMenuItem>
          )}
          {user.status === 'suspended' && (
            <DropdownMenuItem onClick={onActivate} className="text-emerald-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              Reactivate
            </DropdownMenuItem>
          )}
          {user.status !== 'banned' && (
            <DropdownMenuItem onClick={onBan} className="text-destructive">
              <Ban className="h-4 w-4 mr-2" />
              Ban permanently
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function AdminPage() {
  const { success, error: showError } = useToast();
  const [reports, setReports] = useState(mockReports);
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');

  const pendingReports = reports.filter((r) => r.status === 'pending').length;

  const handleResolveReport = (id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'resolved' as const } : r));
    success('Report resolved', 'Action taken on the reported user');
  };

  const handleDismissReport = (id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'dismissed' as const } : r));
    success('Report dismissed', 'No action taken');
  };

  const handleBanUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: 'banned' as const } : u));
    success('User banned', 'The user has been permanently banned');
  };

  const handleSuspendUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: 'suspended' as const } : u));
    success('User suspended', 'The user has been temporarily suspended');
  };

  const handleActivateUser = (userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: 'active' as const } : u));
    success('User reactivated', 'The user account is now active');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell
      title="Admin Dashboard"
      description="Manage users, moderate content, and monitor platform health"
      actions={
        <Link href="/admin/settings">
          <Button variant="secondary" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={users.length.toString()}
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 12, label: 'vs last week' }}
        />
        <StatCard
          label="Pending Reports"
          value={pendingReports.toString()}
          icon={<Flag className="h-5 w-5" />}
          trend={pendingReports > 0 ? { value: -pendingReports, label: 'open' } : undefined}
        />
        <StatCard
          label="Active Today"
          value="234"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="New This Week"
          value="45"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 23, label: 'vs last week' }}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="h-4 w-4" />
            Reports
            {pendingReports > 0 && (
              <Badge className="ml-1">{pendingReports}</Badge>
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
              Moderation Queue ({pendingReports} pending)
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </div>
          </div>

          {reports.filter((r) => r.status === 'pending').map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onResolve={() => handleResolveReport(report.id)}
              onDismiss={() => handleDismissReport(report.id)}
              onBan={() => handleBanUser(report.reportedUser.id)}
            />
          ))}

          {pendingReports === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">All clear!</h3>
                <p className="text-sm text-muted-foreground">No pending reports to review</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">User Management</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onSuspend={() => handleSuspendUser(user.id)}
                  onBan={() => handleBanUser(user.id)}
                  onActivate={() => handleActivateUser(user.id)}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground">Coming soon - detailed platform analytics</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

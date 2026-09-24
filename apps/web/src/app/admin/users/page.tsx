'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  Mail,
  CheckCircle2,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatRelativeTime } from '@/lib/utils';
import { listAdminUsers, updateAdminUserModeration, changeUserRole, type AdminUserItem } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * The page's own row from the admin row.
 *
 * `/api/admin/users` and `listAdminUsers` have existed all along; this screen
 * listed a fixed array. `verified` and `tenant` have no counterpart on the
 * admin payload and are left unset rather than asserted — an unverified badge
 * on a verified account is worse than no badge.
 *
 * `moderationStatus` is the schema's word and maps straight across; "pending"
 * is a state the page knows and the model does not, so nothing maps onto it.
 */
function toPageUser(row: AdminUserItem): User {
  return {
    id: row.id,
    name: row.profile?.displayName ?? row.email,
    email: row.email,
    avatar: row.profile?.avatarUrl ?? undefined,
    role: row.role,
    status: row.moderationStatus,
    verified: false,
    createdAt: row.createdAt,
    lastActive: row.lastSeenAt ?? '',
  };
}

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'active' | 'suspended' | 'pending' | 'banned';
  verified: boolean;
  createdAt: string;
  lastActive: string;
  tenant?: string;
};

/** The schema's roles (`enum Role`), in the order an admin reaches for them. */
const ASSIGNABLE_ROLES = ['founder', 'mentor', 'investor', 'org', 'admin'] as const;

type RowActions = {
  onModerate: (user: User, status: 'active' | 'suspended' | 'banned') => void;
  onRole: (user: User, role: (typeof ASSIGNABLE_ROLES)[number]) => void;
};

function UserRow({ user, onModerate, onRole }: { user: User } & RowActions) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    active: { color: 'bg-status-success-bg text-status-success border-status-success-border', icon: <CheckCircle2 className="icon-sm" /> },
    suspended: { color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: <AlertTriangle className="icon-sm" /> },
    pending: { color: 'bg-gray-500/10 text-muted-foreground border-gray-500/20', icon: null },
    banned: { color: 'bg-status-danger-bg text-status-danger border-status-danger-border', icon: <Ban className="icon-sm" /> },
  };

  const config = statusConfig[user.status];
  const initials = user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '??';

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/p/${user.id}`} className="font-medium hover:text-primary-accessible transition-colors">
            {user.name}
          </Link>
          {user.verified && <CheckCircle2 className="icon-sm text-primary-accessible" />}
        </div>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        <p className="mt-0.5 text-xs capitalize text-muted-foreground md:hidden">
          {user.role} · {user.status}{user.tenant ? ` · ${user.tenant}` : ''}
        </p>
      </div>
      <div className="hidden md:block text-sm text-muted-foreground w-24">
        {user.role}
      </div>
      <div className="hidden lg:block text-sm text-muted-foreground w-32">
        {user.tenant || 'Public'}
      </div>
      <div className="hidden md:block text-sm text-muted-foreground w-28">
        {user.lastActive
          ? <RelativeTime date={user.lastActive} format={formatRelativeTime} />
          : '—'}
      </div>
      <Badge variant="outline" className={cn('text-xs flex items-center gap-1 w-24 justify-center', config.color)}>
        {config.icon}
        {user.status}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="icon-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/p/${user.id}`}>View Profile</Link>
          </DropdownMenuItem>
          {/* Every item below had no handler: Send Email, Change Role,
              Suspend, Reactivate and Ban closed the menu and did nothing.
              The routes were there all along (admin.controller.ts:
              PATCH users/:userId/role, PATCH users/:userId/moderation). */}
          <DropdownMenuItem asChild>
            <a href={`mailto:${user.email}`}>
              <Mail className="mr-2 icon-sm" aria-hidden="true" />
              Send Email
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Shield className="icon-sm" aria-hidden="true" />
            Change Role
          </DropdownMenuLabel>
          {ASSIGNABLE_ROLES.map((r) => {
            const current = user.role.toLowerCase() === r;
            return (
              <DropdownMenuItem key={r} disabled={current} onSelect={() => onRole(user, r)} className="pl-8 capitalize">
                {r}
                {current && <CheckCircle2 className="ml-auto icon-sm text-primary-accessible" aria-label="Current role" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          {user.status === 'active' && (
            <DropdownMenuItem className="text-status-warning" onSelect={() => onModerate(user, 'suspended')}>
              <AlertTriangle className="mr-2 icon-sm" aria-hidden="true" />
              Suspend User
            </DropdownMenuItem>
          )}
          {(user.status === 'suspended' || user.status === 'banned') && (
            <DropdownMenuItem className="text-status-success" onSelect={() => onModerate(user, 'active')}>
              <CheckCircle2 className="mr-2 icon-sm" aria-hidden="true" />
              {user.status === 'banned' ? 'Lift Ban' : 'Reactivate User'}
            </DropdownMenuItem>
          )}
          {user.status !== 'banned' && (
            <DropdownMenuItem className="text-destructive-accessible" onSelect={() => onModerate(user, 'banned')}>
              <UserX className="mr-2 icon-sm" aria-hidden="true" />
              Ban User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Shown when the directory has not loaded. */
const SEED_USERS: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Founder',
    status: 'active',
    verified: true,
    createdAt: 'Jan 15, 2025',
    lastActive: '2 hours ago',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Mentor',
    status: 'active',
    verified: true,
    createdAt: 'Feb 1, 2025',
    lastActive: '1 day ago',
    tenant: 'TechStars Athens',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'Founder',
    status: 'suspended',
    verified: false,
    createdAt: 'Mar 10, 2025',
    lastActive: '1 week ago',
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'Investor',
    status: 'active',
    verified: true,
    createdAt: 'Mar 5, 2025',
    lastActive: '3 hours ago',
  },
  {
    id: '5',
    name: 'Tom Brown',
    email: 'tom@example.com',
    role: 'Founder',
    status: 'pending',
    verified: false,
    createdAt: 'Mar 20, 2025',
    lastActive: 'Never',
  },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Mock data
  /*
   * The real directory. The seed below is what an empty instance shows, so
   * the screen still teaches its shape rather than opening blank.
   */
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listAdminUsers({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.users ?? []).map(toPageUser), [data]);
  const users: User[] = live.length > 0 ? live : isLoading ? [] : SEED_USERS;
  const isLive = live.length > 0;
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const confirm = useConfirm();

  // Writes go to the real directory only. The seed rows show the screen's
  // shape on an empty instance; acting on them would report a change that
  // never reached any account.
  const refuseOnSeed = () => {
    error('Nothing to update', 'These rows are illustrative until the user directory loads.');
  };

  const moderate: RowActions['onModerate'] = async (user, next) => {
    if (!isLive) return refuseOnSeed();
    if (next === 'banned') {
      const ok = await confirm({
        title: `Ban ${user.name}?`,
        description: 'They are signed out and cannot sign back in until the ban is lifted from this menu.',
        confirmLabel: 'Ban user',
      });
      if (!ok) return;
    }
    try {
      await updateAdminUserModeration(user.id, next);
      success('Status updated', `${user.name} is now ${next}.`);
    } catch (err) {
      error('Could not update the status', err instanceof Error ? err.message : undefined);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  };

  const assignRole: RowActions['onRole'] = async (user, next) => {
    if (!isLive) return refuseOnSeed();
    try {
      await changeUserRole(user.id, next);
      success('Role updated', `${user.name} is now ${next}.`);
    } catch (err) {
      error('Could not change the role', err instanceof Error ? err.message : undefined);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  };


  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = role === 'all' || u.role.toLowerCase() === role;
    const matchesStatus = status === 'all' || u.status === status;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const exportCsv = () => {
    const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows = filteredUsers.map((u) => [u.name, u.email, u.role, u.status, u.createdAt, u.lastActive].map((v) => cell(v ?? '')).join(','));
    const csv = ['name,email,role,status,created_at,last_active', ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusCounts = {
    all: users.length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    pending: users.filter((u) => u.status === 'pending').length,
  };

  return (
    <AppShell
      actions={
        <>
          {/* Had no handler. Exports what the filters show. */}
          <Button onClick={exportCsv} disabled={filteredUsers.length === 0}>
            Export Users
          </Button>
        </>
      }
    >
      <div className="py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-status-success">{statusCounts.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-muted-foreground">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Suspended</p>
              <p className="text-xl font-bold text-status-warning">{statusCounts.suspended}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger aria-label="Role" className="w-full sm:w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="founder">Founder</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Status" className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground">
            <div className="w-10" />
            <div className="flex-1">User</div>
            <div className="w-24">Role</div>
            <div className="hidden lg:block w-32">Tenant</div>
            <div className="w-28">Last Active</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-8" />
          </div>
          {filteredUsers.map((user) => (
            <UserRow key={user.id} user={user} onModerate={moderate} onRole={assignRole} />
          ))}
          {filteredUsers.length === 0 && (
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
              <h3 className="font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

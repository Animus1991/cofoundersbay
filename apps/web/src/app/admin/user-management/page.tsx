'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  MoreHorizontal,
  Shield,
  Ban,
  Mail,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Download,
  RefreshCw,
  Eye,
  Clock,
  User,
  GraduationCap,
  Rocket,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatRelativeTime } from '@/lib/utils';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAdminUsers,
  updateAdminUserModeration,
  changeUserRole,
  type AdminUserItem,
} from '@/lib/api';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type UserStatus = 'active' | 'suspended' | 'pending' | 'banned';
type UserRole = 'admin' | 'moderator' | 'mentor' | 'founder' | 'co-founder' | 'user';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  createdAt: string;
  lastActive: string;
  location?: string;
  tenant?: string;
};

/**
 * The page's own row from the admin row.
 *
 * Every action on this screen wrote to local state and reported success:
 * "Status updated", "Role updated", "Bulk update" — and nothing left the
 * browser. They write through the admin endpoints now, and the list refreshes
 * from the server rather than from what the page assumed happened.
 *
 * `verified`, `location` and `tenant` have no counterpart on the admin payload
 * and stay unset rather than asserted.
 */
function toManagedUser(row: AdminUserItem): ManagedUser {
  const role = (['admin', 'moderator', 'mentor', 'founder', 'co-founder', 'user'] as const)
    .includes(row.role as UserRole)
    ? (row.role as UserRole)
    : 'user';
  return {
    id: row.id,
    name: row.profile?.displayName ?? row.email,
    email: row.email,
    avatar: row.profile?.avatarUrl ?? undefined,
    role,
    status: row.moderationStatus,
    verified: false,
    createdAt: row.createdAt,
    lastActive: row.lastSeenAt ?? '',
  };
}

/** Shown when the directory has not loaded. */
const MOCK_USERS: ManagedUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'founder',
    status: 'active',
    verified: true,
    createdAt: '2024-01-15',
    lastActive: '2026-09-04T08:00:00.000Z',
    location: 'Athens, GR',
    tenant: 'Public',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'mentor',
    status: 'active',
    verified: true,
    createdAt: '2024-02-01',
    lastActive: '2026-09-03T10:00:00.000Z',
    location: 'London, UK',
    tenant: 'TechStars Athens',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'founder',
    status: 'suspended',
    verified: false,
    createdAt: '2024-03-10',
    lastActive: '2026-08-28T10:00:00.000Z',
    location: 'Berlin, DE',
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'admin',
    status: 'active',
    verified: true,
    createdAt: '2024-03-05',
    lastActive: '2026-09-04T07:00:00.000Z',
    location: 'New York, US',
  },
  {
    id: '5',
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: 'user',
    status: 'pending',
    verified: false,
    createdAt: '2024-04-02',
    lastActive: '',
    location: 'Boston, MA',
  },
];

const STATUS_STYLES: Record<UserStatus, string> = {
  active: 'bg-status-success-bg text-status-success border-status-success-border',
  suspended: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  pending: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  banned: 'bg-status-danger-bg text-status-danger border-status-danger-border',
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin: <Shield className="icon-sm" />,
  moderator: <Award className="icon-sm" />,
  mentor: <GraduationCap className="icon-sm" />,
  founder: <Rocket className="icon-sm" />,
  'co-founder': <Users className="icon-sm" />,
  user: <User className="icon-sm" />,
};

export default function AdminUserManagementPage() {
  const { success, error } = useToast();
  const qc = useQueryClient();
  const { data: adminUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listAdminUsers({ limit: 200 }),
    staleTime: 60_000,
    retry: 0,
  });

  const [users, setUsers] = useState<ManagedUser[]>(MOCK_USERS);
  /** True once real rows are in hand: the write paths refuse to act on the
   *  illustrative ones, which have no server row behind them. */
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const rows = adminUsers?.users ?? [];
    if (rows.length === 0) return;
    setUsers(rows.map(toManagedUser));
    setIsLive(true);
  }, [adminUsers]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'lastActive'>('name');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const list = users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.location?.toLowerCase().includes(q) ?? false);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });

    list.sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      return String(av).localeCompare(String(bv));
    });

    return list;
  }, [users, search, roleFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    pending: users.filter((u) => u.status === 'pending').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? paginated.map((u) => u.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  /** `pending` is a state this page knows and the model does not. */
  const moderationOf = (status: UserStatus): 'active' | 'suspended' | 'banned' | null =>
    status === 'active' || status === 'suspended' || status === 'banned' ? status : null;

  const updateStatus = async (id: string, status: UserStatus) => {
    const moderation = moderationOf(status);
    if (!moderation) {
      error('Not a stored status', 'The platform records active, suspended or banned.');
      return;
    }
    if (!isLive) {
      error('Nothing to update', 'These rows are illustrative until the directory loads.');
      return;
    }
    // Optimistic, then reconciled with the server on refresh.
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    try {
      await updateAdminUserModeration(id, moderation);
      success('Status updated', `User is now ${status}.`);
    } catch (err) {
      error('Could not update the status', err instanceof Error ? err.message : undefined);
    } finally {
      void refresh();
    }
  };

  const updateRole = async (id: string, role: UserRole) => {
    if (!isLive) {
      error('Nothing to update', 'These rows are illustrative until the directory loads.');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      await changeUserRole(id, role);
      success('Role updated', `User role changed to ${role}.`);
    } catch (err) {
      error('Could not update the role', err instanceof Error ? err.message : undefined);
    } finally {
      void refresh();
    }
  };

  const bulkAction = async (action: 'activate' | 'suspend' | 'ban') => {
    if (selectedIds.length === 0) {
      error('No selection', 'Select at least one user first.');
      return;
    }
    if (!isLive) {
      error('Nothing to update', 'These rows are illustrative until the directory loads.');
      return;
    }
    const status: UserStatus =
      action === 'activate' ? 'active' : action === 'ban' ? 'banned' : 'suspended';
    const results = await Promise.allSettled(
      selectedIds.map((id) => updateAdminUserModeration(id, status)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      error('Bulk update partly failed', `${failed} of ${selectedIds.length} could not be changed.`);
    } else {
      success('Bulk update', `${selectedIds.length} user(s) set to ${status}.`);
    }
    setSelectedIds([]);
    void refresh();
  };

  return (
    <AppShell
      title="User Management"
      description="Search, filter, verify, and moderate platform accounts. Bulk actions apply to selected rows."
      showHelp
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setUsers(MOCK_USERS)}>
            <RefreshCw className="icon-sm mr-1.5" />
            Reset demo data
          </Button>
          <Button variant="outline" size="sm">
            <Download className="icon-sm mr-1.5" />
            Export CSV
          </Button>
        </div>
      }
    >
      <HelpCallout id="admin-user-management" title="How this page works">
        <p>
          Use the <strong>filters</strong> on the left to narrow by role or status. Select rows with
          checkboxes for <strong>bulk activate, suspend, or delete</strong>. Open a user with the eye
          icon or row menu — full detail lives on{' '}
          <Link href="/admin/user-detail/1" className="text-primary-accessible underline-offset-2 hover:underline">
            User detail
          </Link>
          .
        </p>
      </HelpCallout>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="founder">Founder</SelectItem>
                <SelectItem value="co-founder">Co-founder</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort by</p>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="createdAt">Created date</SelectItem>
                <SelectItem value="lastActive">Last active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bulk actions</p>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => void bulkAction('activate')}>
              <CheckCircle2 className="icon-sm mr-2" /> Activate selected
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => void bulkAction('suspend')}>
              <Ban className="icon-sm mr-2" /> Suspend selected
            </Button>
            {/*
              * "Delete selected" removed rows from a local array and said so
              * in a toast. There is no delete-user endpoint, and there should
              * not be one behind a bulk button — banning is the reversible
              * action the platform actually records.
              */}
            <Button variant="destructive" size="sm" className="w-full justify-start" onClick={() => void bulkAction('ban')}>
              <Ban className="icon-sm mr-2" /> Ban selected
            </Button>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total users', value: stats.total, icon: Users },
              { label: 'Active', value: stats.active, icon: CheckCircle2, className: 'text-status-success' },
              { label: 'Pending', value: stats.pending, icon: Clock, className: 'text-status-warning' },
              { label: 'Suspended', value: stats.suspended, icon: Ban, className: 'text-status-danger' },
            ].map(({ label, value, icon: Icon, className }) => (
              <Card key={label}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={cn('text-2xl font-bold', className)}>{value}</p>
                  </div>
                  <Icon className={cn('icon-lg text-muted-foreground', className)} />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or location…"
              className="pl-9"
              aria-label="Search users"
            />
          </div>

          <Card>
            <div className="flex items-center gap-3 border-b px-4 py-3 text-sm text-muted-foreground">
              <Checkbox
                checked={paginated.length > 0 && selectedIds.length === paginated.length}
                onCheckedChange={(v) => toggleAll(Boolean(v))}
                aria-label="Select all on page"
              />
              <span>{selectedIds.length} selected · {filtered.length} matching</span>
            </div>

            {paginated.map((user) => {
              const initials =
                user.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || '??';

              return (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selectedIds.includes(user.id)}
                    onCheckedChange={(v) => toggleOne(user.id, Boolean(v))}
                    aria-label={`Select ${user.name}`}
                  />
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/user-detail/${user.id}`} className="font-medium hover:text-primary-accessible">
                        {user.name}
                      </Link>
                      {user.verified && <CheckCircle2 className="icon-sm text-primary-accessible" aria-label="Verified" />}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="gap-1 capitalize">
                    {ROLE_ICONS[user.role]}
                    {user.role}
                  </Badge>
                  <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[user.status])}>
                    {user.status}
                  </Badge>
                  <span className="hidden text-sm text-muted-foreground md:inline">
                    {user.lastActive
                      ? <RelativeTime date={user.lastActive} format={formatRelativeTime} />
                      : '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailUser(user)} aria-label={`Quick view ${user.name}`}>
                      <Eye className="icon-sm" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${user.name}`}>
                          <MoreHorizontal className="icon-sm" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/user-detail/${user.id}`}>Open full profile</Link>
                        </DropdownMenuItem>
                        {/*
                          * Verification has no field on the model and no
                          * endpoint. The item stays, disabled with its reason,
                          * rather than flipping a boolean nobody stores.
                          */}
                        <DropdownMenuItem disabled title="Verification is not recorded yet">
                          {user.verified ? 'Remove verification' : 'Mark verified'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void updateStatus(user.id, 'active')}>
                          <CheckCircle2 className="mr-2 icon-sm" /> Set active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void updateStatus(user.id, 'suspended')}>
                          <Ban className="mr-2 icon-sm" /> Suspend
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void updateRole(user.id, 'admin')}>
                          <Shield className="mr-2 icon-sm" /> Make admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive-accessible"
                          onClick={() => void updateStatus(user.id, 'banned')}
                        >
                          <UserX className="mr-2 icon-sm" /> Ban user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {paginated.length === 0 && (
              <CardContent className="py-12 text-center">
                <Users className="mx-auto icon-xl text-muted-foreground/40" />
                <p className="mt-3 font-medium">No users match your filters</p>
                <p className="text-sm text-muted-foreground">Clear search or change role/status filters.</p>
              </CardContent>
            )}
          </Card>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="icon-sm" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="icon-sm" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailUser?.name}</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{detailUser.email}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">{detailUser.role}</Badge>
                <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[detailUser.status])}>
                  {detailUser.status}
                </Badge>
                {detailUser.verified && <Badge>Verified</Badge>}
              </div>
              <dl className="grid grid-cols-2 gap-2">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{detailUser.createdAt}</dd>
                <dt className="text-muted-foreground">Last active</dt>
                <dd>{detailUser.lastActive}</dd>
                <dt className="text-muted-foreground">Location</dt>
                <dd>{detailUser.location ?? '—'}</dd>
                <dt className="text-muted-foreground">Tenant</dt>
                <dd>{detailUser.tenant ?? 'Public'}</dd>
              </dl>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm">
                  <Link href={`/admin/user-detail/${detailUser.id}`}>Full admin view</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDetailUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

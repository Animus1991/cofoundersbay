'use client';

import { useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Shield,
  UserX,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Send,
  Copy,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useTenant } from '@/components/providers/TenantContext';
import { getTenantMembers, updateTenantMember, removeTenantMember, type TenantMemberItem } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyTenantMembers } from '@/components/common/EmptyStates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { qk } from '@/lib/query-keys';
import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';

/**
 * The page's own row from the tenant membership row.
 *
 * `/api/tenants/:id/members` and its client have existed all along, and
 * `TenantContext` already resolves which tenant this is — the page just never
 * asked either of them.
 *
 * Four fields have no source and stay absent rather than being filled:
 * presence, an engagement score, milestones completed and sessions attended
 * are all activity the membership row does not record. The header tiles read
 * dashes for them, which is what this page used to do with `Math.round(total
 * * 0.08)` before that was removed.
 */
function toPageMember(row: TenantMemberItem): Member {
  return {
    id: row.id,
    userId: row.userId,
    name: row.user.profile?.displayName ?? row.user.email,
    email: row.user.email,
    avatarUrl: row.user.profile?.avatarUrl ?? undefined,
    role: row.role,
    status: row.isActive ? 'active' : 'suspended',
    joinedAt: row.joinedAt,
    lastActive: '',
  };
}

type Member = {
  /** The member's user id on live rows - the membership routes key on it. */
  userId?: string;
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  lastActive: string;
  engagementScore?: number; // 0-100
  isOnline?: boolean;
  milestonesCompleted?: number;
  sessionsAttended?: number;
};

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-status-success-bg text-status-success border-status-success-border',
  pending:   'bg-status-warning-bg text-status-warning border-status-warning-border',
  suspended: 'bg-status-danger-bg text-status-danger border-status-danger-border',
};

function EngagementBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-2xs text-muted-foreground">
        <span>Engagement</span>
        <span className="tabular-nums">{score}%</span>
      </div>
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

const TENANT_ROLES = ['member', 'mentor', 'admin'] as const;

type MemberActions = {
  /** Absent on sample rows. */
  onRole?: (m: Member, role: string) => void;
  onRemove?: (m: Member) => void;
};

function MemberCard({ member, onRole, onRemove }: { member: Member } & MemberActions) {
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatarUrl} />
              <AvatarFallback>{member.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {member.isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{member.name}</span>
                  <Badge variant="outline" className={cn('text-2xs h-4 px-1.5', STATUS_COLORS[member.status])}>
                    {member.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="More options" variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="icon-sm" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* All three had no handler. PATCH and DELETE
                      /tenants/:id/members/:userId exist. */}
                  {member.userId ? (
                    <DropdownMenuItem asChild>
                      <Link href={`/messages?to=${member.userId}`}><Mail className="mr-2 icon-sm" aria-hidden="true" />Send Message</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled><Mail className="mr-2 icon-sm" aria-hidden="true" />Send Message</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <p className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Shield className="icon-sm" aria-hidden="true" />Change Role
                  </p>
                  {TENANT_ROLES.map((r) => (
                    <DropdownMenuItem
                      key={r}
                      className="pl-8 capitalize"
                      disabled={!onRole || member.role === r}
                      onSelect={() => onRole?.(member, r)}
                    >
                      {r}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive-accessible" disabled={!onRemove} onSelect={() => onRemove?.(member)}>
                    <UserX className="mr-2 icon-sm" aria-hidden="true" />Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" size="sm">{member.role}</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Clock className="icon-sm" aria-hidden="true" />Joined {member.joinedAt}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Activity className="icon-sm" aria-hidden="true" />Active {member.lastActive}
              </span>
              {member.milestonesCompleted != null && (
                <span className="text-2xs text-status-success flex items-center gap-0.5">
                  <CheckCircle2 className="icon-sm" />{member.milestonesCompleted} milestones
                </span>
              )}
            </div>
            {member.engagementScore != null && <EngagementBar score={member.engagementScore} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('founder');
  const [copied, setCopied] = useState(false);
  const inviteLink = 'https://app.cofounderbay.com/invite/tenant-abc-xyz';
  const handleCopy = () => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="icon-md text-primary-accessible" /> Invite Members
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email addresses</label>
            <Textarea
              placeholder="john@startup.com, jane@venture.com (one per line or comma-separated)"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Assign role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger aria-label="Assign role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="founder">Founder</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Or share invite link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xs truncate text-muted-foreground bg-background rounded px-2 py-1 border">{inviteLink}</code>
              <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={handleCopy}>
                {copied ? <CheckCircle2 className="icon-sm text-status-success" /> : <Copy className="icon-sm" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gap-1.5" disabled={!emails.trim()}>
            <Send className="icon-sm" /> Send Invites
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Shown to a tenant with no members loaded. */
const SEED_MEMBERS: Member[] = [
  { id: '1', name: 'John Doe',      email: 'john@example.com',  role: 'Founder',  status: 'active',    joinedAt: 'Jan 2025', lastActive: '2 hours ago',  engagementScore: 82, isOnline: true,  milestonesCompleted: 5, sessionsAttended: 8 },
  { id: '2', name: 'Jane Smith',    email: 'jane@example.com',  role: 'Mentor',   status: 'active',    joinedAt: 'Feb 2025', lastActive: '1 day ago',    engagementScore: 91, isOnline: true,  milestonesCompleted: 0, sessionsAttended: 14 },
  { id: '3', name: 'Mike Johnson',  email: 'mike@example.com',  role: 'Founder',  status: 'active',    joinedAt: 'Feb 2025', lastActive: '3 days ago',   engagementScore: 56, isOnline: false, milestonesCompleted: 3, sessionsAttended: 4 },
  { id: '4', name: 'Sarah Williams',email: 'sarah@example.com', role: 'Admin',    status: 'active',    joinedAt: 'Dec 2024', lastActive: '1 hour ago',   engagementScore: 95, isOnline: true,  milestonesCompleted: 0, sessionsAttended: 22 },
  { id: '5', name: 'Tom Brown',     email: 'tom@example.com',   role: 'Founder',  status: 'pending',   joinedAt: 'Mar 2025', lastActive: 'Never',        engagementScore: 12, isOnline: false, milestonesCompleted: 0, sessionsAttended: 0 },
  { id: '6', name: 'Lisa Martinez', email: 'lisa@example.com',  role: 'Investor', status: 'active',    joinedAt: 'Jan 2025', lastActive: '1 week ago',   engagementScore: 44, isOnline: false, milestonesCompleted: 0, sessionsAttended: 3 },
  { id: '7', name: 'Alex Chen',     email: 'alex@example.com',  role: 'Founder',  status: 'active',    joinedAt: 'Mar 2025', lastActive: '4 hours ago',  engagementScore: 73, isOnline: true,  milestonesCompleted: 2, sessionsAttended: 6 },
  { id: '8', name: 'Nina Patel',    email: 'nina@example.com',  role: 'Mentor',   status: 'suspended', joinedAt: 'Nov 2024', lastActive: '2 weeks ago',  engagementScore: 20, isOnline: false, milestonesCompleted: 0, sessionsAttended: 1 },
];

export default function TenantMembersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInvite, setShowInvite] = useState(false);

  /*
   * The tenant's real members. The seed below is what a tenant with none
   * loaded sees, so the screen still teaches its shape.
   */
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? null;
  const { data, isLoading } = useQuery({
    queryKey: qk('tenant', 'members', tenantId),
    queryFn: () => getTenantMembers(tenantId!, { limit: 100 }),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(
    () => (Array.isArray(data) ? data : []).map(toPageMember),
    [data],
  );
  const members: Member[] = live.length > 0 ? live : isLoading ? [] : SEED_MEMBERS;
  const queryClient = useQueryClient();
  const { success: toastOk, error: toastFail } = useToast();
  const confirm = useConfirm();
  const refreshMembers = () => void queryClient.invalidateQueries({ queryKey: qk('tenant', 'members', tenantId) });
  const memberActions: MemberActions = live.length > 0 && tenantId ? {
    onRole: async (m, role) => {
      if (!m.userId) return;
      try {
        await updateTenantMember(tenantId, m.userId, { role });
        toastOk('Role changed', `${m.name} is now ${role}.`);
      } catch (e) {
        toastFail('Could not change the role', e instanceof Error ? e.message : undefined);
      } finally { refreshMembers(); }
    },
    onRemove: async (m) => {
      if (!m.userId) return;
      const ok = await confirm({
        title: `Remove ${m.name}?`,
        description: 'They lose access to this workspace. Their account itself is not deleted.',
        confirmLabel: 'Remove member',
      });
      if (!ok) return;
      try {
        await removeTenantMember(tenantId, m.userId);
        toastOk('Member removed', m.name);
      } catch (e) {
        toastFail('Could not remove the member', e instanceof Error ? e.message : undefined);
      } finally { refreshMembers(); }
    },
  } : {};


  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roles = [...new Set(members.map((m) => m.role))];
  /*
   * Both stay null when nothing records them, which is the case for a real
   * tenant today: the membership row carries no presence and no engagement.
   * Zero and "not recorded" are different statements, and the tiles say which.
   * Averaged over the rows that carry a score, never over all of them.
   */
  const withPresence = members.filter((m) => m.isOnline !== undefined);
  const onlineCount = withPresence.length > 0
    ? withPresence.filter((m) => m.isOnline).length
    : null;

  const scored = members.filter((m) => m.engagementScore != null);
  const avgEngagement = scored.length > 0
    ? Math.round(scored.reduce((sum, m) => sum + (m.engagementScore ?? 0), 0) / scored.length)
    : null;

  const activeTab = roleFilter === 'all' ? 'all' : roleFilter;

  // Offered to the assistant: role and status filters, Invite, and the card
  // menu's role change and removal - the same actions, which refuse the
  // sample rows exactly as the disabled menu items do.
  const liveOnlyEn = memberActions.onRole ? undefined : 'These members are samples until the workspace roster loads.';
  const liveOnlyEl = memberActions.onRole ? undefined : 'Τα μέλη είναι δείγματα μέχρι να φορτώσει το μητρώο του χώρου.';
  const memberById = (id?: string) => members.find((m) => m.id === id);
  usePageList([
    {
      id: 'members',
      labelEn: 'Members',
      labelEl: 'Μέλη',
      rows: isLoading ? undefined : filteredMembers.map((m) => `${m.name} · ${m.email} · ${m.role} · ${m.status}`),
      total: members.length,
      sample: live.length === 0,
    },
  ]);
  usePageControls([
    choiceControl('role_filter', 'Role filter', 'Φίλτρο ρόλου', [{ value: 'all', en: 'All roles', el: 'Όλοι οι ρόλοι' }, ...roles.map((r) => ({ value: r, en: r, el: r }))], roleFilter, setRoleFilter),
    choiceControl('status_filter', 'Status filter', 'Φίλτρο κατάστασης', [
      { value: 'all', en: 'All statuses', el: 'Όλες οι καταστάσεις' },
      { value: 'active', en: 'Active', el: 'Ενεργά' },
      { value: 'pending', en: 'Pending', el: 'Σε αναμονή' },
      { value: 'suspended', en: 'Suspended', el: 'Σε αναστολή' },
    ], statusFilter, setStatusFilter),
    { id: 'invite_members', labelEn: 'Open the invite form', labelEl: 'Άνοιγμα φόρμας πρόσκλησης', writes: false, run: () => setShowInvite(true) },
    ...TENANT_ROLES.map((role) => ({
      id: `make_${role}`,
      labelEn: `Change member role to ${role}`,
      labelEl: `Αλλαγή ρόλου μέλους σε ${role}`,
      writes: true,
      options: rowOptions(filteredMembers.filter((m) => m.role !== role), (m) => m.id, (m) => m.name),
      unavailableEn: liveOnlyEn,
      unavailableEl: liveOnlyEl,
      run: (v?: string) => { const m = memberById(v); if (m) void memberActions.onRole?.(m, role); },
    })),
    {
      id: 'remove_member',
      labelEn: 'Remove member',
      labelEl: 'Αφαίρεση μέλους',
      writes: true,
      options: rowOptions(filteredMembers, (m) => m.id, (m) => m.name),
      unavailableEn: liveOnlyEn,
      unavailableEl: liveOnlyEl,
      run: (v) => { const m = memberById(v); if (m) void memberActions.onRemove?.(m); },
    },
  ]);

  return (
    <AppShell
      title="Members"
      description="Manage and track your organization's member engagement"
      actions={
        <Button onClick={() => setShowInvite(true)} className="gap-1.5">
          <Plus className="icon-sm" /> Invite Member
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Members', value: members.length, icon: Users, color: 'text-primary-accessible' },
            { label: 'Online Now', value: onlineCount ?? '—', icon: Activity, color: 'text-status-success' },
            { label: 'Avg Engagement', value: avgEngagement == null ? '—' : `${avgEngagement}%`, icon: TrendingUp, color: 'text-status-info' },
            { label: 'Pending Approval', value: members.filter((m) => m.status === 'pending').length, icon: Clock, color: 'text-status-warning' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary">
                  <Icon className={cn('icon-sm', color)} />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Status" className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setRoleFilter(v)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All ({members.length})</TabsTrigger>
            {roles.map((role) => (
              <TabsTrigger key={role} value={role}>
                {role} ({members.filter((m) => m.role === role).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
              </p>
              {filteredMembers.map((member) => (
                <MemberCard key={member.id} member={member} {...memberActions} />
              ))}
              {filteredMembers.length === 0 && (
                <EmptyTenantMembers
                  filtersActive={!!search || roleFilter !== 'all' || statusFilter !== 'all'}
                  onClearFilters={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

      </div>

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </AppShell>
  );
}

'use client';

import { StatusText } from '@/components/common/StatusText';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Settings,
  BarChart3,
  Shield,
  Mail,
  UserPlus,
  MoreVertical,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Building2,
  Crown,
  UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyLine, FailedLine } from '@/components/dashboard/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageRail } from '@/components/layout/PageRailContext';
import { isNotFound } from '@/lib/read-status';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import type { PageRailSection } from '@/components/layout/PageRail';
import { BilingualText } from '@/components/common/BilingualText';
import { useToast } from '@/components/ui/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  addOrganizationMember,
  getOrganizationBySlug,
  listOrganizationMembers,
  removeOrganizationMember,
  updateOrganizationMember,
  type OrgAdminMember,
} from '@/lib/api';
import { cn, initialsOf } from '@/lib/utils';
import { STATUS, TREND, type StatusTone } from '@/lib/semantic-colors';
import { qk } from '@/lib/query-keys';
import { CANCELLED, choiceControl, rowOptions, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';

type OrgMember = {
  id: string;
  /** The membership's user - needed by the invite/remove endpoints. */
  userId?: string;
  name: string;
  email: string;
  avatar?: string;
  /** owner, admin, program_manager, mentor, reviewer or member. */
  role: string;
  /** The model stores `isActive`; 'pending' exists for invitations only. */
  status: 'active' | 'pending' | 'suspended';
  joinedAt: Date;
  lastActive?: Date;
};

function toViewMember(m: OrgAdminMember): OrgMember {
  const profile = m.user?.profile;
  const name =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    m.user?.email ||
    'Member';
  return {
    id: m.id,
    userId: m.userId,
    name,
    email: m.user?.email ?? '',
    avatar: profile?.avatarUrl ?? undefined,
    role: m.role,
    status: m.isActive ? 'active' : 'suspended',
    joinedAt: new Date(m.joinedAt),
  };
}

/*
 * The invented organisation ("TechStars SF") and its five members stood in
 * for a member list that was loading or had failed, under a sample notice,
 * with a real accelerator's name and addresses (AGENTS: samples never name a
 * real company). A list that was not read says so now (docs §96).
 */

/** What each role may do, as `organization.service` checks it. */
const PERMISSIONS: Array<{ en: string; el: string; roles: Array<'owner' | 'admin' | 'others'> }> = [
  { en: 'See members, programmes and analytics', el: 'Προβολή μελών, προγραμμάτων και αναλυτικών', roles: ['owner', 'admin', 'others'] },
  { en: 'Add and remove members', el: 'Προσθήκη και αφαίρεση μελών', roles: ['owner', 'admin'] },
  { en: 'Change roles (except an owner\'s)', el: 'Αλλαγή ρόλων (εκτός του κατόχου)', roles: ['owner', 'admin'] },
  { en: 'Edit the organisation', el: 'Επεξεργασία οργανισμού', roles: ['owner', 'admin'] },
  { en: 'Run programmes and decide applications', el: 'Διαχείριση προγραμμάτων και αποφάσεις για αιτήσεις', roles: ['owner', 'admin'] },
  { en: 'Make or remove an owner', el: 'Ορισμός ή αφαίρεση κατόχου', roles: ['owner'] },
  { en: 'Delete the organisation', el: 'Διαγραφή οργανισμού', roles: ['owner'] },
];

const PERMISSION_ROLES: Array<{ id: 'owner' | 'admin' | 'others'; en: string; el: string; noteEn?: string; noteEl?: string }> = [
  { id: 'owner', en: 'Owner', el: 'Κάτοχος' },
  { id: 'admin', en: 'Admin', el: 'Διαχειριστής' },
  { id: 'others', en: 'Every other role', el: 'Κάθε άλλος ρόλος', noteEn: 'Program manager, mentor, reviewer, member', noteEl: 'Υπεύθυνος προγράμματος, μέντορας, αξιολογητής, μέλος' },
];

const ROLE_TONE: Record<string, StatusTone | 'neutral'> = {
  owner: 'warning',
  admin: 'info',
  member: 'neutral',
};

const MEMBER_STATUS_TONE: Record<string, StatusTone | 'neutral'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
};

function roleChip(role: string) {
  return STATUS[ROLE_TONE[role] ?? 'neutral'].chip;
}

function memberStatusChip(status: string) {
  return STATUS[MEMBER_STATUS_TONE[status] ?? 'neutral'].chip;
}

function StatCard({ title, titleEl, value, change, trend }: {
  title: string;
  titleEl: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent>
        <div>
          <p className="text-sm text-muted-foreground"><BilingualText en={title} el={titleEl} compact wrap /></p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <p className={cn(
              'text-xs mt-1',
              trend === 'up' && TREND.up,
              trend === 'down' && TREND.down,
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {change}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgAdminPage() {
  const sayOne = useBilingualString();
  const fmtDate = useDateFormat();
  const { openRailSection } = usePageRail();
  const params = useParams();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const qc = useQueryClient();
  const slug = params?.slug as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const orgQuery = useQuery({
    queryKey: qk('org', 'admin', slug),
    queryFn: () => getOrganizationBySlug(slug),
    retry: 0,
    staleTime: 60_000,
  });
  const orgId = orgQuery.data?.id;
  const membersQuery = useQuery({
    queryKey: qk('org', 'admin-members', orgId),
    enabled: !!orgId,
    queryFn: () => listOrganizationMembers(orgId as string),
    retry: 0,
    staleTime: 30_000,
  });

  /** A payload without a usable name is not a resolved organisation - demo
   *  stubs answer truthy shapes too, so validate the fields we render. */
  const orgData =
    orgQuery.data && typeof orgQuery.data.name === 'string' && orgQuery.data.name
      ? orgQuery.data
      : null;
  /** True once the real organisation and member list have answered; the
   *  mock rows below are illustrative and the write paths refuse them. */
  const isLive = !!orgData && !!membersQuery.data;
  const org = { name: orgData?.name ?? '', logo: orgData?.logo ?? orgData?.logoUrl ?? undefined };
  const members = isLive ? (membersQuery.data ?? []).map(toViewMember) : [];
  const membersFailed = membersQuery.isError && !membersQuery.data;
  const stats = {
    totalMembers: isLive ? members.length : '—',
    activeMembers: isLive ? members.filter((m) => m.status === 'active').length : '—',
    suspended: isLive ? members.filter((m) => m.status === 'suspended').length : '—',
    totalProjects: orgData?._count?.programs ?? '—',
  };

  // /org/members and /org/settings send "Add member" here with ?add=1.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('add') === '1') setInviteOpen(true);
  }, []);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: qk('org', 'admin-members', orgId) });
    void qc.invalidateQueries({ queryKey: qk('org', 'admin', slug) });
  };

  const filteredMembers = members.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const notLive = (): PageControlRunResult => {
    showError('Nothing to update', 'These rows are illustrative until the organisation loads.');
    return { error: 'These rows are illustrative until the organisation loads.' };
  };

  const handleRoleChange = async (memberId: string, newRole: string): Promise<PageControlRunResult> => {
    if (!isLive || !orgId) return notLive();
    try {
      await updateOrganizationMember(orgId, memberId, { role: newRole });
      success('Role updated', `Member role changed to ${newRole}`);
    } catch (err) {
      showError('Could not update the role', err instanceof Error ? err.message : undefined);
      return { error: err instanceof Error && err.message ? err.message : 'The role did not change.' };
    } finally {
      refresh();
    }
  };

  const handleSetActive = async (memberId: string, active: boolean): Promise<PageControlRunResult> => {
    if (!isLive || !orgId) return notLive();
    try {
      await updateOrganizationMember(orgId, memberId, { isActive: active });
      success(active ? 'Member reactivated' : 'Member suspended', active ? 'The member is active again' : 'The member has been suspended');
    } catch (err) {
      showError('Could not update the member', err instanceof Error ? err.message : undefined);
      return { error: err instanceof Error && err.message ? err.message : 'The member did not change.' };
    } finally {
      refresh();
    }
  };

  const confirm = useConfirm();
  const handleRemoveMember = async (memberId: string): Promise<PageControlRunResult> => {
    if (!isLive || !orgId) return notLive();
    // Removed on the first click before; membership is not restored by any
    // other control on this page, so it asks.
    const name = members.find((m) => m.id === memberId)?.name ?? 'this member';
    const ok = await confirm({
      title: <BilingualText en={`Remove ${name}?`} el={`Αφαίρεση: ${name};`} />,
      description: <BilingualText en="They lose access to this organisation. Their account itself is not deleted." el="Χάνει την πρόσβαση σε αυτόν τον οργανισμό. Ο λογαριασμός του μέλους δεν διαγράφεται." />,
      confirmLabel: <BilingualText en="Remove member" el="Αφαίρεση μέλους" compact />,
    });
    if (!ok) return CANCELLED;
    try {
      await removeOrganizationMember(orgId, memberId);
      success('Member removed', 'The member has been removed from the organization');
    } catch (err) {
      showError('Could not remove the member', err instanceof Error ? err.message : undefined);
      return { error: err instanceof Error && err.message ? err.message : 'The member was not removed.' };
    } finally {
      refresh();
    }
  };

  const handleInvite = async () => {
    const userId = inviteUserId.trim();
    if (!userId) return;
    if (!isLive || !orgId) return notLive();
    setInviting(true);
    try {
      await addOrganizationMember(orgId, { userId, role: inviteRole });
      success('Member added', 'The member now belongs to the organization');
      setInviteOpen(false);
      setInviteUserId('');
      setInviteRole('member');
    } catch (err) {
      showError('Could not add the member', err instanceof Error ? err.message : undefined);
    } finally {
      setInviting(false);
      refresh();
    }
  };

  /** The filtered member list, as a CSV - the header button had no handler. */
  const exportCsv = () => {
    if (!filteredMembers.length) return;
    const header = 'Name,Email,Role,Status,Joined\n';
    const body = filteredMembers
      .map((m) => [m.name, m.email, m.role, m.status, m.joinedAt.toISOString().slice(0, 10)].join(','))
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters =
    (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  // Offered to the assistant: the filters, Invite, Export, and the member
  // menu - make admin / member, suspend / reactivate, remove (which asks).
  // The same handlers, which refuse the illustrative rows.
  const liveEn = isLive ? undefined : 'These rows are illustrative until the organisation loads.';
  const liveEl = isLive ? undefined : 'Οι γραμμές είναι ενδεικτικές μέχρι να φορτώσει ο οργανισμός.';
  const byName = (list: typeof members) => rowOptions(list, (m) => m.id, (m) => m.name);
  usePageList([
    {
      id: 'members',
      labelEn: 'Organisation members',
      labelEl: 'Μέλη οργανισμού',
      rows: filteredMembers.map((m) => `${m.name} · ${m.email} · ${m.role} · ${m.status}`),
      total: members.length,
      sample: !isLive,
    },
  ]);
  usePageControls([
    choiceControl('role_filter', 'Role filter', 'Φίλτρο ρόλου', [
      { value: 'all', en: 'All roles', el: 'Όλοι οι ρόλοι' },
      { value: 'owner', en: 'Owner', el: 'Ιδιοκτήτης' },
      { value: 'admin', en: 'Admin', el: 'Διαχειριστής' },
      { value: 'program_manager', en: 'Program manager', el: 'Υπεύθυνος προγράμματος' },
      { value: 'mentor', en: 'Mentor', el: 'Μέντορας' },
      { value: 'reviewer', en: 'Reviewer', el: 'Αξιολογητής' },
      { value: 'member', en: 'Member', el: 'Μέλος' },
    ], roleFilter, setRoleFilter),
    choiceControl('status_filter', 'Status filter', 'Φίλτρο κατάστασης', [
      { value: 'all', en: 'All statuses', el: 'Όλες οι καταστάσεις' },
      { value: 'active', en: 'Active', el: 'Ενεργά' },
      { value: 'suspended', en: 'Suspended', el: 'Σε αναστολή' },
    ], statusFilter, setStatusFilter),
    { id: 'invite_member', labelEn: 'Open the add member form', labelEl: 'Άνοιγμα φόρμας προσθήκης μέλους', writes: false, run: () => setInviteOpen(true) },
    { id: 'export_members', labelEn: 'Export members as CSV', labelEl: 'Εξαγωγή μελών σε CSV', writes: false, unavailableEn: filteredMembers.length ? undefined : 'There is nothing to export.', unavailableEl: filteredMembers.length ? undefined : 'Δεν υπάρχει κάτι για εξαγωγή.', run: exportCsv },
    // organization.service updateMember writes only what it is sent (`role`
    // or `isActive`), so each of these is undone by the command that sets the
    // previous value back.
    { id: 'make_admin', labelEn: 'Make member an admin', labelEl: 'Ορισμός μέλους ως διαχειριστή', writes: true, options: byName(filteredMembers.filter((m) => m.role !== 'admin' && m.role !== 'owner')), unavailableEn: liveEn, unavailableEl: liveEl, undo: (v) => (members.find((m) => m.id === v)?.role === 'member' ? { control: 'make_member', value: v } : undefined), run: (v) => (v ? handleRoleChange(v, 'admin') : undefined) },
    { id: 'make_member', labelEn: 'Change role to member', labelEl: 'Αλλαγή ρόλου σε μέλος', writes: true, options: byName(filteredMembers.filter((m) => m.role !== 'member' && m.role !== 'owner')), unavailableEn: liveEn, unavailableEl: liveEl, undo: (v) => (members.find((m) => m.id === v)?.role === 'admin' ? { control: 'make_admin', value: v } : undefined), run: (v) => (v ? handleRoleChange(v, 'member') : undefined) },
    { id: 'suspend_member', labelEn: 'Suspend member', labelEl: 'Αναστολή μέλους', writes: true, options: byName(filteredMembers.filter((m) => m.status === 'active' && m.role !== 'owner')), unavailableEn: liveEn, unavailableEl: liveEl, undo: (v) => ({ control: 'reactivate_member', value: v }), run: (v) => (v ? handleSetActive(v, false) : undefined) },
    { id: 'reactivate_member', labelEn: 'Reactivate member', labelEl: 'Επανενεργοποίηση μέλους', writes: true, options: byName(filteredMembers.filter((m) => m.status !== 'active')), unavailableEn: liveEn, unavailableEl: liveEl, undo: (v) => (members.find((m) => m.id === v)?.status === 'suspended' ? { control: 'suspend_member', value: v } : undefined), run: (v) => (v ? handleSetActive(v, true) : undefined) },
    { id: 'remove_member', labelEn: 'Remove member', labelEl: 'Αφαίρεση μέλους', writes: true, options: byName(filteredMembers.filter((m) => m.role !== 'owner')), unavailableEn: liveEn, unavailableEl: liveEl, run: (v) => (v ? handleRemoveMember(v) : undefined) },
  ]);

  /*
   * The page rail: totals, member filters, and the tools row that used to
   * sit inside the members tab. The column keeps the tabs and the table.
   */
  const rail: PageRailSection[] = [
    {
      id: 'totals',
      glyph: 'chart',
      labelEn: 'Organisation totals',
      labelEl: 'Σύνολα οργανισμού',
      badge: typeof stats.suspended === 'number' && stats.suspended > 0 ? stats.suspended : null,
      content: (
        <div className="space-y-2">
          <StatCard title="Total Members" titleEl="Σύνολο μελών" value={stats.totalMembers} icon={Users} />
          <StatCard title="Active Members" titleEl="Ενεργά μέλη" value={stats.activeMembers} icon={CheckCircle2} />
          <StatCard title="Suspended" titleEl="Σε αναστολή" value={stats.suspended} icon={XCircle} />
          <StatCard title="Programs" titleEl="Προγράμματα" value={stats.totalProjects} icon={Building2} />
        </div>
      ),
    },
    {
      id: 'filters',
      glyph: 'target',
      labelEn: 'Member filters',
      labelEl: 'Φίλτρα μελών',
      badge: activeFilters || null,
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BilingualText en="Role" el="Ρόλος" compact /></p>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger aria-label={bilingualAria('Role', 'Ρόλος')} className="mt-2">
                <SelectValue placeholder={sayOne("All roles", "Όλοι οι ρόλοι")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><BilingualText en="All roles" el="Όλοι οι ρόλοι" compact /></SelectItem>
                <SelectItem value="owner"><BilingualText en="Owner" el="Κάτοχος" compact /></SelectItem>
                <SelectItem value="admin"><BilingualText en="Admin" el="Διαχειριστής" compact /></SelectItem>
                <SelectItem value="program_manager"><BilingualText en="Program manager" el="Υπεύθυνος προγράμματος" compact /></SelectItem>
                <SelectItem value="mentor"><BilingualText en="Mentor" el="Μέντορας" compact /></SelectItem>
                <SelectItem value="reviewer"><BilingualText en="Reviewer" el="Αξιολογητής" compact /></SelectItem>
                <SelectItem value="member"><BilingualText en="Member" el="Μέλος" compact /></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BilingualText en="Status" el="Κατάσταση" compact /></p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label={bilingualAria('Status', 'Κατάσταση')} className="mt-2">
                <SelectValue placeholder={sayOne("All statuses", "Όλες οι καταστάσεις")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><BilingualText en="All statuses" el="Όλες οι καταστάσεις" compact /></SelectItem>
                <SelectItem value="active"><BilingualText en="Active" el="Ενεργό" compact /></SelectItem>
                <SelectItem value="suspended"><BilingualText en="Suspended" el="Σε αναστολή" compact /></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      id: 'tools',
      glyph: 'sliders',
      labelEn: 'Member tools',
      labelEl: 'Εργαλεία μελών',
      content: (
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="tap-target flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted/70"
          >
            <UserPlus className="icon-sm shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1"><BilingualText en="Add member" el="Προσθήκη μέλους" compact wrap /></span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!filteredMembers.length}
            className="tap-target flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="icon-sm shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1"><BilingualText en="Export members (CSV)" el="Εξαγωγή μελών (CSV)" compact wrap /></span>
          </button>
        </div>
      ),
    },
  ];

  if (orgQuery.isPending) {
    return (
      <AppShell showHelp>
        <div role="status" className="py-16 text-center text-muted-foreground">
          <BilingualText en="Loading organization…" el="Φόρτωση οργανισμού…" compact />
        </div>
      </AppShell>
    );
  }

  if (!orgData) {
    // "Not found" only when the server says so (docs §91-§92); any other
    // failure can be tried again.
    const failedRead = orgQuery.isError && !isNotFound(orgQuery.error);
    return (
      <AppShell showHelp title="Organization admin" titleEl="Διαχείριση οργανισμού">
        {failedRead ? (
          <Card>
            <CardContent className="space-y-4">
              <FailedLine
                en="This organisation could not be read just now."
                el="Ο οργανισμός δεν διαβάστηκε αυτή τη στιγμή."
                busy={orgQuery.isFetching}
                onRetry={() => void orgQuery.refetch()}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-xl font-semibold">
              <BilingualText en="Organization not found" el="Ο οργανισμός δεν βρέθηκε" compact />
            </h1>
            <Button variant="outline" asChild>
              <Link href="/org/dashboard"><BilingualText en="Back to organization dashboard" el="Πίσω στον πίνακα οργανισμού" compact /></Link>
            </Button>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell showHelp rail={rail}>
      <div className="min-w-0 max-w-full space-y-6">
        {/* Header */}
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <Button aria-label={bilingualAria('Go back', 'Επιστροφή')} variant="ghost" size="icon" onClick={() => router.push(`/org/${slug}`)}>
            <ArrowLeft className="icon-md" aria-hidden="true" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar className="h-12 w-12 rounded-xl">
              <AvatarImage src={org.logo} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible text-lg">
                {initialsOf(org.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="break-words text-2xl sm:text-3xl font-semibold text-foreground">{org.name}</h1>
              <p className="text-sm text-muted-foreground"><BilingualText en="Organization Admin Dashboard" el="Πίνακας διαχείρισης οργανισμού" compact wrap /></p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/org/settings">
              <Settings className="icon-sm mr-2" aria-hidden="true" />
              <BilingualText en="Settings" el="Ρυθμίσεις" compact />
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="min-w-0 max-w-full space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="icon-sm" aria-hidden="true" />
              <BilingualText en="Members" el="Μέλη" compact />
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <Mail className="icon-sm" aria-hidden="true" />
              <BilingualText en="Invites" el="Προσκλήσεις" compact />
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="icon-sm" aria-hidden="true" />
              <BilingualText en="Analytics" el="Αναλυτικά" compact />
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="icon-sm" aria-hidden="true" />
              <BilingualText en="Permissions" el="Δικαιώματα" compact />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {/* Search stays with the table; the role/status filters and the
                invite/export tools moved to the page rail. */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder={sayOne("Search members…", "Αναζήτηση μελών…")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label={bilingualAria('Search members', 'Αναζήτηση μελών')}
              />
            </div>

            {/* Members Table */}
            <Card className="min-w-0 max-w-full overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><BilingualText en="Member" el="Μέλος" compact /></TableHead>
                    <TableHead><BilingualText en="Role" el="Ρόλος" compact /></TableHead>
                    <TableHead><BilingualText en="Status" el="Κατάσταση" compact /></TableHead>
                    <TableHead><BilingualText en="Joined" el="Εγγράφηκε" compact /></TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary-accessible text-sm">
                              {initialsOf(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize border', roleChip(member.role))}>
                          {member.role === 'owner' && <Crown className="icon-sm mr-1" />}
                          <StatusText value={member.role} />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize border', memberStatusChip(member.status))}>
                          <StatusText value={member.status} />
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDate(member.joinedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label={bilingualAria(`More options for ${member.name}`, `Περισσότερες επιλογές: ${member.name}`)} variant="ghost" size="icon">
                              <MoreVertical className="icon-sm" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => void handleRoleChange(member.id, 'admin')}>
                              <Shield className="icon-sm mr-2" aria-hidden="true" />
                              <BilingualText en="Make Admin" el="Ορισμός ως διαχειριστή" compact />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleRoleChange(member.id, 'member')}>
                              <Users className="icon-sm mr-2" aria-hidden="true" />
                              <BilingualText en="Make Member" el="Ορισμός ως μέλους" compact />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {member.status === 'active' ? (
                              <DropdownMenuItem onClick={() => void handleSetActive(member.id, false)}>
                                <XCircle className="icon-sm mr-2" aria-hidden="true" />
                                <BilingualText en="Suspend" el="Αναστολή" compact />
                              </DropdownMenuItem>
                            ) : member.status === 'suspended' ? (
                              <DropdownMenuItem onClick={() => void handleSetActive(member.id, true)}>
                                <CheckCircle2 className="icon-sm mr-2" aria-hidden="true" />
                                <BilingualText en="Reactivate" el="Επανενεργοποίηση" compact />
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              onClick={() => void handleRemoveMember(member.id)}
                              className="text-destructive-accessible"
                            >
                              <UserMinus className="icon-sm mr-2" aria-hidden="true" />
                              <BilingualText en="Remove" el="Αφαίρεση" compact />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {membersFailed && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <FailedLine
                          en="The members could not be read just now."
                          el="Τα μέλη δεν διαβάστηκαν αυτή τη στιγμή."
                          busy={membersQuery.isFetching}
                          onRetry={() => void membersQuery.refetch()}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLive && !membersFailed && [0, 1, 2].map((i) => (
                    <TableRow key={`loading-${i}`}>
                      <TableCell colSpan={5}><Skeleton className="h-9" /></TableCell>
                    </TableRow>
                  ))}
                  {isLive && filteredMembers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        <BilingualText en="No members match the current filters." el="Κανένα μέλος δεν ταιριάζει με τα φίλτρα." wrap />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="invites">
            <Card>
              <CardHeader>
                <CardTitle><BilingualText en="Pending Invitations" el="Εκκρεμείς προσκλήσεις" compact /></CardTitle>
              </CardHeader>
              {/* An empty line on the card's axis, not a centred block whose
                  sentence (on the body step) was as loud as the card's title. */}
              {/* Nothing waits as an invitation: members are added directly by
                  user id. The tab's own "Invite Members" opened the same form
                  as the rail's tool, so it points there instead (docs §96). */}
              <CardContent className="space-y-3">
                <EmptyLine
                  en="No invitation waits here: members are added directly, by their user ID."
                  el="Καμία πρόσκληση δεν περιμένει εδώ: τα μέλη προστίθενται απευθείας, με το αναγνωριστικό χρήστη τους."
                />
                <Button size="sm" variant="outline" onClick={() => openRailSection('tools')}>
                  <BilingualText en="Open member tools" el="Άνοιγμα εργαλείων μελών" compact />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {/* Two cards said "No growth data recorded yet" and "No activity
                data recorded yet" for every organisation: nothing records
                either. The organisation's counted figures live on Org
                analytics, and this tab says where (docs §96). */}
            <Card>
              <CardHeader>
                <CardTitle><BilingualText en="Member Growth" el="Αύξηση μελών" compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyLine
                  en="Member growth and activity are not recorded yet. Programmes, applications, sessions and members are counted on Org analytics."
                  el="Η αύξηση και η δραστηριότητα μελών δεν καταγράφονται ακόμη. Προγράμματα, αιτήσεις, συνεδρίες και μέλη μετρώνται στα Αναλυτικά οργανισμού."
                  action={{ href: '/org/analytics', en: 'Open Org analytics', el: 'Άνοιγμα αναλυτικών οργανισμού' }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle><BilingualText en="Role Permissions" el="Δικαιώματα ρόλων" compact /></CardTitle>
                <CardDescription><BilingualText en="What each role can do" el="Τι μπορεί να κάνει κάθε ρόλος" compact wrap /></CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* What the API allows, not an illustration (docs §96): owners
                    and admins pass checkAdminAccess (members, roles, the
                    organisation, programmes); only an owner deletes the
                    organisation or changes an owner; every other role -
                    programme manager, mentor, reviewer, member - reads. The
                    old grid gave members "Manage projects" and denied it to
                    admins. */}
                {PERMISSION_ROLES.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn('border', roleChip(group.id))}>
                        {group.id === 'owner' && <Crown className="icon-sm mr-1" aria-hidden="true" />}
                        <BilingualText en={group.en} el={group.el} compact />
                      </Badge>
                      {group.noteEn ? <span className="text-xs text-muted-foreground"><BilingualText en={group.noteEn} el={group.noteEl ?? group.noteEn} compact wrap /></span> : null}
                    </div>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-sm">
                      {PERMISSIONS.map((perm) => {
                        const allowed = perm.roles.includes(group.id);
                        return (
                          <li key={perm.en} className="flex items-center gap-2">
                            {allowed ? (
                              <CheckCircle2 className={cn('icon-sm', STATUS.success.icon)} aria-hidden="true" />
                            ) : (
                              <XCircle className="icon-sm text-muted-foreground" aria-hidden="true" />
                            )}
                            <span className={cn('min-w-0', allowed ? 'text-foreground' : 'text-muted-foreground')}>
                              <span className="sr-only">{allowed ? bilingualAria('Allowed:', 'Επιτρέπεται:') : bilingualAria('Not allowed:', 'Δεν επιτρέπεται:')} </span>
                              <BilingualText en={perm.en} el={perm.el} compact wrap />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite member: the endpoint adds by user id - there is no
          invite-by-email flow for organisations yet. */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><BilingualText en="Add member" el="Προσθήκη μέλους" compact /></DialogTitle>
            {/* Said, not hidden: nothing is emailed, the person is added. */}
            <DialogDescription><BilingualText en="Add an existing user to the organisation by their user ID. Nothing is emailed; they are added at once." el="Προσθέστε υπάρχοντα χρήστη στον οργανισμό με το αναγνωριστικό του. Δεν στέλνεται email· προστίθεται αμέσως." wrap /></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="invite-user-id" className="block text-sm font-semibold uppercase tracking-wide text-muted-foreground"><BilingualText en="User ID" el="Αναγνωριστικό χρήστη" compact /></label>
              <Input
                id="invite-user-id"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                placeholder={sayOne("The member's user ID", "Το αναγνωριστικό χρήστη του μέλους")}
                className="mt-2"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="block text-sm font-semibold uppercase tracking-wide text-muted-foreground"><BilingualText en="Role" el="Ρόλος" compact /></label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role" aria-label={bilingualAria('Role', 'Ρόλος')} className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member"><BilingualText en="Member" el="Μέλος" compact /></SelectItem>
                  <SelectItem value="admin"><BilingualText en="Admin" el="Διαχειριστής" compact /></SelectItem>
                  <SelectItem value="program_manager"><BilingualText en="Program manager" el="Υπεύθυνος προγράμματος" compact /></SelectItem>
                  <SelectItem value="mentor"><BilingualText en="Mentor" el="Μέντορας" compact /></SelectItem>
                  <SelectItem value="reviewer"><BilingualText en="Reviewer" el="Αξιολογητής" compact /></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!inviteUserId.trim() || inviting} onClick={() => void handleInvite()}>
              {inviting ? <BilingualText en="Adding…" el="Προσθήκη…" compact /> : <BilingualText en="Add member" el="Προσθήκη μέλους" compact />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

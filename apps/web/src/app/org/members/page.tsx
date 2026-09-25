'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  ShieldCheck,
  Crown,
  Edit,
  Trash2,
  UserMinus,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { getOrgMembers, type OrgMember as OrgMemberRow } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyOrgMembers } from '@/components/common/EmptyStates';
import { cn, initialsOf } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { UnavailableButton } from '@/components/common/UnavailableButton';
import { qk } from '@/lib/query-keys';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';

type MemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'mentor' | 'viewer';

type OrgMember = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: MemberRole;
  department?: string;
  joinedAt: string;
  lastActive: string;
  status: 'active' | 'invited' | 'inactive';
};

const ROLE_CONFIG: Record<MemberRole, { label: string; icon: React.ElementType; tone: StatusTone }> = {
  owner: { label: 'Owner', icon: Crown, tone: 'warning' },
  admin: { label: 'Admin', icon: ShieldCheck, tone: 'accent' },
  manager: { label: 'Manager', icon: Shield, tone: 'info' },
  member: { label: 'Member', icon: Users, tone: 'neutral' },
  mentor: { label: 'Mentor', icon: Users, tone: 'success' },
  viewer: { label: 'Viewer', icon: Users, tone: 'neutral' },
};

const ROLE_VALUES = ['owner', 'admin', 'manager', 'member', 'mentor', 'viewer'] as const;

/**
 * The page's own row from the API row.
 *
 * `/api/org/:slug/members` has existed all along; this page never called it.
 * Two columns have no source and say so rather than being filled: the
 * directory endpoint returns a public profile, so it carries no email address
 * and no last-seen — showing either would mean inventing it, and an email
 * address in particular is not a field to guess at.
 */
function toPageMember(row: OrgMemberRow): OrgMember {
  const role = (ROLE_VALUES as readonly string[]).includes(row.role)
    ? (row.role as MemberRole)
    : 'member';
  return {
    id: row.id,
    name: row.displayName,
    email: '',
    avatarUrl: row.avatarUrl ?? undefined,
    role,
    department: row.cohortName || undefined,
    joinedAt: row.joinedAt,
    lastActive: '',
    status: 'active',
  };
}

/** Shown to an organisation with no members loaded yet. */
const MOCK_MEMBERS: OrgMember[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@accelerate.io', role: 'owner', department: 'Leadership', joinedAt: 'Jan 2024', lastActive: 'Today', status: 'active' },
  { id: '2', name: 'Michael Torres', email: 'michael@accelerate.io', role: 'admin', department: 'Programs', joinedAt: 'Feb 2024', lastActive: 'Yesterday', status: 'active' },
  { id: '3', name: 'Priya Patel', email: 'priya@accelerate.io', role: 'manager', department: 'Cohort Management', joinedAt: 'Mar 2024', lastActive: '2 days ago', status: 'active' },
  { id: '4', name: 'James Wilson', email: 'james@accelerate.io', role: 'mentor', department: 'Mentorship Pool', joinedAt: 'Feb 2024', lastActive: '1 week ago', status: 'active' },
  { id: '5', name: 'Anna Fischer', email: 'anna@accelerate.io', role: 'member', department: 'Operations', joinedAt: 'Apr 2024', lastActive: 'Today', status: 'active' },
  { id: '6', name: 'New Recruit', email: 'recruit@startup.com', role: 'viewer', department: undefined, joinedAt: '—', lastActive: '—', status: 'invited' },
];

/** `live` rows carry user ids; `adminHref` is where memberships are managed. */
function MemberRow({ member, live, adminHref }: { member: OrgMember; live: boolean; adminHref: string | null }) {
  const roleCfg = ROLE_CONFIG[member.role];
  const RoleIcon = roleCfg.icon;

  return (
    <div className="flex items-center gap-4 py-3 px-1 border-b border-border last:border-0 hover:bg-muted/30 rounded-lg transition-colors">
      <Avatar className="icon-md shrink-0">
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback className="text-sm font-medium">{initialsOf(member.name).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{member.name}</p>
          {member.status === 'invited' && (
            <Badge variant="outline" className={cn('text-xs border', STATUS.warning.chip)}>Invited</Badge>
          )}
        </div>
        {member.email ? (
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        ) : null}
        <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
          {roleCfg.label}{member.department ? ` · ${member.department}` : ''}
          {member.lastActive ? ` · ${member.lastActive}` : ''}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-1 w-28 shrink-0">
        <RoleIcon className={cn('icon-sm', roleCfg.tone === 'neutral' && member.role === 'viewer' ? 'text-muted-foreground' : STATUS[roleCfg.tone].icon)} />
        <span className="text-xs font-medium">{roleCfg.label}</span>
      </div>
      <div className="hidden lg:block w-32 shrink-0">
        <p className="text-xs text-muted-foreground">{member.department ?? '—'}</p>
      </div>
      <div className="hidden sm:flex items-center gap-1 w-24 shrink-0">
        <Clock className="icon-sm text-muted-foreground" aria-hidden="true" />
        {member.lastActive ? (
          <span className="text-xs text-muted-foreground">{member.lastActive}</span>
        ) : null}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More options" variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="icon-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* None had a handler. Roles and removal are managed on the
              organisation's admin page, which writes membership rows; this
              directory lists cohort members by user id. */}
          {adminHref ? (
            <DropdownMenuItem asChild>
              <Link href={adminHref}><Edit className="mr-2 icon-sm" aria-hidden="true" />Edit Role</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled><Edit className="mr-2 icon-sm" aria-hidden="true" />Edit Role</DropdownMenuItem>
          )}
          {live ? (
            <DropdownMenuItem asChild>
              <Link href={`/messages?to=${member.id}`}><Mail className="mr-2 icon-sm" aria-hidden="true" />Send Message</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled><Mail className="mr-2 icon-sm" aria-hidden="true" />Send Message</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {adminHref ? (
            <DropdownMenuItem asChild className="text-destructive-accessible">
              <Link href={adminHref}><UserMinus className="mr-2 icon-sm" aria-hidden="true" />Remove Member</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="text-destructive-accessible">
              <UserMinus className="mr-2 icon-sm" aria-hidden="true" />Remove Member
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function OrgMembersPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { slug } = useCurrentOrg();
  const { data, isLoading } = useQuery({
    queryKey: qk('org', 'members', slug),
    queryFn: () => getOrgMembers(slug!, { limit: 100 }),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.members ?? []).map(toPageMember), [data]);
  const members = live.length > 0 ? live : isLoading ? [] : MOCK_MEMBERS;

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = !search || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.department?.toLowerCase().includes(q) ?? false);
    const matchesTab = activeTab === 'all' || (activeTab === 'active' && m.status === 'active') || (activeTab === 'invited' && m.status === 'invited');
    return matchesSearch && matchesTab;
  });

  const roleCounts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtersActive = !!search || activeTab !== 'all';
  const clearFilters = () => { setSearch(''); setActiveTab('all'); };

  usePageList([
    {
      id: 'members',
      labelEn: 'Team members',
      labelEl: 'Μέλη ομάδας',
      rows: isLoading ? undefined : filtered.map((m) => `${m.name} · ${m.email} · ${m.role}${m.department ? ` · ${m.department}` : ''} · ${m.status}`),
      total: members.length,
      sample: live.length === 0,
    },
  ]);
  usePageControls([
    choiceControl('member_tab', 'Member filter', 'Φίλτρο μελών', [
      { value: 'all', en: 'All', el: 'Όλα' },
      { value: 'active', en: 'Active', el: 'Ενεργά' },
      { value: 'invited', en: 'Invited', el: 'Προσκεκλημένα' },
    ], activeTab, setActiveTab),
    {
      id: 'clear_filters',
      labelEn: 'Clear the member filters',
      labelEl: 'Καθαρισμός φίλτρων μελών',
      writes: false,
      unavailableEn: filtersActive ? undefined : 'No filter is set.',
      unavailableEl: filtersActive ? undefined : 'Δεν υπάρχει φίλτρο.',
      run: clearFilters,
    },
  ]);

  return (
    <AppShell
      title="Team Members"
      description="Invite and manage who can run programs, review applications, and access workspace settings."
      actions={(
        // Had no handler; invitations are sent from the organisation admin page.
        slug ? (
          <Button asChild>
            <Link href={`/org/${slug}/admin`}>
              <UserPlus className="mr-2 icon-sm" aria-hidden="true" />
              Invite Member
            </Link>
          </Button>
        ) : (
          <UnavailableButton
            size="md"
            en="Invite member"
            el="Πρόσκληση μέλους"
            reasonEn="Invitations are sent on behalf of an organisation; join or create one first."
            reasonEl="Οι προσκλήσεις στέλνονται εκ μέρους οργανισμού· γίνετε μέλος ή δημιουργήστε έναν πρώτα."
          />
        )
      )}
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-4">
          {[
            { label: 'Total Members', value: data?.total ?? members.length },
            { label: 'Admins', value: (roleCounts['owner'] ?? 0) + (roleCounts['admin'] ?? 0) },
            { label: 'Mentors', value: roleCounts['mentor'] ?? 0 },
            { label: 'Pending Invites', value: MOCK_MEMBERS.filter(m => m.status === 'invited').length },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {/* Counted over the members on screen - these read the sample
                list, so a real organisation's tabs said 8 / 6 / 2 whatever
                it held. */}
            <TabsTrigger value="all">All ({members.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({members.filter(m => m.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="invited">Invited ({members.filter(m => m.status === 'invited').length})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="hidden md:flex items-center gap-4 px-1 text-xs text-muted-foreground font-medium">
                  <div className="w-9 shrink-0" />
                  <div className="flex-1">Name / Email</div>
                  <div className="w-28 shrink-0">Role</div>
                  <div className="hidden lg:block w-32 shrink-0">Department</div>
                  <div className="hidden sm:block w-24 shrink-0">Last Active</div>
                  <div className="w-7 shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {filtered.map(member => (
                  <MemberRow key={member.id} member={member} live={live.length > 0} adminHref={slug ? `/org/${slug}/admin` : null} />
                ))}
                {filtered.length === 0 && (
                  <EmptyOrgMembers filtersActive={filtersActive} onClearFilters={clearFilters} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

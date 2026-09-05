'use client';

import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

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

const MOCK_MEMBERS: OrgMember[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@accelerate.io', role: 'owner', department: 'Leadership', joinedAt: 'Jan 2024', lastActive: 'Today', status: 'active' },
  { id: '2', name: 'Michael Torres', email: 'michael@accelerate.io', role: 'admin', department: 'Programs', joinedAt: 'Feb 2024', lastActive: 'Yesterday', status: 'active' },
  { id: '3', name: 'Priya Patel', email: 'priya@accelerate.io', role: 'manager', department: 'Cohort Management', joinedAt: 'Mar 2024', lastActive: '2 days ago', status: 'active' },
  { id: '4', name: 'James Wilson', email: 'james@accelerate.io', role: 'mentor', department: 'Mentorship Pool', joinedAt: 'Feb 2024', lastActive: '1 week ago', status: 'active' },
  { id: '5', name: 'Anna Fischer', email: 'anna@accelerate.io', role: 'member', department: 'Operations', joinedAt: 'Apr 2024', lastActive: 'Today', status: 'active' },
  { id: '6', name: 'New Recruit', email: 'recruit@startup.com', role: 'viewer', department: undefined, joinedAt: '—', lastActive: '—', status: 'invited' },
];

function MemberRow({ member }: { member: OrgMember }) {
  const roleCfg = ROLE_CONFIG[member.role];
  const RoleIcon = roleCfg.icon;

  return (
    <div className="flex items-center gap-4 py-3 px-1 border-b border-border last:border-0 hover:bg-muted/30 rounded-lg transition-colors">
      <Avatar className="icon-md shrink-0">
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback className="text-sm font-medium">{member.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{member.name}</p>
          {member.status === 'invited' && (
            <Badge variant="outline" className={cn('text-xs border', STATUS.warning.chip)}>Invited</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
          {roleCfg.label}{member.department ? ` · ${member.department}` : ''} · {member.lastActive}
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
        <Clock className="icon-sm text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{member.lastActive}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="icon-sm" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem><Edit className="mr-2 icon-sm" />Edit Role</DropdownMenuItem>
          <DropdownMenuItem><Mail className="mr-2 icon-sm" />Send Message</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive-accessible">
            <UserMinus className="mr-2 icon-sm" />Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function OrgMembersPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filtered = MOCK_MEMBERS.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = !search || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.department?.toLowerCase().includes(q) ?? false);
    const matchesTab = activeTab === 'all' || (activeTab === 'active' && m.status === 'active') || (activeTab === 'invited' && m.status === 'invited');
    return matchesSearch && matchesTab;
  });

  const roleCounts = MOCK_MEMBERS.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtersActive = !!search || activeTab !== 'all';
  const clearFilters = () => { setSearch(''); setActiveTab('all'); };

  return (
    <AppShell
      title="Team Members"
      description="Invite and manage who can run programs, review applications, and access workspace settings."
      actions={(
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Members', value: MOCK_MEMBERS.length },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({MOCK_MEMBERS.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({MOCK_MEMBERS.filter(m => m.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="invited">Invited ({MOCK_MEMBERS.filter(m => m.status === 'invited').length})</TabsTrigger>
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
                  <MemberRow key={member.id} member={member} />
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

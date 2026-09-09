'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, Settings, BarChart3, Shield, Mail,
  UserPlus, MoreVertical, Search, Filter, Download,
  CheckCircle2, XCircle, Clock, TrendingUp, Calendar,
  Building2, Globe, Edit, Trash2, Crown, UserMinus,
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
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type OrgMember = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: Date;
  lastActive?: Date;
};

type OrgStats = {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  totalProjects: number;
  totalConnections: number;
  monthlyGrowth: number;
};

const MOCK_ORG = {
  id: 'org1',
  name: 'TechStars SF',
  slug: 'techstars-sf',
  logo: undefined,
  description: 'San Francisco\'s premier startup accelerator community',
  website: 'https://techstars.com',
  memberCount: 156,
  createdAt: new Date('2023-01-15'),
};

const MOCK_STATS: OrgStats = {
  totalMembers: 156,
  activeMembers: 142,
  pendingInvites: 8,
  totalProjects: 34,
  totalConnections: 892,
  monthlyGrowth: 12.5,
};

const MOCK_MEMBERS: OrgMember[] = [
  {
    id: 'm1',
    name: 'Sarah Chen',
    email: 'sarah@techstars.com',
    avatar: undefined,
    role: 'owner',
    status: 'active',
    joinedAt: new Date('2023-01-15'),
    lastActive: new Date(),
  },
  {
    id: 'm2',
    name: 'Mike Ross',
    email: 'mike@techstars.com',
    avatar: undefined,
    role: 'admin',
    status: 'active',
    joinedAt: new Date('2023-02-20'),
    lastActive: new Date(Date.now() - 3600000),
  },
  {
    id: 'm3',
    name: 'Lisa Park',
    email: 'lisa@example.com',
    avatar: undefined,
    role: 'member',
    status: 'active',
    joinedAt: new Date('2023-06-10'),
    lastActive: new Date(Date.now() - 86400000),
  },
  {
    id: 'm4',
    name: 'James Wilson',
    email: 'james@example.com',
    avatar: undefined,
    role: 'member',
    status: 'pending',
    joinedAt: new Date('2024-03-01'),
  },
  {
    id: 'm5',
    name: 'Emma Davis',
    email: 'emma@example.com',
    avatar: undefined,
    role: 'member',
    status: 'suspended',
    joinedAt: new Date('2023-08-15'),
    lastActive: new Date('2024-01-10'),
  },
];

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  admin: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  member: 'bg-muted text-muted-foreground border-border',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  suspended: 'bg-destructive/10 text-destructive-emphasis border-destructive/30',
};

function StatCard({ title, value, change, icon: Icon, trend }: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {change && (
              <p className={cn(
                'text-xs mt-1',
                trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                trend === 'down' && 'text-destructive-emphasis',
                trend === 'neutral' && 'text-muted-foreground'
              )}>
                {change}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="icon-lg text-primary-emphasis" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgAdminPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const slug = params?.slug as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const org = MOCK_ORG;
  const stats = MOCK_STATS;

  const filteredMembers = MOCK_MEMBERS.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const handleRoleChange = (memberId: string, newRole: string) => {
    success('Role updated', `Member role changed to ${newRole}`);
  };

  const handleRemoveMember = (memberId: string) => {
    success('Member removed', 'The member has been removed from the organization');
  };

  const handleSuspendMember = (memberId: string) => {
    success('Member suspended', 'The member has been suspended');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button aria-label="Go back" variant="ghost" size="icon" onClick={() => router.push(`/org/${slug}`)}>
            <ArrowLeft className="icon-md" aria-hidden="true" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={org.logo} />
              <AvatarFallback className="bg-primary/10 text-primary-emphasis text-lg">
                {org.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
              <p className="text-muted-foreground">Organization Admin Dashboard</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/org/${slug}/settings`}>
              <Settings className="icon-sm mr-2" aria-hidden="true" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            change={`+${stats.monthlyGrowth}% this month`}
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Active Members"
            value={stats.activeMembers}
            change={`${Math.round((stats.activeMembers / stats.totalMembers) * 100)}% active`}
            icon={CheckCircle2}
            trend="neutral"
          />
          <StatCard
            title="Pending Invites"
            value={stats.pendingInvites}
            icon={Mail}
          />
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            change="+5 this month"
            icon={Building2}
            trend="up"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="icon-sm" aria-hidden="true" />
              Members
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <Mail className="icon-sm" aria-hidden="true" />
              Invites
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="icon-sm" aria-hidden="true" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="icon-sm" aria-hidden="true" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <UserPlus className="icon-sm mr-2" aria-hidden="true" />
                Invite Member
              </Button>
              <Button variant="outline">
                <Download className="icon-sm mr-2" aria-hidden="true" />
                Export
              </Button>
            </div>

            {/* Members Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
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
                            <AvatarFallback className="bg-primary/10 text-primary-emphasis text-sm">
                              {member.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', ROLE_COLORS[member.role])}>
                          {member.role === 'owner' && <Crown className="icon-sm mr-1" aria-hidden="true" />}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', STATUS_COLORS[member.status])}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.joinedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.lastActive
                          ? member.lastActive.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label="More options" variant="ghost" size="icon">
                              <MoreVertical className="icon-sm" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                              <Shield className="icon-sm mr-2" aria-hidden="true" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                              <Users className="icon-sm mr-2" aria-hidden="true" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {member.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handleSuspendMember(member.id)}>
                                <XCircle className="icon-sm mr-2" aria-hidden="true" />
                                Suspend
                              </DropdownMenuItem>
                            ) : member.status === 'suspended' ? (
                              <DropdownMenuItem>
                                <CheckCircle2 className="icon-sm mr-2" aria-hidden="true" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive-emphasis"
                            >
                              <UserMinus className="icon-sm mr-2" aria-hidden="true" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="invites">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Invitations</CardTitle>
                <CardDescription>Manage pending member invitations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>No pending invitations</p>
                  <Button className="mt-4">
                    <UserPlus className="icon-sm mr-2" aria-hidden="true" />
                    Invite Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Member Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 opacity-50" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 opacity-50" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Role Permissions</CardTitle>
                <CardDescription>Configure what each role can do</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {['owner', 'admin', 'member'].map((role) => (
                  <div key={role} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('capitalize', ROLE_COLORS[role])}>
                        {role === 'owner' && <Crown className="icon-2xs mr-1" aria-hidden="true" />}
                        {role}
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                      {[
                        'Invite members',
                        'Remove members',
                        'Manage roles',
                        'Edit organization',
                        'View analytics',
                        'Manage projects',
                      ].map((perm, i) => (
                        <div key={perm} className="flex items-center gap-2">
                          {(role === 'owner' || (role === 'admin' && i < 5) || (role === 'member' && i > 3)) ? (
                            <CheckCircle2 className="icon-sm text-emerald-500" aria-hidden="true" />
                          ) : (
                            <XCircle className="icon-sm text-muted-foreground" aria-hidden="true" />
                          )}
                          <span className="text-muted-foreground">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

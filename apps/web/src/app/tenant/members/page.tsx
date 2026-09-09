'use client';

import { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Member = {
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
  active:    'bg-green-500/10 text-green-600 border-green-500/20',
  pending:   'bg-amber-500/10 text-amber-600 border-amber-500/20',
  suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
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

function MemberCard({ member }: { member: Member }) {
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
                  <DropdownMenuItem><Mail className="mr-2 icon-sm" aria-hidden="true" />Send Message</DropdownMenuItem>
                  <DropdownMenuItem><Shield className="mr-2 icon-sm" aria-hidden="true" />Change Role</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive"><UserX className="mr-2 icon-sm" aria-hidden="true" />Remove Member</DropdownMenuItem>
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
                <span className="text-2xs text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="icon-sm" aria-hidden="true" />{member.milestonesCompleted} milestones
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
            <Send className="icon-md text-primary" aria-hidden="true" /> Invite Members
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
                {copied ? <CheckCircle2 className="icon-sm text-green-500" aria-hidden="true" /> : <Copy className="icon-sm" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gap-1.5" disabled={!emails.trim()}>
            <Send className="icon-sm" aria-hidden="true" /> Send Invites
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TenantMembersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInvite, setShowInvite] = useState(false);

  const members: Member[] = [
    { id: '1', name: 'John Doe',      email: 'john@example.com',  role: 'Founder',  status: 'active',    joinedAt: 'Jan 2025', lastActive: '2 hours ago',  engagementScore: 82, isOnline: true,  milestonesCompleted: 5, sessionsAttended: 8 },
    { id: '2', name: 'Jane Smith',    email: 'jane@example.com',  role: 'Mentor',   status: 'active',    joinedAt: 'Feb 2025', lastActive: '1 day ago',    engagementScore: 91, isOnline: true,  milestonesCompleted: 0, sessionsAttended: 14 },
    { id: '3', name: 'Mike Johnson',  email: 'mike@example.com',  role: 'Founder',  status: 'active',    joinedAt: 'Feb 2025', lastActive: '3 days ago',   engagementScore: 56, isOnline: false, milestonesCompleted: 3, sessionsAttended: 4 },
    { id: '4', name: 'Sarah Williams',email: 'sarah@example.com', role: 'Admin',    status: 'active',    joinedAt: 'Dec 2024', lastActive: '1 hour ago',   engagementScore: 95, isOnline: true,  milestonesCompleted: 0, sessionsAttended: 22 },
    { id: '5', name: 'Tom Brown',     email: 'tom@example.com',   role: 'Founder',  status: 'pending',   joinedAt: 'Mar 2025', lastActive: 'Never',        engagementScore: 12, isOnline: false, milestonesCompleted: 0, sessionsAttended: 0 },
    { id: '6', name: 'Lisa Martinez', email: 'lisa@example.com',  role: 'Investor', status: 'active',    joinedAt: 'Jan 2025', lastActive: '1 week ago',   engagementScore: 44, isOnline: false, milestonesCompleted: 0, sessionsAttended: 3 },
    { id: '7', name: 'Alex Chen',     email: 'alex@example.com',  role: 'Founder',  status: 'active',    joinedAt: 'Mar 2025', lastActive: '4 hours ago',  engagementScore: 73, isOnline: true,  milestonesCompleted: 2, sessionsAttended: 6 },
    { id: '8', name: 'Nina Patel',    email: 'nina@example.com',  role: 'Mentor',   status: 'suspended', joinedAt: 'Nov 2024', lastActive: '2 weeks ago',  engagementScore: 20, isOnline: false, milestonesCompleted: 0, sessionsAttended: 1 },
  ];

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
  const onlineCount = members.filter((m) => m.isOnline).length;
  const avgEngagement = Math.round(members.filter((m) => m.engagementScore != null).reduce((s, m) => s + (m.engagementScore ?? 0), 0) / members.length);

  const activeTab = roleFilter === 'all' ? 'all' : roleFilter;

  return (
    <AppShell
      title="Members"
      description="Manage and track your organization's member engagement"
      actions={
        <Button onClick={() => setShowInvite(true)} className="gap-1.5">
          <Plus className="icon-sm" aria-hidden="true" /> Invite Member
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Members', value: members.length, icon: Users, color: 'text-primary' },
            { label: 'Online Now', value: onlineCount, icon: Activity, color: 'text-green-600' },
            { label: 'Avg Engagement', value: `${avgEngagement}%`, icon: TrendingUp, color: 'text-blue-600' },
            { label: 'Pending Approval', value: members.filter((m) => m.status === 'pending').length, icon: Clock, color: 'text-amber-600' },
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
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
                <MemberCard key={member.id} member={member} />
              ))}
              {filteredMembers.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                    <h3 className="font-medium">No members found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

      </div>

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </AppShell>
  );
}

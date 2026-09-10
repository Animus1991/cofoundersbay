'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Settings,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Lock,
  Globe,
  Shield,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ManagedGroup = {
  id: string;
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private' | 'secret';
  memberCount: number;
  postCount: number;
  role: 'owner' | 'admin' | 'moderator';
  isActive: boolean;
  lastActivity: string;
  pendingRequests?: number;
};

const PRIVACY_CONFIG = {
  public: { label: 'Public', icon: Globe, color: 'text-green-500' },
  private: { label: 'Private', icon: Lock, color: 'text-amber-500' },
  secret: { label: 'Secret', icon: Shield, color: 'text-red-500' },
};

const MOCK_GROUPS: ManagedGroup[] = [
  { id: '1', name: 'AI Founders Network', description: 'Community for founders building AI-powered startups', category: 'AI/ML', privacy: 'public', memberCount: 1247, postCount: 342, role: 'owner', isActive: true, lastActivity: '2 hours ago', pendingRequests: 5 },
  { id: '2', name: 'SaaS Growth Hackers', description: 'Strategies for scaling SaaS businesses', category: 'SaaS', privacy: 'private', memberCount: 456, postCount: 189, role: 'admin', isActive: true, lastActivity: '1 day ago', pendingRequests: 12 },
  { id: '3', name: 'Early Stage Investors', description: 'Angels and pre-seed investors connecting with founders', category: 'Investing', privacy: 'private', memberCount: 87, postCount: 45, role: 'moderator', isActive: true, lastActivity: '3 hours ago' },
  { id: '4', name: 'CleanTech Builders', description: 'Founders working on climate and sustainability', category: 'CleanTech', privacy: 'public', memberCount: 234, postCount: 78, role: 'admin', isActive: false, lastActivity: '1 week ago' },
];

function GroupCard({ group }: { group: ManagedGroup }) {
  const privacyCfg = PRIVACY_CONFIG[group.privacy];
  const PrivacyIcon = privacyCfg.icon;

  return (
    <Card className={cn('transition-all hover:shadow-md hover:border-primary/20', !group.isActive && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 rounded-xl shrink-0">
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary-emphasis font-bold">
                {group.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/groups/${group.id}`} className="font-semibold hover:text-primary-emphasis transition-colors">
                  {group.name}
                </Link>
                <Badge variant="secondary" className="text-xs">{group.category}</Badge>
                <Badge variant="outline" className={cn('text-xs gap-1', privacyCfg.color)}>
                  <PrivacyIcon className="h-3 w-3" />
                  {privacyCfg.label}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">{group.role}</Badge>
                {!group.isActive && <Badge variant="secondary" className="text-xs text-muted-foreground">Archived</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{group.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="icon-2xs" aria-hidden="true" />{group.memberCount.toLocaleString()} members</span>
                <span className="flex items-center gap-1"><MessageSquare className="icon-2xs" aria-hidden="true" />{group.postCount} posts</span>
                <span className="flex items-center gap-1"><TrendingUp className="icon-2xs" aria-hidden="true" />Active {group.lastActivity}</span>
                {group.pendingRequests && group.pendingRequests > 0 && (
                  <Badge variant="destructive" className="text-xs">{group.pendingRequests} pending</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/groups/${group.id}`}>
                <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />View
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="icon-sm" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Edit className="mr-2 icon-sm" aria-hidden="true" />Edit Group</DropdownMenuItem>
                <DropdownMenuItem><UserPlus className="mr-2 icon-sm" aria-hidden="true" />Invite Members</DropdownMenuItem>
                <DropdownMenuItem><Settings className="mr-2 icon-sm" aria-hidden="true" />Group Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive-emphasis"><Trash2 className="mr-2 icon-sm" aria-hidden="true" />Delete Group</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ManageGroupsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_GROUPS.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = MOCK_GROUPS.reduce((s, g) => s + g.memberCount, 0);
  const pendingTotal = MOCK_GROUPS.reduce((s, g) => s + (g.pendingRequests ?? 0), 0);

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="icon-lg text-primary-emphasis" aria-hidden="true" />
              Manage Communities
            </h1>
            <p className="text-muted-foreground">Groups you own or administer</p>
          </div>
          <Button asChild>
            <Link href="/groups">
              <Plus className="mr-2 icon-sm" aria-hidden="true" />
              Create Group
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'Groups Managed', value: MOCK_GROUPS.length },
            { label: 'Total Members', value: totalMembers.toLocaleString() },
            { label: 'Pending Requests', value: pendingTotal },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
          <Input placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Groups */}
        <div className="space-y-3">
          {filtered.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" aria-hidden="true" />
                <p className="font-medium">No groups found</p>
                <p className="text-sm text-muted-foreground mt-1">Create a community to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

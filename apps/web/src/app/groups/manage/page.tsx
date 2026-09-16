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
import { ListEmptyState, NoFilterResults } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';

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
  public: { label: 'Public', icon: Globe, iconClass: STATUS.success.icon },
  private: { label: 'Private', icon: Lock, iconClass: STATUS.warning.icon },
  secret: { label: 'Secret', icon: Shield, iconClass: STATUS.danger.icon },
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
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary-accessible font-bold">
                {group.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/groups/${group.id}`} className="font-semibold hover:text-primary-accessible transition-colors">
                  {group.name}
                </Link>
                <Badge variant="secondary" className="text-xs">{group.category}</Badge>
                <Badge variant="outline" className={cn('text-xs gap-1', privacyCfg.iconClass)}>
                  <PrivacyIcon className="icon-sm" />
                  {privacyCfg.label}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">{group.role}</Badge>
                {!group.isActive && <Badge variant="secondary" className="text-xs text-muted-foreground">Archived</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{group.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="icon-sm" />{group.memberCount.toLocaleString('en-GB')} members</span>
                <span className="flex items-center gap-1"><MessageSquare className="icon-sm" />{group.postCount} posts</span>
                <span className="flex items-center gap-1"><TrendingUp className="icon-sm" />Active {group.lastActivity}</span>
                {group.pendingRequests && group.pendingRequests > 0 && (
                  <Badge variant="destructive" className="text-xs">{group.pendingRequests} pending</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/groups/${group.id}`}>
                <Eye className="mr-1.5 icon-sm" />View
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${group.name}`}>
                  <MoreVertical className="icon-sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Edit className="mr-2 icon-sm" />Edit Group</DropdownMenuItem>
                <DropdownMenuItem><UserPlus className="mr-2 icon-sm" />Invite Members</DropdownMenuItem>
                <DropdownMenuItem><Settings className="mr-2 icon-sm" />Group Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive-accessible"><Trash2 className="mr-2 icon-sm" />Delete Group</DropdownMenuItem>
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
    <AppShell
      title="Manage communities"
      description="Communities you own or administer — review members, pending requests, and activity at a glance."
      actions={(
        <Button asChild>
          <Link href="/groups">
            <Plus className="mr-2 icon-sm" />
            Create community
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'Groups Managed', value: MOCK_GROUPS.length },
            { label: 'Total Members', value: totalMembers.toLocaleString('en-GB') },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Groups */}
        <div className="space-y-3">
          {filtered.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
          {filtered.length === 0 && (
            search ? (
              <NoFilterResults entity="communities" onClear={() => setSearch('')} />
            ) : (
              <ListEmptyState
                icon={Users}
                tone="primary"
                title="You don't manage any communities yet"
                description="Create a community to bring people together. As owner you control privacy, membership, and moderation."
                action={(
                  <Button asChild className="gap-2">
                    <Link href="/groups">
                      <Plus className="icon-sm" />
                      Create community
                    </Link>
                  </Button>
                )}
              />
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}

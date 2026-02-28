'use client';

import { useState } from 'react';
import { Search, Users, Plus, TrendingUp, Lock, Globe, CheckCircle2, UserPlus, MessageCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  memberCount: number;
  postCount: number;
  coverImage?: string;
  isJoined: boolean;
  isTrending?: boolean;
  tags: string[];
}

const CATEGORIES = ['All', 'Founders', 'Tech', 'Marketing', 'Design', 'Finance', 'Product'];

const DEMO_GROUPS: Group[] = [
  {
    id: '1',
    name: 'SaaS Founders Hub',
    description: 'Community for SaaS founders to share insights, challenges, and wins. Weekly AMAs with successful founders.',
    category: 'Founders',
    privacy: 'public',
    memberCount: 1247,
    postCount: 3421,
    isJoined: true,
    isTrending: true,
    tags: ['SaaS', 'B2B', 'Growth'],
  },
  {
    id: '2',
    name: 'AI Startup Builders',
    description: 'Building AI-powered products? Join us to discuss ML models, LLMs, and AI product strategies.',
    category: 'Tech',
    privacy: 'public',
    memberCount: 892,
    postCount: 2156,
    isJoined: false,
    isTrending: true,
    tags: ['AI', 'ML', 'LLM'],
  },
  {
    id: '3',
    name: 'Growth Marketing Masters',
    description: 'Advanced growth marketing tactics, case studies, and experiments. For experienced marketers only.',
    category: 'Marketing',
    privacy: 'private',
    memberCount: 567,
    postCount: 1834,
    isJoined: false,
    tags: ['Growth', 'SEO', 'Paid Ads'],
  },
  {
    id: '4',
    name: 'Product Design Excellence',
    description: 'UI/UX designers sharing work, getting feedback, and discussing design systems and best practices.',
    category: 'Design',
    privacy: 'public',
    memberCount: 734,
    postCount: 2891,
    isJoined: true,
    tags: ['UI/UX', 'Figma', 'Design Systems'],
  },
  {
    id: '5',
    name: 'Fundraising & VC Network',
    description: 'Connect with investors, learn pitch strategies, and share fundraising experiences.',
    category: 'Finance',
    privacy: 'private',
    memberCount: 423,
    postCount: 987,
    isJoined: false,
    tags: ['VC', 'Fundraising', 'Pitch'],
  },
  {
    id: '6',
    name: 'Product Management Pro',
    description: 'Product managers discussing roadmaps, prioritization, user research, and PM best practices.',
    category: 'Product',
    privacy: 'public',
    memberCount: 645,
    postCount: 1567,
    isJoined: false,
    tags: ['PM', 'Roadmap', 'User Research'],
  },
];

function GroupCard({ group, onJoin }: { group: Group; onJoin: (id: string) => void }) {
  return (
    <Card className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-base font-semibold text-foreground truncate">
                  {group.name}
                </h3>
                {group.isTrending && (
                  <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {group.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {group.privacy === 'private' ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  <span className="capitalize">{group.privacy}</span>
                </div>
              </div>
            </div>
          </div>
          {group.isJoined && (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {group.description}
        </p>

        {group.tags && group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {group.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{group.memberCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{group.postCount.toLocaleString()}</span>
            </div>
          </div>
          <Button
            variant={group.isJoined ? 'outline' : 'default'}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => onJoin(group.id)}
          >
            {group.isJoined ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Joined
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3" />
                Join
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState(DEMO_GROUPS);

  const handleJoinGroup = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, isJoined: !g.isJoined, memberCount: g.isJoined ? g.memberCount - 1 : g.memberCount + 1 } : g
      )
    );
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      success(
        group.isJoined ? 'Left group' : 'Joined group',
        group.isJoined ? `You left ${group.name}` : `You joined ${group.name}`
      );
    }
  };

  const filteredGroups = groups.filter((group) => {
    const matchesTab = activeTab === 'my-groups' ? group.isJoined : true;
    const matchesCategory = selectedCategory === 'All' || group.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesCategory && matchesSearch;
  });

  const trendingGroups = filteredGroups.filter((g) => g.isTrending && activeTab === 'discover');
  const regularGroups = filteredGroups.filter((g) => !g.isTrending || activeTab === 'my-groups');

  return (
    <AppShell
      title="Groups"
      description="Join communities, share knowledge, and connect with like-minded founders"
      actions={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      }
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search groups, topics, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                    selectedCategory === category
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Trending Groups */}
          {trendingGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Trending Groups
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {trendingGroups.map((group) => (
                  <GroupCard key={group.id} group={group} onJoin={handleJoinGroup} />
                ))}
              </div>
            </div>
          )}

          {/* All Groups */}
          {regularGroups.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {activeTab === 'my-groups' ? 'Your Groups' : 'All Groups'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regularGroups.map((group) => (
                  <GroupCard key={group.id} group={group} onJoin={handleJoinGroup} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 mb-4 text-muted-foreground/30" />
              <p className="font-medium text-foreground">
                {activeTab === 'my-groups' ? 'No groups joined yet' : 'No groups found'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'my-groups'
                  ? 'Discover and join groups to connect with your community'
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

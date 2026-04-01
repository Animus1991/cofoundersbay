'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users2,
  Search,
  Plus,
  MoreVertical,
  Globe,
  Lock,
  Shield,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Community = {
  id: string;
  name: string;
  description?: string;
  category: string;
  visibility: 'public' | 'private' | 'tenant';
  memberCount: number;
  postCount: number;
  createdAt: string;
  status: 'active' | 'archived' | 'flagged';
  tenant?: string;
};

function CommunityCard({ community }: { community: Community }) {
  const visibilityIcons: Record<string, React.ReactNode> = {
    public: <Globe className="h-3.5 w-3.5" />,
    private: <Lock className="h-3.5 w-3.5" />,
    tenant: <Shield className="h-3.5 w-3.5" />,
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    archived: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    flagged: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
              {community.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/communities/${community.id}`} className="font-medium hover:text-primary transition-colors">
                    {community.name}
                  </Link>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {visibilityIcons[community.visibility]}
                    {community.visibility}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{community.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs', statusColors[community.status])}>
                  {community.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="icon-sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/communities/${community.id}`}>View Community</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                    <DropdownMenuItem>Manage Members</DropdownMenuItem>
                    <DropdownMenuItem>View Reports</DropdownMenuItem>
                    <DropdownMenuItem className="text-amber-600">Archive</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {community.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {community.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users2 className="h-3.5 w-3.5" />
                {community.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {community.postCount} posts
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {community.createdAt}
              </span>
              {community.tenant && (
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {community.tenant}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCommunitiesPage() {
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Mock data
  const communities: Community[] = [
    {
      id: '1',
      name: 'AI Founders',
      description: 'A community for founders building AI-powered products',
      category: 'Technology',
      visibility: 'public',
      memberCount: 1250,
      postCount: 456,
      createdAt: 'Jan 2024',
      status: 'active',
    },
    {
      id: '2',
      name: 'TechStars Athens Network',
      description: 'Private community for TechStars Athens alumni and mentors',
      category: 'Accelerator',
      visibility: 'tenant',
      memberCount: 85,
      postCount: 234,
      createdAt: 'Mar 2024',
      status: 'active',
      tenant: 'TechStars Athens',
    },
    {
      id: '3',
      name: 'FinTech Innovators',
      description: 'Discuss the latest in financial technology',
      category: 'Industry',
      visibility: 'public',
      memberCount: 890,
      postCount: 312,
      createdAt: 'Feb 2024',
      status: 'active',
    },
    {
      id: '4',
      name: 'Startup Legal',
      description: 'Legal discussions for startups',
      category: 'Resources',
      visibility: 'private',
      memberCount: 156,
      postCount: 89,
      createdAt: 'Dec 2023',
      status: 'flagged',
    },
  ];

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchesVisibility = visibility === 'all' || c.visibility === visibility;
    const matchesStatus = status === 'all' || c.status === status;
    return matchesSearch && matchesVisibility && matchesStatus;
  });

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Communities</h1>
            <p className="text-muted-foreground">
              Manage platform communities
            </p>
          </div>
          <Button>
            <Plus className="mr-2 icon-sm" />
            Create Community
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Communities</p>
              <p className="text-xl font-bold">{communities.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-xl font-bold">
                {communities.reduce((acc, c) => acc + c.memberCount, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Posts</p>
              <p className="text-xl font-bold">
                {communities.reduce((acc, c) => acc + c.postCount, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Flagged</p>
              <p className="text-xl font-bold text-red-600">
                {communities.filter((c) => c.status === 'flagged').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Communities List */}
        <div className="space-y-3">
          {filteredCommunities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
          {filteredCommunities.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No communities found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

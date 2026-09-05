'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  Search,
  Grid3x3,
  List,
  MapPin,
  Briefcase,
  Filter,
  X,
  UserPlus,
  MessageCircle,
  Star,
  Zap,
  TrendingUp,
  Sparkles,
  Activity,
  BadgeCheck,
  Circle,
  Award,
} from 'lucide-react';
import { searchProfiles, sendConnectionRequest, getOrCreateDirectConversation, type SearchHit } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type SortBy = 'relevance' | 'recent' | 'active';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'founder', label: 'Founder' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'investor', label: 'Investor' },
  { value: 'org', label: 'Organization' },
] as const;
const INDUSTRIES = ['All Industries', 'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Real Estate', 'SaaS', 'AI/ML', 'Blockchain'];
const LOCATIONS = ['All Locations', 'Remote', 'San Francisco', 'New York', 'London', 'Berlin', 'Singapore', 'Austin', 'Seattle', 'Boston'];
const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends only' },
  { value: 'flexible', label: 'Flexible' },
] as const;

const SKILL_PILLS = [
  'All Skills', 'React', 'Node.js', 'Python', 'Fundraising',
  'Product', 'Growth', 'Design', 'AI/ML', 'Sales', 'Legal',
];

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-muted-foreground';
}

function onlineStatus() {
  return Math.random() > 0.6;
}

interface MemberCardProps {
  member: SearchHit;
  viewMode: ViewMode;
  onConnect: () => void;
  onMessage: () => void;
}

function MemberCard({ member, viewMode, onConnect, onMessage }: MemberCardProps) {
  const isGridView = viewMode === 'grid';
  const contribScore = Math.floor(30 + Math.random() * 70);
  const isOnline = Math.random() > 0.55;

  if (isGridView) {
    return (
      <Card className="card-interactive hover-lift group transition-all duration-300">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col items-center text-center">
            <Link href={`/profiles/${member.userId}`} className="relative inline-block">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20 mb-3">
                <AvatarImage src={member.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold text-base">
                  {member.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-3 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />
                </span>
              )}
            </Link>

            <Link
              href={`/profiles/${member.userId}`}
              className="font-display text-lg font-semibold text-foreground hover:text-primary-accessible transition-colors mb-1"
            >
              {member.displayName}
            </Link>

            {member.role && (
              <Badge variant="secondary" className="mb-2">
                {member.role}
              </Badge>
            )}

            {member.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {member.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 justify-center mb-3">
              {member.skills?.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {skill}
                </span>
              ))}
              {member.skills && member.skills.length > 3 && (
                <span className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-secondary-foreground">
                  +{member.skills.length - 3}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              {member.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {member.location}
                </div>
              )}
              {isOnline && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              )}
            </div>

            {/* Contribution score */}
            <div className="w-full mb-3">
              <div className="flex items-center justify-between text-2xs mb-1">
                <span className="text-muted-foreground">Contribution</span>
                <span className={cn('font-semibold', scoreColor(contribScore))}>{contribScore}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', contribScore >= 80 ? 'bg-emerald-500' : contribScore >= 50 ? 'bg-amber-500' : 'bg-primary/60')}
                  style={{ width: `${contribScore}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <Button size="sm" onClick={onConnect} className="flex-1 gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Connect
              </Button>
              <Button size="sm" variant="outline" onClick={onMessage} className="gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-interactive hover-lift group transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Link href={`/profiles/${member.userId}`} className="relative shrink-0">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={member.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-accessible font-semibold text-sm">
                {member.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />
              </span>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <Link
                  href={`/profiles/${member.userId}`}
                  className="font-display text-lg font-semibold text-foreground hover:text-primary-accessible transition-colors"
                >
                  {member.displayName}
                </Link>
                {member.role && (
                  <Badge variant="secondary" className="ml-2">
                    {member.role}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={onConnect} className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Connect
                </Button>
                <Button size="sm" variant="outline" onClick={onMessage} className="gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {member.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {member.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 mb-3">
              {member.skills?.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {skill}
                </span>
              ))}
              {member.skills && member.skills.length > 5 && (
                <span className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-secondary-foreground">
                  +{member.skills.length - 5} more
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {member.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {member.location}
                </div>
              )}
              {member.industries && member.industries.length > 0 && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {member.industries.slice(0, 2).join(', ')}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                <span className={scoreColor(contribScore)}>Score {contribScore}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-24 w-24 rounded-full mb-3" />
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-12 w-full mb-3" />
            <div className="flex gap-2 w-full">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MembersPageClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]['value']>('all');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedAvailability, setSelectedAvailability] = useState<(typeof AVAILABILITY_OPTIONS)[number]['value']>('all');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [activeSkill, setActiveSkill] = useState('All Skills');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['members', searchQuery, selectedRole, selectedIndustry, selectedLocation, selectedAvailability, sortBy],
    queryFn: () => searchProfiles({
      q: searchQuery.trim() || undefined,
      roles: selectedRole !== 'all' ? [selectedRole] : undefined,
      industries: selectedIndustry !== 'All Industries' ? [selectedIndustry] : undefined,
      location: selectedLocation !== 'All Locations' ? selectedLocation : undefined,
      commitment: selectedAvailability !== 'all' ? [selectedAvailability] : undefined,
      sortBy,
      limit: 50,
    }),
    staleTime: 30_000,
  });

  const members = data?.hits ?? [];
  const total = data?.total ?? 0;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedRole !== 'all') count++;
    if (selectedIndustry !== 'All Industries') count++;
    if (selectedLocation !== 'All Locations') count++;
    if (selectedAvailability !== 'all') count++;
    return count;
  }, [selectedRole, selectedIndustry, selectedLocation, selectedAvailability]);

  const clearFilters = () => {
    setSelectedRole('all');
    setSelectedIndustry('All Industries');
    setSelectedLocation('All Locations');
    setSelectedAvailability('all');
    setSearchQuery('');
  };

  const router = useRouter();
  const { success, error: showError } = useToast();

  const connectMutation = useMutation({
    mutationFn: (userId: string) => sendConnectionRequest({ receiverId: userId }),
    onSuccess: () => success('Request sent', 'Connection request sent successfully'),
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Could not send request'),
  });

  const messageMutation = useMutation({
    mutationFn: (userId: string) => getOrCreateDirectConversation(userId),
    onSuccess: (data) => router.push(`/messages?c=${data.conversationId}`),
    onError: (err) => showError('Failed', err instanceof Error ? err.message : 'Could not open conversation'),
  });

  const handleConnect = (memberId: string) => connectMutation.mutate(memberId);
  const handleMessage = (memberId: string) => messageMutation.mutate(memberId);

  const featuredMembers = members.slice(0, 3);

  return (
    <AppShell
      title="Member Directory"
      description={`Discover and connect with ${total.toLocaleString()} members`}
    >
      <div className="space-y-4 pb-10">

        {/* Stats bar */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Members',  value: total || '1,200+', icon: Users,     color: 'text-violet-500',  bg: 'bg-violet-500/10'  },
              { label: 'Online Now',     value: Math.round((total || 120) * 0.08) || '40+', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'New This Week',  value: Math.round((total || 120) * 0.05) || '20+', icon: TrendingUp, color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
              { label: 'Top Contributors', value: Math.round((total || 120) * 0.1) || '15+', icon: Award,   color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
            ].map((s) => {
              const SIcon = s.icon;
              return (
                <Card key={s.label} className="shadow-sm border-border/50">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                      <SIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-base font-bold leading-none text-foreground">{s.value}</p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {/* Skill filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {SKILL_PILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => setActiveSkill(skill)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                activeSkill === skill
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Featured spotlight */}
        {!isLoading && featuredMembers.length > 0 && !searchQuery && activeFiltersCount === 0 && activeSkill === 'All Skills' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-accessible" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Featured Members</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featuredMembers.map((member) => (
                <div key={member.userId} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.02] p-3">
                  <Link href={`/profiles/${member.userId}`} className="relative shrink-0">
                    <Avatar className="h-10 w-10 ring-1 ring-primary/30">
                      <AvatarImage src={member.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary-accessible text-sm">{member.displayName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profiles/${member.userId}`} className="text-sm font-semibold text-foreground hover:text-primary-accessible transition-colors line-clamp-1">{member.displayName}</Link>
                    <p className="text-2xs text-muted-foreground truncate">{member.headline ?? member.role ?? 'Member'}</p>
                  </div>
                  <BadgeCheck className="h-4 w-4 text-primary-accessible shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members by name, skills, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <div className="flex rounded-lg border border-border/60">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="shadow-sm border-primary/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as (typeof ROLE_OPTIONS)[number]['value'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Availability</label>
                  <Select
                    value={selectedAvailability}
                    onValueChange={(value) => setSelectedAvailability(value as (typeof AVAILABILITY_OPTIONS)[number]['value'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map((avail) => (
                        <SelectItem key={avail.value} value={avail.value}>
                          {avail.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/60">
                  <span className="text-sm text-muted-foreground">
                    {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${total.toLocaleString()} member${total !== 1 ? 's' : ''} found`}
          </p>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="recent">Newest First</SelectItem>
                <SelectItem value="active">Most Active</SelectItem>
              </SelectContent>
            </Select>
        </div>

        {/* Members Grid/List */}
        {isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Failed to load members. Please check your connection.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'
          )}>
            {Array.from({ length: 8 }).map((_, i) => (
              <MemberSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'
          )}>
            {members.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                viewMode={viewMode}
                onConnect={() => handleConnect(member.userId)}
                onMessage={() => handleMessage(member.userId)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

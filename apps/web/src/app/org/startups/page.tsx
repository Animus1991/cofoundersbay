'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  Users,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { getOrgMembers, type OrgMember } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
import { EmptyOrgStartups } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

/**
 * The page's own row from the organisation's member list.
 *
 * There is no startup entity in the schema: an accelerator's cohort is made of
 * people, and `/api/org/:slug/members` is the list of them with the cohort
 * each belongs to. Four fields on the card have no source and admit it rather
 * than being filled — progress, team size, founding date and readiness are all
 * facts about a company the platform does not model yet.
 */
function toStartup(member: OrgMember): Startup {
  return {
    id: member.id,
    name: member.displayName,
    logoUrl: member.avatarUrl ?? undefined,
    industry: member.headline ?? '\u2014',
    stage: '\u2014',
    program: member.cohortName || '\u2014',
    cohort: member.cohortName || '\u2014',
    progress: 0,
    teamSize: 0,
    foundedAt: member.joinedAt,
    status: 'active',
    readinessScore: 0,
  };
}

type Startup = {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  stage: string;
  program: string;
  cohort: string;
  progress: number;
  teamSize: number;
  foundedAt: string;
  status: 'active' | 'graduated' | 'paused' | 'dropped';
  readinessScore: number;
};

const STARTUP_STATUS_TONE: Record<Startup['status'], StatusTone> = {
  active: 'success',
  graduated: 'info',
  paused: 'warning',
  dropped: 'danger',
};

function StartupCard({ startup }: { startup: Startup }) {
  const statusColors = STATUS[STARTUP_STATUS_TONE[startup.status]];

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage src={startup.logoUrl} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary-accessible font-semibold">
              {startup.name?.[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/org/startups/${startup.id}`} className="font-medium hover:text-primary-accessible transition-colors">
                  {startup.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {startup.industry} · {startup.stage}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                  {startup.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Open actions for ${startup.name}`}>
                      <MoreVertical className="icon-sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/org/startups/${startup.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/builder/${startup.id}`}>Open Workspace</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Assign Mentor</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Rocket className="icon-sm" aria-hidden="true" />
                {startup.program}
              </span>
              <span className="flex items-center gap-1">
                <Users className="icon-sm" aria-hidden="true" />
                {startup.teamSize} members
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
                {startup.cohort}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{startup.progress}%</span>
                </div>
                <Progress value={startup.progress} className="h-1.5" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Readiness</p>
                <p className="text-sm font-medium">{startup.readinessScore}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown to an organisation whose cohorts are still empty. */
const SEED_STARTUPS: Startup[] = [
  {
    id: '1',
    name: 'NeuralFlow',
    industry: 'AI/ML',
    stage: 'Seed',
    program: 'AI Accelerator',
    cohort: 'Cohort 3',
    progress: 85,
    teamSize: 4,
    foundedAt: '2024',
    status: 'active',
    readinessScore: 78,
  },
  {
    id: '2',
    name: 'GreenGrid',
    industry: 'CleanTech',
    stage: 'Pre-seed',
    program: 'Climate Innovation',
    cohort: 'Cohort 2',
    progress: 72,
    teamSize: 3,
    foundedAt: '2024',
    status: 'active',
    readinessScore: 65,
  },
  {
    id: '3',
    name: 'PayFlow',
    industry: 'FinTech',
    stage: 'Seed',
    program: 'FinTech Bootcamp',
    cohort: 'Spring 2024',
    progress: 100,
    teamSize: 5,
    foundedAt: '2023',
    status: 'graduated',
    readinessScore: 92,
  },
  {
    id: '4',
    name: 'HealthSync',
    industry: 'HealthTech',
    stage: 'Idea',
    program: 'AI Accelerator',
    cohort: 'Cohort 3',
    progress: 45,
    teamSize: 2,
    foundedAt: '2024',
    status: 'active',
    readinessScore: 42,
  },
];

export default function OrgStartupsPage() {
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Mock data - replace with actual API calls
  /*
   * The organisation's cohort members. The seed below is what an
   * organisation with an empty cohort sees, so the screen still teaches its
   * shape rather than opening blank.
   */
  const { slug } = useCurrentOrg();
  const { data, isLoading } = useQuery({
    queryKey: ['org', 'members', slug],
    queryFn: () => getOrgMembers(slug!, { limit: 100 }),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.members ?? []).map(toStartup), [data]);
  const startups: Startup[] = live.length > 0 ? live : isLoading ? [] : SEED_STARTUPS;


  const filteredStartups = startups.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = program === 'all' || s.program === program;
    const matchesStatus = status === 'all' || s.status === status;
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const programs = [...new Set(startups.map((s) => s.program))];

  const filtersActive = !!search || program !== 'all' || status !== 'all';
  const clearFilters = () => { setSearch(''); setProgram('all'); setStatus('all'); };

  return (
    <AppShell
      title="Portfolio Startups"
      description="Startups currently in your programs and graduates. Track readiness, milestones, and program assignment."
      actions={(
        <Button asChild>
          <Link href="/org/applications">
            Review Applications
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Startups</p>
              <p className="text-xl font-bold">{startups.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className={cn('text-xl font-bold', STATUS.success.icon)}>
                {startups.filter((s) => s.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Graduated</p>
              <p className={cn('text-xl font-bold', STATUS.info.icon)}>
                {startups.filter((s) => s.status === 'graduated').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg. Readiness</p>
              <p className="text-xl font-bold">
                {Math.round(startups.reduce((acc, s) => acc + s.readinessScore, 0) / startups.length)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search startups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''}
          </p>
          {filteredStartups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
          {filteredStartups.length === 0 && (
            <EmptyOrgStartups filtersActive={filtersActive} onClearFilters={clearFilters} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useState } from 'react';
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
import { cn } from '@/lib/utils';

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

function StartupCard({ startup }: { startup: Startup }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    graduated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    paused: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    dropped: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage src={startup.logoUrl} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
              {startup.name?.[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/org/startups/${startup.id}`} className="font-medium hover:text-primary transition-colors">
                  {startup.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {startup.industry} · {startup.stage}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs', statusColors[startup.status])}>
                  {startup.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
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
                <Rocket className="icon-sm" />
                {startup.program}
              </span>
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />
                {startup.teamSize} members
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />
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

export default function OrgStartupsPage() {
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Mock data - replace with actual API calls
  const startups: Startup[] = [
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

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portfolio Startups</h1>
            <p className="text-muted-foreground">
              Manage and track your portfolio companies
            </p>
          </div>
          <Button asChild>
            <Link href="/org/applications">
              Review Applications
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Startups</p>
              <p className="text-xl font-bold">{startups.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-green-600">
                {startups.filter((s) => s.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Graduated</p>
              <p className="text-xl font-bold text-blue-600">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
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
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No startups found</h3>
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

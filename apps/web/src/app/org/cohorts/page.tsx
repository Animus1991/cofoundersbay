'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Calendar,
  Award,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Rocket,
  Target,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { EmptyOrgCohorts } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

type Cohort = {
  id: string;
  name: string;
  program: string;
  status: 'recruiting' | 'active' | 'completed';
  startups: number;
  mentors: number;
  startDate: string;
  endDate: string;
  progress: number;
  avgReadiness?: number;
  mentorCoverage?: number; // % of startups with assigned mentor
};

const COHORT_STATUS_TONE: Record<Cohort['status'], StatusTone> = {
  recruiting: 'info',
  active: 'success',
  completed: 'neutral',
};

function CohortCard({ cohort }: { cohort: Cohort }) {
  const statusColors = STATUS[COHORT_STATUS_TONE[cohort.status]];
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{cohort.name}</span>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                {cohort.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{cohort.program}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />
                {cohort.startups} startups
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="icon-sm" />
                {cohort.mentors} mentors
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />
                {cohort.startDate} - {cohort.endDate}
              </span>
            </div>
            {cohort.status !== 'recruiting' && (
              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Program Progress</span>
                    <span className="font-medium">{cohort.progress}%</span>
                  </div>
                  <Progress value={cohort.progress} className="h-1.5" />
                </div>
                {cohort.avgReadiness != null && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Avg Readiness</span>
                      <span className="font-medium">{cohort.avgReadiness}%</span>
                    </div>
                    <Progress value={cohort.avgReadiness} className="h-1.5" />
                  </div>
                )}
                <div className="flex items-center gap-3 text-[11px]">
                  {cohort.mentorCoverage != null && (
                    <span className={cn('flex items-center gap-1', cohort.mentorCoverage >= 80 ? STATUS.success.icon : STATUS.warning.icon)}>
                      <CheckCircle2 className="icon-sm" /> {cohort.mentorCoverage}% mentor coverage
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/org/cohorts/${cohort.id}`}>
                  <Eye className="mr-2 icon-sm" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 icon-sm" />
                Edit Cohort
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive-accessible">
                <Trash2 className="mr-2 icon-sm" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgCohortsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data
  const cohorts: Cohort[] = [
    { id: '1', name: 'Cohort 2025-A', program: 'Spring Accelerator 2025', status: 'active', startups: 12, mentors: 8, startDate: 'Jan 2025', endDate: 'Apr 2025', progress: 65, avgReadiness: 72, mentorCoverage: 92 },
    { id: '2', name: 'AI Lab Cohort 1', program: 'AI Innovation Lab', status: 'active', startups: 8, mentors: 5, startDate: 'Feb 2025', endDate: 'Aug 2025', progress: 30, avgReadiness: 58, mentorCoverage: 75 },
    { id: '3', name: 'Bootcamp March', program: 'Pre-seed Bootcamp', status: 'active', startups: 8, mentors: 4, startDate: 'Mar 2025', endDate: 'Mar 2025', progress: 90, avgReadiness: 81, mentorCoverage: 100 },
    { id: '4', name: 'Cohort 2024-C', program: 'Fall Accelerator 2024', status: 'completed', startups: 10, mentors: 8, startDate: 'Sep 2024', endDate: 'Dec 2024', progress: 100, avgReadiness: 88, mentorCoverage: 100 },
    { id: '5', name: 'Summer 2025', program: 'Summer Accelerator 2025', status: 'recruiting', startups: 0, mentors: 0, startDate: 'Jun 2025', endDate: 'Sep 2025', progress: 0 },
  ];

  const totalStartups = useMemo(() => cohorts.reduce((s, c) => s + c.startups, 0), []);
  const totalMentors = useMemo(() => cohorts.reduce((s, c) => s + c.mentors, 0), []);

  const filteredCohorts = cohorts.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.program.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell
      title="Cohorts"
      description="Manage program cohorts and participants"
      actions={<Button className="gap-1.5"><Plus className="icon-sm" /> Create Cohort</Button>}
    >
      <div className="space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder="Search cohorts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="recruiting">Recruiting</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Cohorts', value: cohorts.length, icon: Award, tone: 'accent' as const },
            { label: 'Active', value: cohorts.filter((c) => c.status === 'active').length, icon: TrendingUp, tone: 'success' as const },
            { label: 'Total Startups', value: totalStartups, icon: Rocket, tone: 'info' as const },
            { label: 'Total Mentors', value: totalMentors, icon: GraduationCap, tone: 'accent' as const },
          ].map(({ label, value, icon: Icon, tone }) => (
            <Card key={label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('h-4 w-4', STATUS[tone].icon)} /></div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cohorts List */}
        <div className="space-y-3">
          {filteredCohorts.map((cohort) => (
            <CohortCard key={cohort.id} cohort={cohort} />
          ))}
          {filteredCohorts.length === 0 && (
            <EmptyOrgCohorts
              filtersActive={!!search || statusFilter !== 'all'}
              onClearFilters={() => { setSearch(''); setStatusFilter('all'); }}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Search,
  Plus,
  MoreVertical,
  Users,
  Calendar,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyTenantPrograms } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';

type Program = {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startups: number;
  mentors: number;
  startDate: string;
  endDate: string;
  progress: number;
};

function ProgramCard({ program }: { program: Program }) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
    active: 'bg-status-success-bg text-status-success border-status-success-border',
    completed: 'bg-status-info-bg text-status-info border-status-info-border',
    archived: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  };

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/tenant/programs/${program.id}`} className="font-semibold hover:text-primary-accessible transition-colors">
                {program.name}
              </Link>
              <Badge variant="outline" className={cn('text-xs', statusColors[program.status])}>
                {program.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {program.description}
            </p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{program.type}</Badge>
              <span className="flex items-center gap-1">
                <Users className="icon-sm" aria-hidden="true" />
                {program.startups} startups
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
                {program.startDate} - {program.endDate}
              </span>
            </div>
            {program.status === 'active' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{program.progress}%</span>
                </div>
                <Progress value={program.progress} className="h-2" />
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More options" variant="ghost" size="icon">
                <MoreVertical className="icon-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tenant/programs/${program.id}`}>
                  <Eye className="mr-2 icon-sm" aria-hidden="true" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 icon-sm" aria-hidden="true" />
                Edit Program
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

export default function TenantProgramsPage() {
  const [search, setSearch] = useState('');

  // Mock data
  const programs: Program[] = [
    {
      id: '1',
      name: 'Spring Accelerator 2025',
      description: 'A 12-week intensive accelerator program for early-stage startups in the tech sector.',
      type: 'Accelerator',
      status: 'active',
      startups: 12,
      mentors: 8,
      startDate: 'Jan 2025',
      endDate: 'Apr 2025',
      progress: 65,
    },
    {
      id: '2',
      name: 'AI Innovation Lab',
      description: 'Specialized program for AI/ML startups with access to compute resources and expert mentorship.',
      type: 'Innovation Lab',
      status: 'active',
      startups: 8,
      mentors: 5,
      startDate: 'Feb 2025',
      endDate: 'Aug 2025',
      progress: 30,
    },
    {
      id: '3',
      name: 'Pre-seed Bootcamp',
      description: 'Intensive 4-week bootcamp for founders preparing for their first fundraise.',
      type: 'Bootcamp',
      status: 'active',
      startups: 8,
      mentors: 4,
      startDate: 'Mar 2025',
      endDate: 'Mar 2025',
      progress: 90,
    },
    {
      id: '4',
      name: 'Fall Accelerator 2024',
      description: 'Previous cohort of our flagship accelerator program.',
      type: 'Accelerator',
      status: 'completed',
      startups: 10,
      mentors: 8,
      startDate: 'Sep 2024',
      endDate: 'Dec 2024',
      progress: 100,
    },
    {
      id: '5',
      name: 'Summer Accelerator 2025',
      description: 'Upcoming accelerator cohort for summer 2025.',
      type: 'Accelerator',
      status: 'draft',
      startups: 0,
      mentors: 0,
      startDate: 'Jun 2025',
      endDate: 'Sep 2025',
      progress: 0,
    },
  ];

  const filteredPrograms = programs.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Programs"
      description="Workspaces with programs unlock applications, cohorts, and structured mentoring."
      actions={(
        <Button>
          <Plus className="mr-2 icon-sm" />
          Create Program
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Programs</p>
              <p className="text-xl font-bold">{programs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-status-success">
                {programs.filter((p) => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Startups</p>
              <p className="text-xl font-bold">
                {programs.reduce((acc, p) => acc + p.startups, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Mentors</p>
              <p className="text-xl font-bold">
                {programs.reduce((acc, p) => acc + p.mentors, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Programs List */}
        <div className="space-y-3">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
          {filteredPrograms.length === 0 && (
            <EmptyTenantPrograms filtersActive={!!search} onClearFilters={() => setSearch('')} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

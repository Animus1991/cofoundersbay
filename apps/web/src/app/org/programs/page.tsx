'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  Users,
  ChevronRight,
  MoreVertical,
  Settings,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Program = {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  capacity: number;
  enrolled: number;
  description?: string;
};

function ProgramCard({ program }: { program: Program }) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    archived: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/org/programs/${program.id}`} className="font-semibold hover:text-primary transition-colors">
                {program.name}
              </Link>
              <Badge variant="outline" className={cn('text-xs', statusColors[program.status])}>
                {program.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{program.type}</p>
            {program.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{program.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              {program.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="icon-sm" />
                  {program.startDate} - {program.endDate || 'Ongoing'}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />
                {program.enrolled}/{program.capacity} enrolled
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More options" variant="ghost" size="icon">
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/org/programs/${program.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/org/programs/${program.id}/edit`}>Edit Program</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/org/programs/${program.id}/participants`}>Manage Participants</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgProgramsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data
  const programs: Program[] = [
    {
      id: '1',
      name: 'AI Accelerator 2025',
      type: 'Accelerator',
      status: 'active',
      startDate: 'Jan 2025',
      endDate: 'Apr 2025',
      capacity: 15,
      enrolled: 12,
      description: 'Intensive 12-week program for AI/ML startups',
    },
    {
      id: '2',
      name: 'FinTech Bootcamp',
      type: 'Bootcamp',
      status: 'draft',
      startDate: 'Apr 2025',
      endDate: 'Jun 2025',
      capacity: 20,
      enrolled: 0,
      description: '8-week fintech innovation program',
    },
    {
      id: '3',
      name: 'Climate Innovation',
      type: 'Incubator',
      status: 'active',
      startDate: 'Jan 2025',
      endDate: 'Dec 2025',
      capacity: 10,
      enrolled: 8,
      description: 'Year-long program for climate-focused startups',
    },
    {
      id: '4',
      name: 'Fall 2024 Cohort',
      type: 'Accelerator',
      status: 'completed',
      startDate: 'Sep 2024',
      endDate: 'Dec 2024',
      capacity: 12,
      enrolled: 12,
    },
  ];

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Programs</h1>
            <p className="text-muted-foreground">
              Manage your accelerator programs and cohorts
            </p>
          </div>
          <Button asChild>
            <Link href="/org/programs/new">
              <Plus className="mr-2 icon-sm" />
              New Program
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Programs</p>
              <p className="text-xl font-bold">{programs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-green-600">
                {programs.filter((p) => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
              <p className="text-xl font-bold">
                {programs.reduce((acc, p) => acc + p.enrolled, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xl font-bold text-blue-600">
                {programs.filter((p) => p.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Programs List */}
        <div className="space-y-3">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
          {filteredPrograms.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="icon-lg mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No programs found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first program to get started
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/org/programs/new">
                    <Plus className="mr-2 icon-sm" />
                    Create Program
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

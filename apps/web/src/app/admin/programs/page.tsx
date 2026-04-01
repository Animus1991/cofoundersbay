'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Users,
  Calendar,
  Building2,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

type Program = {
  id: string;
  name: string;
  organization: string;
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
    draft: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    archived: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{program.name}</span>
              <Badge variant="outline" className={cn('text-xs', statusColors[program.status])}>
                {program.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building2 className="icon-sm" />
              {program.organization}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{program.type}</Badge>
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />
                {program.startups} startups
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 icon-sm" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 icon-sm" />
                Edit Program
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
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

export default function AdminProgramsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data
  const programs: Program[] = [
    { id: '1', name: 'Spring Accelerator 2025', organization: 'TechHub', type: 'Accelerator', status: 'active', startups: 12, mentors: 8, startDate: 'Jan 2025', endDate: 'Apr 2025', progress: 65 },
    { id: '2', name: 'AI Innovation Lab', organization: 'AI Ventures', type: 'Innovation Lab', status: 'active', startups: 8, mentors: 5, startDate: 'Feb 2025', endDate: 'Aug 2025', progress: 30 },
    { id: '3', name: 'Pre-seed Bootcamp', organization: 'StartupU', type: 'Bootcamp', status: 'active', startups: 8, mentors: 4, startDate: 'Mar 2025', endDate: 'Mar 2025', progress: 90 },
    { id: '4', name: 'Fall Accelerator 2024', organization: 'TechHub', type: 'Accelerator', status: 'completed', startups: 10, mentors: 8, startDate: 'Sep 2024', endDate: 'Dec 2024', progress: 100 },
    { id: '5', name: 'FinTech Incubator', organization: 'FinLab', type: 'Incubator', status: 'active', startups: 6, mentors: 4, startDate: 'Jan 2025', endDate: 'Jul 2025', progress: 45 },
  ];

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.organization.toLowerCase().includes(search.toLowerCase());
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
              Manage all programs across the platform
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder="Search programs..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
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
              <p className="text-sm text-muted-foreground">Total Startups</p>
              <p className="text-xl font-bold">
                {programs.reduce((acc, p) => acc + p.startups, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Organizations</p>
              <p className="text-xl font-bold">
                {new Set(programs.map((p) => p.organization)).size}
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
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No programs found</h3>
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

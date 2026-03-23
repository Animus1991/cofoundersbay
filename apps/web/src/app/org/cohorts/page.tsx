'use client';

import { useState } from 'react';
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
import { cn } from '@/lib/utils';

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
};

function CohortCard({ cohort }: { cohort: Cohort }) {
  const statusColors: Record<string, string> = {
    recruiting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    completed: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{cohort.name}</span>
              <Badge variant="outline" className={cn('text-xs', statusColors[cohort.status])}>
                {cohort.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{cohort.program}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {cohort.startups} startups
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {cohort.mentors} mentors
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {cohort.startDate} - {cohort.endDate}
              </span>
            </div>
            {cohort.status === 'active' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{cohort.progress}%</span>
                </div>
                <Progress value={cohort.progress} className="h-2" />
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/org/cohorts/${cohort.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Cohort
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
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
    { id: '1', name: 'Cohort 2025-A', program: 'Spring Accelerator 2025', status: 'active', startups: 12, mentors: 8, startDate: 'Jan 2025', endDate: 'Apr 2025', progress: 65 },
    { id: '2', name: 'AI Lab Cohort 1', program: 'AI Innovation Lab', status: 'active', startups: 8, mentors: 5, startDate: 'Feb 2025', endDate: 'Aug 2025', progress: 30 },
    { id: '3', name: 'Bootcamp March', program: 'Pre-seed Bootcamp', status: 'active', startups: 8, mentors: 4, startDate: 'Mar 2025', endDate: 'Mar 2025', progress: 90 },
    { id: '4', name: 'Cohort 2024-C', program: 'Fall Accelerator 2024', status: 'completed', startups: 10, mentors: 8, startDate: 'Sep 2024', endDate: 'Dec 2024', progress: 100 },
    { id: '5', name: 'Summer 2025', program: 'Summer Accelerator 2025', status: 'recruiting', startups: 0, mentors: 0, startDate: 'Jun 2025', endDate: 'Sep 2025', progress: 0 },
  ];

  const filteredCohorts = cohorts.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.program.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cohorts</h1>
            <p className="text-muted-foreground">
              Manage program cohorts and participants
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Cohort
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Cohorts</p>
              <p className="text-2xl font-bold">{cohorts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {cohorts.filter((c) => c.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Startups</p>
              <p className="text-2xl font-bold">
                {cohorts.reduce((acc, c) => acc + c.startups, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Recruiting</p>
              <p className="text-2xl font-bold text-blue-600">
                {cohorts.filter((c) => c.status === 'recruiting').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cohorts List */}
        <div className="space-y-3">
          {filteredCohorts.map((cohort) => (
            <CohortCard key={cohort.id} cohort={cohort} />
          ))}
          {filteredCohorts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No cohorts found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or create a new cohort
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

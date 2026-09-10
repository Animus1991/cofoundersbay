'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Star,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type Application = {
  id: string;
  startupName: string;
  logoUrl?: string;
  founderName: string;
  founderAvatar?: string;
  program: string;
  industry: string;
  stage: string;
  submittedAt: string;
  status: 'pending' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected';
  score?: number;
  reviewedBy?: string;
};

function ApplicationCard({ application }: { application: Application }) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: <Clock className="icon-sm" aria-hidden="true" /> },
    under_review: { color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: <Eye className="icon-sm" aria-hidden="true" /> },
    shortlisted: { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: <Star className="icon-sm" aria-hidden="true" /> },
    accepted: { color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: <CheckCircle2 className="icon-sm" aria-hidden="true" /> },
    rejected: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: <XCircle className="icon-sm" aria-hidden="true" /> },
  };

  const config = statusConfig[application.status];
  const initials = application.startupName?.[0]?.toUpperCase() ?? '?';

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="icon-md rounded-lg">
            <AvatarImage src={application.logoUrl} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary-emphasis font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/org/applications/${application.id}`} className="font-medium hover:text-primary-emphasis transition-colors">
                  {application.startupName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  by {application.founderName} · {application.industry}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs flex items-center gap-1', config.color)}>
                  {config.icon}
                  {application.status.replace('_', ' ')}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More options" variant="ghost" size="icon">
                      <MoreVertical className="icon-sm" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/org/applications/${application.id}`}>Review Application</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Mark as Shortlisted</DropdownMenuItem>
                    <DropdownMenuItem>Schedule Interview</DropdownMenuItem>
                    <DropdownMenuItem className="text-green-600 dark:text-green-400">Accept</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive-emphasis">Reject</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
              <span>{application.program}</span>
              <span>{application.stage}</span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
                {application.submittedAt}
              </span>
              {application.score !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="icon-sm text-amber-500" aria-hidden="true" />
                  Score: {application.score}/100
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgApplicationsPage() {
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Mock data
  const applications: Application[] = [
    {
      id: '1',
      startupName: 'DataVault',
      founderName: 'Alex Johnson',
      program: 'AI Accelerator 2025',
      industry: 'Enterprise SaaS',
      stage: 'Pre-seed',
      submittedAt: 'Mar 18, 2025',
      status: 'pending',
    },
    {
      id: '2',
      startupName: 'EcoTrack',
      founderName: 'Maria Garcia',
      program: 'Climate Innovation',
      industry: 'CleanTech',
      stage: 'Seed',
      submittedAt: 'Mar 17, 2025',
      status: 'under_review',
      score: 78,
    },
    {
      id: '3',
      startupName: 'HealthPulse',
      founderName: 'James Chen',
      program: 'AI Accelerator 2025',
      industry: 'HealthTech',
      stage: 'Pre-seed',
      submittedAt: 'Mar 15, 2025',
      status: 'shortlisted',
      score: 85,
    },
    {
      id: '4',
      startupName: 'PayStream',
      founderName: 'Sarah Williams',
      program: 'FinTech Bootcamp',
      industry: 'FinTech',
      stage: 'Seed',
      submittedAt: 'Mar 10, 2025',
      status: 'accepted',
      score: 92,
    },
    {
      id: '5',
      startupName: 'QuickShip',
      founderName: 'Tom Brown',
      program: 'AI Accelerator 2025',
      industry: 'Logistics',
      stage: 'Idea',
      submittedAt: 'Mar 8, 2025',
      status: 'rejected',
      score: 45,
    },
  ];

  const filteredApplications = applications.filter((a) => {
    const matchesSearch =
      !search ||
      a.startupName.toLowerCase().includes(search.toLowerCase()) ||
      a.founderName.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = program === 'all' || a.program === program;
    const matchesTab = activeTab === 'all' || a.status === activeTab;
    return matchesSearch && matchesProgram && matchesTab;
  });

  const programs = [...new Set(applications.map((a) => a.program))];

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    under_review: applications.filter((a) => a.status === 'under_review').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Applications</h1>
            <p className="text-muted-foreground">
              Review and manage startup applications
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{statusCounts.all}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-gray-600">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.under_review}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Shortlisted</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.shortlisted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{statusCounts.accepted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="under_review">In Review ({statusCounts.under_review})</TabsTrigger>
            <TabsTrigger value="shortlisted">Shortlisted ({statusCounts.shortlisted})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search applications..."
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
        </div>

        {/* Applications List */}
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
          {filteredApplications.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="font-medium">No applications found</h3>
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

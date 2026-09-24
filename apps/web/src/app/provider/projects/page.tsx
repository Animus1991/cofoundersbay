'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatRelativeTime } from '@/lib/utils';
import { listServiceInquiries, type ServiceInquiryItem } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * A project is an inquiry that was accepted — the same row /provider/inquiries
 * lists before the provider agrees to the work, which is why the two screens
 * cannot disagree about a piece of work.
 *
 * `progress` and `dueDate` have no field on the model: an inquiry records what
 * was agreed and when it was resolved, not a schedule. Progress reads 0 and
 * the due date reads a dash rather than a plausible-looking week from now.
 */
function toProject(row: ServiceInquiryItem): Project {
  return {
    id: row.id,
    clientName: row.client?.displayName ?? 'A client',
    clientAvatar: row.client?.avatarUrl ?? undefined,
    service: row.offer.title,
    status: row.status === 'completed' ? 'completed' : 'active',
    progress: row.status === 'completed' ? 100 : 0,
    startDate: row.createdAt,
    dueDate: '',
    lastUpdate: row.resolvedAt ?? row.createdAt,
    amount:
      row.agreedPrice != null
        ? new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: row.currency,
            maximumFractionDigits: 0,
          }).format(row.agreedPrice)
        : '\u2014',
  };
}

type Project = {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientCompany?: string;
  service: string;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  startDate: string;
  dueDate: string;
  lastUpdate: string;
  amount: string;
};

function ProjectCard({ project }: { project: Project }) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    active: { color: 'bg-status-success-bg text-status-success border-status-success-border', icon: Clock },
    completed: { color: 'bg-status-info-bg text-status-info border-status-info-border', icon: CheckCircle },
    on_hold: { color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: AlertCircle },
  };

  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={project.clientAvatar} />
            <AvatarFallback>{project.clientName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{project.clientName}</span>
                  <Badge variant="outline" className={cn('text-xs', config.color)}>
                    <StatusIcon className="mr-1 icon-sm" />
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                {project.clientCompany && (
                  <p className="text-sm text-muted-foreground">{project.clientCompany}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Open project actions for ${project.clientName}`}>
                    <MoreVertical className="icon-sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Update Progress</DropdownMenuItem>
                  <DropdownMenuItem>Message Client</DropdownMenuItem>
                  <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Badge variant="secondary" className="mt-2 text-xs">
              {project.service}
            </Badge>

            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />
                Due: {project.dueDate || '—'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="icon-sm" />
                Updated: <RelativeTime date={project.lastUpdate} format={formatRelativeTime} />
              </span>
              <span className="font-medium text-foreground">{project.amount}</span>
            </div>

            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline">
                <MessageSquare className="mr-1 icon-sm" />
                Message
              </Button>
              <Button size="sm">Update</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shown to a provider with no agreed work yet. */
const SEED_PROJECTS: Project[] = [
  {
    id: '1',
    clientName: 'TechStart Inc',
    clientCompany: 'TechStart Inc',
    service: 'Startup Legal Package',
    status: 'active',
    progress: 75,
    startDate: '2026-03-10T09:00:00.000Z',
    dueDate: 'Mar 25',
    lastUpdate: '2026-09-04T08:00:00.000Z',
    amount: '$2,500',
  },
  {
    id: '2',
    clientName: 'GreenTech Co',
    clientCompany: 'GreenTech Co',
    service: 'Financial Model Creation',
    status: 'active',
    progress: 40,
    startDate: '2026-03-15T09:00:00.000Z',
    dueDate: 'Mar 30',
    lastUpdate: '2026-09-03T10:00:00.000Z',
    amount: '$1,200',
  },
  {
    id: '3',
    clientName: 'DataFlow',
    clientCompany: 'DataFlow',
    service: 'Contract Review',
    status: 'on_hold',
    progress: 60,
    startDate: '2026-03-05T09:00:00.000Z',
    dueDate: 'Apr 5',
    lastUpdate: '2026-09-01T10:00:00.000Z',
    amount: '$450',
  },
  {
    id: '4',
    clientName: 'HealthPulse',
    clientCompany: 'HealthPulse',
    service: 'Startup Legal Package',
    status: 'completed',
    progress: 100,
    startDate: '2026-02-20T09:00:00.000Z',
    dueDate: 'Mar 10',
    lastUpdate: '2026-03-10T09:00:00.000Z',
    amount: '$2,500',
  },
  {
    id: '5',
    clientName: 'EduLearn',
    clientCompany: 'EduLearn',
    service: 'Financial Model Creation',
    status: 'completed',
    progress: 100,
    startDate: '2026-02-15T09:00:00.000Z',
    dueDate: 'Feb 28',
    lastUpdate: '2026-02-28T09:00:00.000Z',
    amount: '$1,200',
  },
];

export default function ProviderProjectsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Mock data
  const { data, isLoading } = useQuery({
    queryKey: ['provider', 'projects'],
    queryFn: () => listServiceInquiries({ side: 'provider', kind: 'projects', limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.inquiries ?? []).map(toProject), [data]);
  const projects: Project[] = live.length > 0 ? live : isLoading ? [] : SEED_PROJECTS;


  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.service.toLowerCase().includes(search.toLowerCase());
    const matchesTab = p.status === activeTab || (activeTab === 'all');
    return matchesSearch && matchesTab;
  });

  const counts = {
    active: projects.filter((p) => p.status === 'active').length,
    on_hold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              Active <Badge variant="secondary" className="ml-1">{counts.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="on_hold">
              On Hold <Badge variant="secondary" className="ml-1">{counts.on_hold}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed <Badge variant="secondary" className="ml-1">{counts.completed}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {filteredProjects.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium">No projects found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No {activeTab.replace('_', ' ')} projects
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

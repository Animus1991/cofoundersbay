'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, LayoutGrid, List, Users, Calendar,
  Target, Rocket, Clock, MoreVertical, Star, MessageSquare,
  ExternalLink, ChevronRight, Briefcase, Zap, TrendingUp,
  Sparkles, Globe, UserPlus, BarChart3, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppShell } from '@/components/layout/AppShell';
import { cn } from '@/lib/utils';

type ProjectStatus = 'idea' | 'validating' | 'building' | 'launched' | 'scaling';

type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  stage: string;
  industry: string;
  teamSize: number;
  maxTeamSize: number;
  createdAt: Date;
  updatedAt: Date;
  founder: {
    id: string;
    name: string;
    avatar?: string;
  };
  members: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  }[];
  rolesNeeded: string[];
  tags: string[];
  isStarred?: boolean;
  messageCount?: number;
  progress?: number;
};

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: React.ElementType }> = {
  idea: { label: 'Idea Stage', color: 'bg-status-accent-bg text-status-accent border-status-accent-border', icon: Zap },
  validating: { label: 'Validating', color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: Target },
  building: { label: 'Building', color: 'bg-status-info-bg text-status-info border-status-info-border', icon: Rocket },
  launched: { label: 'Launched', color: 'bg-status-success-bg text-status-success border-status-success-border', icon: TrendingUp },
  scaling: { label: 'Scaling', color: 'bg-status-info-bg text-status-info border-status-info-border', icon: Briefcase },
};

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'EcoTrack',
    description: 'AI-powered carbon footprint tracking for businesses. Helping companies measure, reduce, and offset their environmental impact.',
    status: 'building',
    stage: 'Pre-seed',
    industry: 'CleanTech',
    teamSize: 3,
    maxTeamSize: 5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-10'),
    founder: { id: 'u1', name: 'Sarah Chen', avatar: undefined },
    members: [
      { id: 'u1', name: 'Sarah Chen', avatar: undefined, role: 'CEO' },
      { id: 'u2', name: 'Mike Ross', avatar: undefined, role: 'CTO' },
      { id: 'u3', name: 'Lisa Park', avatar: undefined, role: 'Designer' },
    ],
    rolesNeeded: ['Backend Engineer', 'Growth Lead'],
    tags: ['AI', 'Sustainability', 'B2B', 'SaaS'],
    isStarred: true,
    messageCount: 12,
    progress: 65,
  },
  {
    id: '2',
    name: 'MentorMatch',
    description: 'Platform connecting early-stage founders with experienced mentors for personalized guidance and accountability.',
    status: 'validating',
    stage: 'Idea',
    industry: 'EdTech',
    teamSize: 2,
    maxTeamSize: 4,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-08'),
    founder: { id: 'u4', name: 'James Wilson', avatar: undefined },
    members: [
      { id: 'u4', name: 'James Wilson', avatar: undefined, role: 'Founder' },
      { id: 'u5', name: 'Emma Davis', avatar: undefined, role: 'Product' },
    ],
    rolesNeeded: ['Full-stack Developer', 'Marketing'],
    tags: ['Marketplace', 'Mentorship', 'Community'],
    messageCount: 5,
    progress: 30,
  },
  {
    id: '3',
    name: 'HealthSync',
    description: 'Unified health data platform that aggregates wearable data for personalized wellness insights.',
    status: 'idea',
    stage: 'Concept',
    industry: 'HealthTech',
    teamSize: 1,
    maxTeamSize: 4,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
    founder: { id: 'u6', name: 'Dr. Amy Liu', avatar: undefined },
    members: [
      { id: 'u6', name: 'Dr. Amy Liu', avatar: undefined, role: 'Founder' },
    ],
    rolesNeeded: ['Technical Co-founder', 'Mobile Developer', 'Data Scientist'],
    tags: ['Health', 'Wearables', 'Data', 'Consumer'],
    progress: 10,
  },
];

function ProjectCard({ project, viewMode }: { project: Project; viewMode: 'grid' | 'list' }) {
  const statusConfig = STATUS_CONFIG[project.status];
  const StatusIcon = statusConfig.icon;

  if (viewMode === 'list') {
    return (
      <Card className="border-border/60 hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/projects/${project.id}`} className="font-semibold text-foreground hover:text-primary-accessible transition-colors">
                  {project.name}
                </Link>
                <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                  <StatusIcon className="icon-sm mr-1" />
                  {statusConfig.label}
                </Badge>
                {project.isStarred && <Star className="icon-sm text-status-warning fill-status-warning" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary-accessible">
                      {m.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.members.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{project.teamSize}</span>/{project.maxTeamSize}
              </div>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {project.rolesNeeded.slice(0, 2).map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${project.id}`}>
                  View
                  <ChevronRight className="icon-sm ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 hover:border-primary/30 transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/projects/${project.id}`} className="font-semibold text-foreground hover:text-primary-accessible transition-colors">
                {project.name}
              </Link>
              {project.isStarred && <Star className="icon-sm text-status-warning fill-status-warning" />}
            </div>
            <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
              <StatusIcon className="icon-sm mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Star className="icon-sm mr-2" />
                {project.isStarred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="icon-sm mr-2" />
                Message Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <ExternalLink className="icon-sm mr-2" />
                Share Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {project.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="icon-sm" />
              <span>
                <span className="font-medium text-foreground">{project.teamSize}</span>/{project.maxTeamSize} members
              </span>
            </div>
            {project.messageCount && project.messageCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="icon-sm" />
                {project.messageCount}
              </div>
            )}
          </div>

          <div className="flex -space-x-2 mb-3">
            {project.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={m.avatar} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary-accessible">
                  {m.name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {project.rolesNeeded.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Looking for:</p>
              <div className="flex flex-wrap gap-1">
                {project.rolesNeeded.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary-accessible">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button className="w-full" asChild>
          <Link href={`/projects/${project.id}`}>
            View Project
            <ChevronRight className="icon-sm ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

const STAGE_PILLS = [
  { value: 'all',        label: 'All Stages',  icon: Layers    },
  { value: 'idea',       label: 'Idea',        icon: Zap       },
  { value: 'validating', label: 'Validating',  icon: Target    },
  { value: 'building',   label: 'Building',    icon: Rocket    },
  { value: 'launched',   label: 'Launched',    icon: Globe     },
  { value: 'scaling',    label: 'Scaling',     icon: TrendingUp},
];

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  const totalProjects = MOCK_PROJECTS.length;
  const buildingCount = MOCK_PROJECTS.filter((p) => p.status === 'building' || p.status === 'launched' || p.status === 'scaling').length;
  const openRolesCount = MOCK_PROJECTS.reduce((acc, p) => acc + p.rolesNeeded.length, 0);
  const industries = [...new Set(MOCK_PROJECTS.map((p) => p.industry))];

  const filteredProjects = MOCK_PROJECTS.filter((p) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (industryFilter !== 'all' && p.industry !== industryFilter) return false;
    return true;
  });

  const featuredProjects = filteredProjects.filter((p) => p.isStarred);
  const regularProjects  = filteredProjects.filter((p) => !p.isStarred);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Projects & Collaborations</h1>
            <p className="text-muted-foreground">
              Discover startup projects or create your own to find co-founders
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/create">
              <Plus className="icon-sm mr-2" />
              Create Project
            </Link>
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Projects',  value: totalProjects,             icon: Layers,     color: 'text-status-accent', bg: 'bg-status-accent-bg' },
            { label: 'Active / Building', value: buildingCount,           icon: Rocket,     color: 'text-status-info',   bg: 'bg-status-info-bg'   },
            { label: 'Open Roles',      value: openRolesCount,            icon: UserPlus,   color: 'text-status-success',bg: 'bg-status-success-bg'},
            { label: 'Industries',      value: industries.length,         icon: BarChart3,  color: 'text-status-warning',  bg: 'bg-status-warning-bg'  },
          ].map((s) => {
            const SIcon = s.icon;
            return (
              <Card key={s.label} className="border-border/40">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg)}>
                    <SIcon className={cn('icon-sm', s.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground leading-none">{s.value}</p>
                    <p className="mt-0.5 text-2xs text-muted-foreground truncate">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="discover" className="space-y-4">
          <TabsList>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="joined">Joined</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
                <Input
                  placeholder="Search by name, description, industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="icon-sm" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="icon-sm" />
                </Button>
              </div>
            </div>

            {/* Stage filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STAGE_PILLS.map((pill) => {
                const PIcon = pill.icon;
                const isActive = statusFilter === pill.value;
                return (
                  <button
                    key={pill.value}
                    onClick={() => setStatusFilter(pill.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/60 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                    )}
                  >
                    <PIcon className="icon-sm" />
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Results count */}
            {filteredProjects.length > 0 && (
              <p className="text-xs text-muted-foreground">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found</p>
            )}

            {/* Projects Grid/List */}
            {filteredProjects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Rocket className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No projects found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters or create a new project
                  </p>
                  <Button asChild>
                    <Link href="/projects/create">
                      <Plus className="icon-sm mr-2" />
                      Create Project
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-3'
              )}>
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} viewMode={viewMode} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-projects">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first project to start finding co-founders
                </p>
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="icon-sm mr-2" />
                    Create Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="joined">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No joined projects</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover projects and join teams that match your skills
                </p>
                <Button variant="outline" onClick={() => {}}>
                  Browse Projects
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="starred">
            <div className={cn(
              viewMode === 'grid'
                ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'space-y-3'
            )}>
              {MOCK_PROJECTS.filter((p) => p.isStarred).map((project) => (
                <ProjectCard key={project.id} project={project} viewMode={viewMode} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

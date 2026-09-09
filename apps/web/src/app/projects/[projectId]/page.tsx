'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MoreVertical, Star, Share2, MessageSquare, Users,
  Calendar, Target, Rocket, Clock, Edit, Trash2, UserPlus,
  ExternalLink, FileText, CheckCircle2, Circle, Briefcase,
  Globe, MapPin, Mail, Video, Phone, Zap, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppShell } from '@/components/layout/AppShell';
import { RoleBadge } from '@/components/common/RoleBadge';
import { cn } from '@/lib/utils';

type ProjectStatus = 'idea' | 'validating' | 'building' | 'launched' | 'scaling';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: React.ElementType }> = {
  idea: { label: 'Idea Stage', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30', icon: Zap },
  validating: { label: 'Validating', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: Target },
  building: { label: 'Building', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: Rocket },
  launched: { label: 'Launched', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: TrendingUp },
  scaling: { label: 'Scaling', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30', icon: Briefcase },
};

const MOCK_PROJECT = {
  id: '1',
  name: 'EcoTrack',
  tagline: 'AI-powered carbon footprint tracking for businesses',
  description: `EcoTrack is building the future of corporate sustainability. Our AI-powered platform helps businesses of all sizes measure, reduce, and offset their carbon footprint with unprecedented accuracy and ease.

We're tackling one of the biggest challenges of our time: climate change. By making carbon tracking accessible and actionable, we're empowering companies to make real environmental impact.

Our platform integrates with existing business tools, automatically calculates emissions across all operations, and provides actionable insights for reduction. We also facilitate verified carbon offset purchases and sustainability reporting.`,
  status: 'building' as ProjectStatus,
  stage: 'Pre-seed',
  industry: 'CleanTech',
  location: 'San Francisco, CA',
  website: 'https://ecotrack.io',
  teamSize: 3,
  maxTeamSize: 5,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-03-10'),
  founder: { id: 'u1', name: 'Sarah Chen', avatar: undefined, role: 'founder' },
  members: [
    { id: 'u1', name: 'Sarah Chen', avatar: undefined, role: 'CEO & Co-founder', joinedAt: new Date('2024-01-15') },
    { id: 'u2', name: 'Mike Ross', avatar: undefined, role: 'CTO & Co-founder', joinedAt: new Date('2024-01-15') },
    { id: 'u3', name: 'Lisa Park', avatar: undefined, role: 'Lead Designer', joinedAt: new Date('2024-02-01') },
  ],
  rolesNeeded: [
    { title: 'Backend Engineer', description: 'Help build our data pipeline and API infrastructure', equity: '1-2%', commitment: 'Full-time' },
    { title: 'Growth Lead', description: 'Drive user acquisition and partnership development', equity: '0.5-1%', commitment: 'Full-time' },
  ],
  tags: ['AI', 'Sustainability', 'B2B', 'SaaS', 'Climate'],
  isStarred: true,
  progress: 65,
  milestones: [
    { id: 'm1', title: 'MVP Launch', status: 'completed', date: new Date('2024-02-01') },
    { id: 'm2', title: 'First 10 Customers', status: 'completed', date: new Date('2024-02-28') },
    { id: 'm3', title: 'Seed Funding', status: 'in_progress', date: new Date('2024-04-15') },
    { id: 'm4', title: '100 Customers', status: 'pending', date: new Date('2024-06-01') },
  ],
  updates: [
    { id: 'up1', content: 'Closed our first enterprise deal with a Fortune 500 company!', date: new Date('2024-03-08'), author: 'Sarah Chen' },
    { id: 'up2', content: 'Launched integration with Salesforce and HubSpot', date: new Date('2024-02-25'), author: 'Mike Ross' },
  ],
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(MOCK_PROJECT.isStarred);

  const project = MOCK_PROJECT;
  const statusConfig = STATUS_CONFIG[project.status];
  const StatusIcon = statusConfig.icon;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button aria-label="Go back" variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="icon-md" aria-hidden="true" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <Badge variant="outline" className={cn('text-sm', statusConfig.color)}>
                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{project.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Favourite"
              variant="ghost"
              size="icon"
              onClick={() => setIsStarred(!isStarred)}
            >
              <Star className={cn('h-5 w-5', isStarred && 'fill-amber-500 text-amber-500')} aria-hidden="true" />
            </Button>
            <Button aria-label="Share" variant="ghost" size="icon">
              <Share2 className="icon-md" aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="More options" variant="ghost" size="icon">
                  <MoreVertical className="icon-md" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="icon-sm mr-2" aria-hidden="true" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="icon-sm mr-2" aria-hidden="true" />
                  View Public Page
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive-emphasis">
                  <Trash2 className="icon-sm mr-2" aria-hidden="true" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {project.description.split('\n\n').map((p, i) => (
                        <p key={i} className="text-muted-foreground">{p}</p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Open Roles */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Open Roles</CardTitle>
                    <Badge variant="outline">{project.rolesNeeded.length} positions</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.rolesNeeded.map((role, i) => (
                      <div key={i} className="rounded-lg border border-border/60 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{role.title}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <Button size="sm">Apply</Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                            {role.commitment}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                            {role.equity} equity
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Team Members</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {project.teamSize}/{project.maxTeamSize} members
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary-emphasis">
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Link href={`/profiles/${member.id}`} className="font-medium text-foreground hover:text-primary-emphasis transition-colors">
                            {member.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button aria-label="Message" variant="ghost" size="icon" className="h-8 w-8">
                            <MessageSquare className="icon-sm" aria-hidden="true" />
                          </Button>
                          <Button aria-label="Start video call" variant="ghost" size="icon" className="h-8 w-8">
                            <Video className="icon-sm" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Project Milestones</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{project.progress}% complete</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={project.progress} className="h-2 mb-6" />
                    <div className="space-y-4">
                      {project.milestones.map((milestone, i) => (
                        <div key={milestone.id} className="flex items-start gap-4">
                          <div className={cn(
                            'mt-0.5 rounded-full p-1',
                            milestone.status === 'completed' && 'bg-emerald-500/10 text-emerald-500',
                            milestone.status === 'in_progress' && 'bg-blue-500/10 text-blue-500',
                            milestone.status === 'pending' && 'bg-muted text-muted-foreground'
                          )}>
                            {milestone.status === 'completed' ? (
                              <CheckCircle2 className="icon-sm" aria-hidden="true" />
                            ) : (
                              <Circle className="icon-sm" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={cn(
                                'font-medium',
                                milestone.status === 'completed' && 'text-muted-foreground line-through'
                              )}>
                                {milestone.title}
                              </h4>
                              <span className="text-sm text-muted-foreground">
                                {milestone.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Updates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.updates.map((update) => (
                      <div key={update.id} className="border-l-2 border-primary/30 pl-4 py-2">
                        <p className="text-foreground">{update.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{update.author}</span>
                          <span>•</span>
                          <span>{update.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button className="w-full gap-2">
                  <UserPlus className="icon-sm" aria-hidden="true" />
                  Request to Join
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="icon-sm" aria-hidden="true" />
                  Message Team
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Video className="icon-sm" aria-hidden="true" />
                  Schedule Call
                </Button>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Briefcase className="icon-sm text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stage</p>
                    <p className="text-sm font-medium">{project.stage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Target className="icon-sm text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p className="text-sm font-medium">{project.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="icon-sm text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{project.location}</p>
                  </div>
                </div>
                {project.website && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Globe className="icon-sm text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-emphasis hover:underline">
                        {project.website.replace('https://', '')}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="icon-sm text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Founded</p>
                    <p className="text-sm font-medium">{project.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Founder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Founder</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/profiles/${project.founder.id}`} className="flex items-center gap-3 group">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={project.founder.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary-emphasis">
                      {project.founder.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary-emphasis transition-colors">
                      {project.founder.name}
                    </p>
                    <RoleBadge role={project.founder.role} size="sm" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

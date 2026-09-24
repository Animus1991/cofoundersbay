'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  MessageSquare,
  FolderKanban,
  Star,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreVertical,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import {
  getProviderSummary,
  listServiceInquiries,
  type ServiceInquiryItem,
} from '@/lib/api';
import { useDemoData } from '@/contexts/DemoDataContext';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Inquiry = {
  id: string;
  clientName: string;
  clientAvatar?: string;
  service: string;
  message: string;
  receivedAt: string;
  status: 'new' | 'replied' | 'converted';
};

type Project = {
  id: string;
  clientName: string;
  clientAvatar?: string;
  service: string;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  dueDate: string;
};

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const statusColors: Record<string, string> = {
    new: 'bg-status-info-bg text-status-info border-status-info-border',
    replied: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    converted: 'bg-status-success-bg text-status-success border-status-success-border',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={inquiry.clientAvatar} />
        <AvatarFallback>{inquiry.clientName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{inquiry.clientName}</span>
          <Badge variant="outline" className={cn('text-xs', statusColors[inquiry.status])}>
            {inquiry.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{inquiry.service}</p>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{inquiry.message}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">
          <RelativeTime date={inquiry.receivedAt} format={formatRelativeTime} />
        </p>
        <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs">
          Reply
        </Button>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    active: 'bg-status-success-bg text-status-success border-status-success-border',
    completed: 'bg-status-info-bg text-status-info border-status-info-border',
    on_hold: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={project.clientAvatar} />
        <AvatarFallback>{project.clientName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{project.clientName}</span>
          <Badge variant="outline" className={cn('text-xs', statusColors[project.status])}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{project.service}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{project.progress}%</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="icon-sm" />
          {project.dueDate || EM_DASH}
        </p>
      </div>
    </div>
  );
}

const EM_DASH = String.fromCharCode(0x2014);

/**
 * The dashboard's three lists come from the same rows its sibling pages list,
 * so the summary tiles and the cards under them cannot disagree.
 *
 * `/provider/inquiries` shows every inquiry, `/provider/projects` the accepted
 * ones and `/provider/reviews` the rated ones; this page shows the head of each.
 */
const INQUIRY_STATE: Record<string, Inquiry['status']> = {
  open: 'new',
  in_discussion: 'replied',
  accepted: 'converted',
  completed: 'converted',
  declined: 'replied',
  cancelled: 'replied',
};

function toInquiry(row: ServiceInquiryItem): Inquiry {
  return {
    id: row.id,
    clientName: row.client?.displayName ?? 'Someone',
    clientAvatar: row.client?.avatarUrl ?? undefined,
    service: row.offer?.title ?? EM_DASH,
    message: row.message,
    receivedAt: row.createdAt,
    status: INQUIRY_STATE[row.status] ?? 'new',
  };
}

/*
 * `progress` and `dueDate` have no field on the model - an inquiry records what
 * was agreed and when it was resolved, not a schedule - so progress reads 0
 * until the work is marked complete and the due date reads a dash rather than a
 * plausible-looking date.
 */
function toProject(row: ServiceInquiryItem): Project {
  return {
    id: row.id,
    clientName: row.client?.displayName ?? 'A client',
    clientAvatar: row.client?.avatarUrl ?? undefined,
    service: row.offer?.title ?? EM_DASH,
    status: row.status === 'completed' ? 'completed' : 'active',
    progress: row.status === 'completed' ? 100 : 0,
    dueDate: '',
  };
}

type DashReview = { id: string; client: string; rating: number; comment: string };

function toReview(row: ServiceInquiryItem): DashReview {
  return {
    id: row.id,
    client: row.client?.displayName ?? 'A client',
    rating: row.rating ?? 0,
    comment: row.reviewComment ?? '',
  };
}

/** Shown to a provider whose book is still empty. */
const DEMO_INQUIRIES: Inquiry[] = [
  {
    id: '1',
    clientName: 'John Doe',
    service: 'Legal Consultation',
    message: 'Hi, I need help with my startup incorporation documents...',
    receivedAt: '2026-09-22T14:00:00.000Z',
    status: 'new',
  },
  {
    id: '2',
    clientName: 'Jane Smith',
    service: 'Financial Planning',
    message: 'Looking for help with our Series A financial model...',
    receivedAt: '2026-09-21T10:00:00.000Z',
    status: 'replied',
  },
  {
    id: '3',
    clientName: 'Mike Johnson',
    service: 'Legal Consultation',
    message: 'Need to review our terms of service...',
    receivedAt: '2026-09-20T10:00:00.000Z',
    status: 'converted',
  },
];

const DEMO_PROJECTS: Project[] = [
  {
    id: '1',
    clientName: 'TechStart Inc',
    service: 'Legal Package',
    status: 'active',
    progress: 75,
    dueDate: '',
  },
  {
    id: '2',
    clientName: 'GreenTech Co',
    service: 'Financial Model',
    status: 'active',
    progress: 40,
    dueDate: '',
  },
  {
    id: '3',
    clientName: 'DataFlow',
    service: 'Contract Review',
    status: 'on_hold',
    progress: 60,
    dueDate: '',
  },
];

const DEMO_REVIEWS: DashReview[] = [
  { id: '1', client: 'Sarah W.', rating: 5, comment: 'Excellent service, very professional!' },
  { id: '2', client: 'Tom B.', rating: 5, comment: 'Quick turnaround and great quality.' },
  { id: '3', client: 'Lisa M.', rating: 4, comment: 'Good work, would recommend.' },
];

export default function ProviderDashboardPage() {
  /*
   * Four figures written into the source. Three are counted by the summary
   * endpoint over the provider's own offers and inquiries — the same rows
   * /provider/inquiries, /provider/projects and /provider/reviews list, so
   * the dashboard cannot disagree with the pages it links to.
   *
   * Monthly revenue reads a dash: an inquiry records an agreed price, not when
   * it was paid, so there is no month to total. A rating of 4.8 with nothing
   * rated would be the same invention this page is being cured of, so that
   * tile is null until somebody rates the work.
   */
  const { data: summary } = useQuery({
    queryKey: ['provider', 'summary'],
    queryFn: getProviderSummary,
    staleTime: 60_000,
    retry: 0,
  });

  const { showDemoData } = useDemoData();

  /*
   * The head of each list, from the same endpoint the sibling pages read.
   * `kind` splits one table three ways: every inquiry, the accepted ones, the
   * rated ones - so a row cannot be a project here and an open inquiry there.
   */
  const { data: inquiryPage, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['provider', 'dashboard', 'inquiries'],
    queryFn: () => listServiceInquiries({ side: 'provider', limit: 5 }),
    staleTime: 30_000,
    retry: 0,
  });
  const { data: projectPage, isLoading: projectsLoading } = useQuery({
    queryKey: ['provider', 'dashboard', 'projects'],
    queryFn: () => listServiceInquiries({ side: 'provider', kind: 'projects', limit: 5 }),
    staleTime: 30_000,
    retry: 0,
  });
  const { data: reviewPage, isLoading: reviewsLoading } = useQuery({
    queryKey: ['provider', 'dashboard', 'reviews'],
    queryFn: () => listServiceInquiries({ side: 'provider', kind: 'reviews', limit: 3 }),
    staleTime: 60_000,
    retry: 0,
  });

  const liveInquiries = useMemo(
    () => (inquiryPage?.inquiries ?? []).map(toInquiry),
    [inquiryPage],
  );
  const liveProjects = useMemo(
    () => (projectPage?.inquiries ?? []).map(toProject),
    [projectPage],
  );
  const liveReviews = useMemo(
    () => (reviewPage?.inquiries ?? []).map(toReview),
    [reviewPage],
  );

  const dash = '\u2014';
  const inquiries =
    liveInquiries.length > 0
      ? liveInquiries
      : inquiriesLoading
        ? []
        : showDemoData
          ? DEMO_INQUIRIES
          : [];
  const projects =
    liveProjects.length > 0
      ? liveProjects
      : projectsLoading
        ? []
        : showDemoData
          ? DEMO_PROJECTS
          : [];
  const recentReviews =
    liveReviews.length > 0
      ? liveReviews
      : reviewsLoading
        ? []
        : showDemoData
          ? DEMO_REVIEWS
          : [];

  /*
   * The tiles prefer the summary endpoint, which counts the provider's whole
   * book rather than the five rows shown here. When it has not answered - no
   * session, or the demo overlay - they count what is actually on screen, so
   * the page can never show a dash above a list of three.
   *
   * Monthly revenue keeps its dash in every case: an inquiry records an agreed
   * price, not when it was paid, so there is no month to total.
   */
  const avgOfShown =
    recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : null;

  const stats = {
    activeProjects: summary?.projects ?? (projects.length || null),
    pendingInquiries:
      summary?.openInquiries ??
      (inquiries.filter((row) => row.status !== 'converted').length || null),
    monthlyRevenue: null as string | null,
    avgRating:
      summary?.avgRating ?? (avgOfShown != null ? Number(avgOfShown.toFixed(1)) : null),
  };

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight">Provider Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your services and client projects
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/provider/services">
                <Store className="mr-2 icon-sm" />
                Manage Services
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="icon-md text-primary-accessible" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-xl font-bold">{stats.activeProjects ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-info-bg">
                  <MessageSquare className="icon-md text-status-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Inquiries</p>
                  <p className="text-xl font-bold">{stats.pendingInquiries ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-success-bg">
                  <DollarSign className="icon-md text-status-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-xl font-bold">{stats.monthlyRevenue ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-warning-bg">
                  <Star className="icon-md text-status-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-xl font-bold">{stats.avgRating ?? dash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Inquiries */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Inquiries</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/provider/inquiries">
                  View All
                  <ChevronRight className="ml-1 icon-sm" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {inquiries.map((inquiry) => (
                <InquiryCard key={inquiry.id} inquiry={inquiry} />
              ))}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{review.client}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="icon-sm fill-status-warning text-status-warning" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link href="/provider/reviews">View All Reviews</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Active Projects</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/provider/projects">
                View All
                <ChevronRight className="ml-1 icon-sm" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

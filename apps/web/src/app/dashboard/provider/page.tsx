'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Briefcase,
  ChevronRight,
  Clock,
  FolderKanban,
  MessageSquare,
  Star,
  Store,
  UserCog,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RelativeTime } from '@/components/common/RelativeTime';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { useDemoData } from '@/contexts/DemoDataContext';
import { useSession } from '@/hooks/useSession';
import {
  getMeProfile,
  getProviderSummary,
  listMyMarketplaceServices,
  listServiceInquiries,
  type ServiceInquiryItem,
} from '@/lib/api';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { qk, queryKeys } from '@/lib/query-keys';
import { cn, formatRelativeTime } from '@/lib/utils';

/*
 * The provider's one home.
 *
 * There were two. This route - the one the navigation, the role switcher and
 * the post-login redirect all open - drew constants: 5 services, 8 projects,
 * "$12,450" this month, a 4.9 "based on 47 reviews", a 98% response rate and
 * a "Top Rated Provider" badge. /provider/dashboard beside it read the
 * provider's own book and said 3 projects, 2 inquiries and a 4.7. It now
 * reads that book - the summary, inquiries, projects, reviews and services
 * endpoints the provider pages list from - and /provider/dashboard redirects
 * here, the way /investor/dashboard and /mentor/dashboard already do.
 */

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
  status: 'active' | 'completed';
  agreedPrice: number | null;
  currency: string;
};

type DashReview = { id: string; client: string; rating: number; comment: string };

const EM_DASH = '—';

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
 * An inquiry records what was agreed and when it was resolved, not a
 * schedule, so a project shows its agreed price rather than an invented
 * progress bar or due date.
 */
function toProject(row: ServiceInquiryItem): Project {
  return {
    id: row.id,
    clientName: row.client?.displayName ?? 'A client',
    clientAvatar: row.client?.avatarUrl ?? undefined,
    service: row.offer?.title ?? EM_DASH,
    status: row.status === 'completed' ? 'completed' : 'active',
    agreedPrice: row.agreedPrice,
    currency: row.currency || 'EUR',
  };
}

function toReview(row: ServiceInquiryItem): DashReview {
  return {
    id: row.id,
    client: row.client?.displayName ?? 'A client',
    rating: row.rating ?? 0,
    comment: row.reviewComment ?? '',
  };
}

function eur(amount: number | null, currency = 'EUR'): string {
  if (amount == null) return EM_DASH;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

/*
 * Shown when the showcase switch is on and the book is empty (a real account
 * with no inquiries yet). The same founders the showcase's API answers with.
 */
const DEMO_INQUIRIES: Inquiry[] = [
  { id: 'd1', clientName: 'Katerina Nikolaou', service: 'Seed-round financial model', message: 'Raising a €1.2M seed in Q1 and need a model investors will trust.', receivedAt: '2026-09-22T10:00:00.000Z', status: 'new' },
  { id: 'd2', clientName: 'Giorgos Vlachos', service: 'Incorporation & shareholder agreement', message: 'Two founders, one angel committed - we need the company set up.', receivedAt: '2026-09-20T10:00:00.000Z', status: 'replied' },
];
const DEMO_PROJECTS: Project[] = [
  { id: 'd3', clientName: 'Sofia Alexiou', service: 'Fractional CFO', status: 'active', agreedPrice: 3800, currency: 'EUR' },
  { id: 'd4', clientName: 'Yannis Petrou', service: 'Seed-round financial model', status: 'completed', agreedPrice: 1800, currency: 'EUR' },
];
const DEMO_REVIEWS: DashReview[] = [
  { id: 'd5', client: 'Yannis Petrou', rating: 5, comment: 'The model answered every question our lead asked before they asked it.' },
  { id: 'd6', client: 'Maria Georgiou', rating: 4, comment: 'Clear, fast, and the agreement held up in due diligence.' },
];

const STATUS_TONE: Record<Inquiry['status'], string> = {
  new: 'bg-status-info-bg text-status-info border-status-info-border',
  replied: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  converted: 'bg-status-success-bg text-status-success border-status-success-border',
};

function StatCard({ icon: Icon, label, value, subtext, href, tone }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  href: string;
  tone: string;
}) {
  return (
    <Link href={href} className="block h-full rounded-xl focus-ring">
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xl font-bold tabular-nums">{value}</p>
              {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </div>
            <div className={cn('shrink-0 rounded-lg p-2', tone)}>
              <Icon className="icon-md" aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ProviderDashboard() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });
  const { data: summary } = useQuery({
    queryKey: qk('provider', 'summary'),
    queryFn: getProviderSummary,
    staleTime: 60_000,
    retry: 0,
  });
  const { data: inquiryPage, isLoading: inquiriesLoading } = useQuery({
    queryKey: qk('provider', 'inquiries', 'dashboard'),
    queryFn: () => listServiceInquiries({ side: 'provider', limit: 5 }),
    staleTime: 30_000,
    retry: 0,
  });
  const { data: projectPage, isLoading: projectsLoading } = useQuery({
    queryKey: qk('provider', 'projects', 'dashboard'),
    queryFn: () => listServiceInquiries({ side: 'provider', kind: 'projects', limit: 50 }),
    staleTime: 30_000,
    retry: 0,
  });
  const { data: reviewPage, isLoading: reviewsLoading } = useQuery({
    queryKey: qk('provider', 'reviews', 'dashboard'),
    queryFn: () => listServiceInquiries({ side: 'provider', kind: 'reviews', limit: 3 }),
    staleTime: 60_000,
    retry: 0,
  });
  const { data: servicePage, isLoading: servicesLoading } = useQuery({
    queryKey: qk('provider', 'services'),
    queryFn: () => listMyMarketplaceServices({ limit: 50 }),
    staleTime: 60_000,
    retry: 0,
  });

  const displayName = profile?.profile?.displayName || 'Provider';
  const liveInquiries = useMemo(() => (inquiryPage?.inquiries ?? []).map(toInquiry), [inquiryPage]);
  const liveProjects = useMemo(() => (projectPage?.inquiries ?? []).map(toProject), [projectPage]);
  const liveReviews = useMemo(() => (reviewPage?.inquiries ?? []).map(toReview), [reviewPage]);
  const fallback = <T,>(live: T[], loading: boolean, demo: T[]) => (live.length ? live : loading ? [] : showDemoData ? demo : []);
  const inquiries = fallback(liveInquiries, inquiriesLoading, DEMO_INQUIRIES);
  const projects = fallback(liveProjects, projectsLoading, DEMO_PROJECTS);
  const reviews = fallback(liveReviews, reviewsLoading, DEMO_REVIEWS);
  const services = servicePage?.services ?? [];
  const activeProjects = projects.filter((p) => p.status === 'active');

  // Counted from the book, never written in: the summary when it answers,
  // otherwise the rows on screen.
  const counts = summary?.inquiryCounts;
  const totalInquiries = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : inquiries.length;
  const answered = counts ? totalInquiries - counts.open : inquiries.filter((i) => i.status !== 'new').length;
  const converted = summary?.projects ?? projects.length;
  const responseRate = totalInquiries ? Math.round((answered / totalInquiries) * 100) : null;
  const conversionRate = totalInquiries ? Math.round((converted / totalInquiries) * 100) : null;
  const agreedValue = projects.reduce((sum, p) => sum + (p.agreedPrice ?? 0), 0);
  const avgRating = summary?.avgRating ?? (reviews.length ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10 : null);
  const reviewCount = summary?.reviewCount ?? reviews.length;

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-6 py-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      description="Inquiries, active projects, services and reviews - in one view."
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Briefcase className="icon-sm" aria-hidden="true" />
            Service Provider
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/provider/services">
              <Store className="mr-2 icon-sm" aria-hidden="true" />
              Manage services
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <DashboardGreeting name={displayName} lead={{ en: dashboardEn('provider_lead'), el: dashboardEl('provider_lead') }} />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <StatCard icon={MessageSquare} label="Open inquiries" value={summary?.openInquiries ?? inquiries.filter((i) => i.status !== 'converted').length} subtext={`${totalInquiries} in all`} href="/provider/inquiries" tone="bg-status-info-bg text-status-info" />
          <StatCard icon={FolderKanban} label="Active projects" value={activeProjects.length} subtext={agreedValue ? `${eur(agreedValue)} agreed in all` : 'Accepted inquiries'} href="/provider/projects" tone="bg-primary/10 text-primary-accessible" />
          <StatCard icon={Store} label="Live services" value={summary?.offers.active ?? services.filter((s) => s.isActive !== false).length} subtext={`${summary?.offers.total ?? services.length} listed`} href="/provider/services" tone="bg-status-success-bg text-status-success" />
          <StatCard icon={Star} label="Rating" value={avgRating == null ? EM_DASH : avgRating.toFixed(1)} subtext={reviewCount ? `From ${reviewCount} reviews` : 'No reviews yet'} href="/provider/reviews" tone="bg-status-warning-bg text-status-warning" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Recent inquiries</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider/inquiries">All inquiries <ChevronRight className="ml-1 icon-sm" aria-hidden="true" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {inquiriesLoading && [0, 1].map((i) => <Skeleton key={i} className="h-16" />)}
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={inquiry.clientAvatar} />
                      <AvatarFallback>{inquiry.clientName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{inquiry.clientName}</span>
                        <Badge variant="outline" className={cn('text-xs', STATUS_TONE[inquiry.status])}>{inquiry.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{inquiry.service}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{inquiry.message}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground"><RelativeTime date={inquiry.receivedAt} format={formatRelativeTime} /></p>
                      <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" asChild>
                        <Link href="/provider/inquiries">Reply</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {!inquiriesLoading && inquiries.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">Founders who ask about a service appear here.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Projects</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider/projects">All projects <ChevronRight className="ml-1 icon-sm" aria-hidden="true" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={project.clientAvatar} />
                      <AvatarFallback>{project.clientName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{project.clientName}</span>
                        <Badge variant="outline" className={cn('text-xs', project.status === 'active' ? 'bg-status-success-bg text-status-success border-status-success-border' : 'bg-status-info-bg text-status-info border-status-info-border')}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{project.service}</p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">{eur(project.agreedPrice, project.currency)}</p>
                  </div>
                ))}
                {!projectsLoading && projects.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">An accepted inquiry becomes a project.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Your services</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider/services">Manage <ChevronRight className="ml-1 icon-sm" aria-hidden="true" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {servicesLoading && [0, 1].map((i) => <Skeleton key={i} className="h-16" />)}
                {services.map((svc) => (
                  <Link key={svc.id} href="/provider/services" className="rounded-lg border border-border/60 p-3 transition-colors hover:border-primary/30 hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-medium">{svc.title}</p>
                      <Badge variant={svc.isActive === false ? 'secondary' : 'success'} className="shrink-0 text-2xs">
                        {svc.isActive === false ? 'Hidden' : 'Live'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{svc.pricing ?? EM_DASH}</p>
                  </Link>
                ))}
                {!servicesLoading && services.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground sm:col-span-2">List a service so founders can find and ask about it.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Go to</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav aria-label="Provider pages" className="flex flex-col">
                  {[
                    { href: '/provider/services', icon: Store, label: 'Services' },
                    { href: '/provider/inquiries', icon: MessageSquare, label: 'Inquiries' },
                    { href: '/provider/projects', icon: FolderKanban, label: 'Projects' },
                    { href: '/provider/reviews', icon: Star, label: 'Reviews' },
                    { href: '/provider/analytics', icon: BarChart3, label: 'Analytics' },
                    { href: '/provider/profile', icon: UserCog, label: 'Provider profile' },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href} className="group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60">
                      <Icon className="icon-sm text-muted-foreground group-hover:text-primary-accessible" aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      <ChevronRight className="icon-sm text-muted-foreground/60" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Answered</span>
                    <span className="font-medium tabular-nums">{responseRate == null ? EM_DASH : `${responseRate}%`}</span>
                  </div>
                  <Progress value={responseRate ?? 0} className="h-2" aria-label="Share of inquiries answered" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Became projects</span>
                    <span className="font-medium tabular-nums">{conversionRate == null ? EM_DASH : `${conversionRate}%`}</span>
                  </div>
                  <Progress value={conversionRate ?? 0} className="h-2" aria-label="Share of inquiries that became projects" />
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="icon-sm" aria-hidden="true" />
                  Counted over {totalInquiries} {totalInquiries === 1 ? 'inquiry' : 'inquiries'}.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Recent reviews</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider/reviews">All <ChevronRight className="ml-1 icon-sm" aria-hidden="true" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">{review.client}</span>
                      <span className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5`}>
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="icon-sm fill-status-warning text-status-warning" aria-hidden="true" />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
                {!reviewsLoading && reviews.length === 0 && (
                  <p className="text-sm text-muted-foreground">Clients rate the work when a project completes.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  MessageCircle,
  Package,
  Settings,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/useSession';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';
import { getMeProfile } from '@/lib/api';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext?: string;
  trend?: { value: number; positive: boolean };
  href?: string;
}) {
  const content = (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            {trend && (
              <p className={cn('text-xs', trend.positive ? 'text-green-500' : 'text-red-500')}>
                {trend.positive ? '+' : ''}{trend.value}% this month
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="icon-md text-primary-emphasis" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function ServiceCard({ service }: { service: any }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50">
      <div className="rounded-lg bg-primary/10 p-2">
        <Package className="icon-md text-primary-emphasis" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{service.name}</p>
          <Badge variant={service.isActive ? 'default' : 'secondary'} size="sm">
            {service.isActive ? 'Active' : 'Draft'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{service.category}</p>
        <div className="flex items-center gap-4 mt-1.5">
          <span className="text-xs text-muted-foreground">{service.bookings} bookings</span>
          <span className="text-xs font-medium text-primary-emphasis">{service.price}</span>
        </div>
      </div>
      <Button aria-label="Settings" variant="ghost" size="icon">
        <Settings className="icon-sm" aria-hidden="true" />
      </Button>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const statusColors: Record<string, string> = {
    'active': 'bg-green-500/10 text-green-600',
    'pending': 'bg-amber-500/10 text-amber-600',
    'completed': 'bg-blue-500/10 text-blue-600',
    'cancelled': 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={project.clientAvatar} />
        <AvatarFallback className="bg-primary/10 text-primary-emphasis">
          {project.clientName?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{project.title}</p>
        <p className="text-xs text-muted-foreground">{project.clientName}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge size="sm" className={cn(statusColors[project.status] || '')}>
          {project.status}
        </Badge>
        <span className="text-sm font-medium">{project.value}</span>
      </div>
    </div>
  );
}

function InquiryCard({ inquiry }: { inquiry: any }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={inquiry.avatarUrl} />
        <AvatarFallback className="bg-amber-500/10 text-amber-600">
          {inquiry.name?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{inquiry.name}</p>
        <p className="text-xs text-muted-foreground">Interested in: {inquiry.service}</p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{inquiry.message}</p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="default">
            Respond
          </Button>
          <Button size="sm" variant="outline">
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={review.avatarUrl} />
          <AvatarFallback className="bg-muted text-xs">
            {review.name?.[0]?.toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium">{review.name}</p>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'icon-sm',
                  i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                )} aria-hidden="true" />
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{review.date}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
    </div>
  );
}

export default function ProviderDashboard() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName || 'Provider';

  const providerStats = showDemoData ? {
    activeServices: 5,
    totalClients: 34,
    activeProjects: 8,
    pendingInquiries: 4,
    monthlyRevenue: '$12,450',
    avgRating: 4.9,
  } : {
    activeServices: 0,
    totalClients: 0,
    activeProjects: 0,
    pendingInquiries: 0,
    monthlyRevenue: '$0',
    avgRating: 0,
  };

  const services = showDemoData ? [
    { id: '1', name: 'Legal Consultation', category: 'Legal', bookings: 23, price: '$150/hr', isActive: true },
    { id: '2', name: 'Pitch Deck Design', category: 'Design', bookings: 18, price: '$500', isActive: true },
    { id: '3', name: 'Financial Modeling', category: 'Finance', bookings: 12, price: '$300', isActive: true },
  ] : [];

  const activeProjects = showDemoData ? [
    { id: '1', title: 'Series A Pitch Deck', clientName: 'TechFlow AI', status: 'active', value: '$1,500', clientAvatar: null },
    { id: '2', title: 'Legal Review', clientName: 'GreenGrid', status: 'pending', value: '$800', clientAvatar: null },
    { id: '3', title: 'Financial Model', clientName: 'HealthSync', status: 'active', value: '$1,200', clientAvatar: null },
  ] : [];

  const pendingInquiries = showDemoData ? [
    { id: '1', name: 'Alex Chen', service: 'Legal Consultation', message: 'Need help with term sheet review for our seed round.', avatarUrl: null },
    { id: '2', name: 'Sarah Kim', service: 'Pitch Deck Design', message: 'Looking for a complete redesign of our investor deck.', avatarUrl: null },
  ] : [];

  const recentReviews = showDemoData ? [
    { id: '1', name: 'Mike Johnson', rating: 5, comment: 'Excellent work on our pitch deck. Highly recommend!', date: '2 days ago', avatarUrl: null },
    { id: '2', name: 'Lisa Wang', rating: 5, comment: 'Very professional and thorough legal review.', date: '1 week ago', avatarUrl: null },
  ] : [];

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {getTimeBasedGreeting()}, {displayName}
            </h1>
            <p className="text-muted-foreground">
              Manage your services and client projects
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Wrench className="icon-sm" aria-hidden="true" />
            Service Provider
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={Package}
            label="Active Services"
            value={providerStats.activeServices}
            href="/marketplace/my-services"
          />
          <StatCard
            icon={Briefcase}
            label="Active Projects"
            value={providerStats.activeProjects}
            subtext={`${providerStats.pendingInquiries} inquiries`}
          />
          <StatCard
            icon={DollarSign}
            label="Monthly Revenue"
            value={providerStats.monthlyRevenue}
            trend={{ value: 23, positive: true }}
          />
          <StatCard
            icon={Star}
            label="Rating"
            value={providerStats.avgRating}
            subtext="Based on 47 reviews"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Inquiries */}
            {pendingInquiries.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="icon-sm text-amber-500" aria-hidden="true" />
                      New Inquiries ({pendingInquiries.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/provider/inquiries">
                        View all <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingInquiries.map((inquiry) => (
                    <InquiryCard key={inquiry.id} inquiry={inquiry} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Projects */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="icon-sm text-primary-emphasis" aria-hidden="true" />
                    Active Projects
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/provider/projects">
                      View all <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                {activeProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active projects
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Your Services */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="icon-sm text-primary-emphasis" aria-hidden="true" />
                    Your Services
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/provider/services">
                      Manage <ArrowRight className="ml-1 icon-sm" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/provider/services">
                    <Package className="mr-2 icon-sm" aria-hidden="true" />
                    Manage Services
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/provider/inquiries">
                    <MessageCircle className="mr-2 icon-sm" aria-hidden="true" />
                    View Inquiries
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/provider/reviews">
                    <Star className="mr-2 icon-sm" aria-hidden="true" />
                    My Reviews
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/provider/analytics">
                    <TrendingUp className="mr-2 icon-sm" aria-hidden="true" />
                    Earnings & Analytics
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/profile/edit">
                    <Settings className="mr-2 icon-sm" aria-hidden="true" />
                    Edit Provider Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="icon-sm" aria-hidden="true" />
                    Recent Reviews
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/provider/reviews">
                    View all reviews
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Response Rate</span>
                    <span className="font-medium">98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="icon-sm" aria-hidden="true" />
                    <span>Top Rated Provider</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

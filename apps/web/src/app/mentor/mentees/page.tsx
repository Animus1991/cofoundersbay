'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  MessageCircle,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import {
  getMyMentorships,
  type MentorshipRelationshipItem,
} from '@/lib/api';

function MenteeCard({ relationship }: { relationship: MentorshipRelationshipItem }) {
  const mentee = relationship.mentee;
  const displayName = mentee?.displayName || 'Unknown';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  const statusColors: Record<string, string> = {
    active: 'bg-status-success-bg text-status-success border-status-success-border',
    paused: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    completed: 'bg-status-info-bg text-status-info border-status-info-border',
    cancelled: 'bg-status-danger-bg text-status-danger border-status-danger-border',
  };

  const nextSessionFormatted = relationship.nextSessionAt
    ? new Date(relationship.nextSessionAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short',
        day: 'numeric' })
    : null;

  const startedAtFormatted = new Date(relationship.startedAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short',
    year: 'numeric' });

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Link href={`/p/${relationship.menteeId}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={mentee?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/p/${relationship.menteeId}`} className="font-medium hover:text-primary-accessible transition-colors">
                  {displayName}
                </Link>
                {mentee?.headline && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {mentee.headline}
                  </p>
                )}
              </div>
              <Badge variant="outline" className={cn('text-xs', statusColors[relationship.status])}>
                {relationship.status}
              </Badge>
            </div>

            {relationship.focusAreas && relationship.focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {relationship.focusAreas.map((area: string) => (
                  <span
                    key={area}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />
                {relationship.totalSessions} sessions
              </span>
              {nextSessionFormatted && (
                <span className="flex items-center gap-1 text-primary-accessible">
                  <Clock className="icon-sm" />
                  Next: {nextSessionFormatted}
                </span>
              )}
              <span className="flex items-center gap-1">
                Started {startedAtFormatted}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                <Link href={`/messages?to=${relationship.menteeId}`}>
                  <MessageCircle className="icon-sm mr-1" />
                  Message
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                <Link href={`/mentor/sessions/new?mentee=${relationship.menteeId}`}>
                  <Calendar className="icon-sm mr-1" />
                  Schedule
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MenteesPage() {
  const { hasSession, mounted } = useSession();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mentorships', 'mentor'],
    queryFn: () => getMyMentorships('mentor'),
    enabled: hasSession && mounted,
  });

  const relationships = data?.relationships || [];
  const activeRelationships = relationships.filter((r) => r.status === 'active');
  const completedRelationships = relationships.filter((r) => r.status === 'completed');
  const pausedRelationships = relationships.filter((r) => r.status === 'paused');

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive-accessible mb-4" />
              <h3 className="font-medium">Failed to load mentees</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="icon-sm mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const totalSessions = relationships.reduce((acc, r) => acc + (r.totalSessions || 0), 0);

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight">Active Mentees</h1>
            <p className="text-muted-foreground">
              Manage your ongoing mentorship relationships
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('icon-sm mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="icon-md text-primary-accessible" />
              </div>
              <div>
                <p className="text-xl font-bold">{activeRelationships.length}</p>
                <p className="text-sm text-muted-foreground">Active Mentees</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-status-success-bg p-2">
                <Target className="icon-md text-status-success" />
              </div>
              <div>
                <p className="text-xl font-bold">{completedRelationships.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-status-info-bg p-2">
                <TrendingUp className="icon-md text-status-info" />
              </div>
              <div>
                <p className="text-xl font-bold">{totalSessions}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Mentees */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Active ({activeRelationships.length})</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="icon-xl animate-spin text-muted-foreground" />
            </div>
          ) : activeRelationships.length > 0 ? (
            activeRelationships.map((relationship) => (
              <MenteeCard key={relationship.id} relationship={relationship} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="font-medium">No active mentees</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Accept mentorship requests to start mentoring
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/mentor/requests">View Requests</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Paused Mentees */}
        {pausedRelationships.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Paused ({pausedRelationships.length})</h2>
            {pausedRelationships.map((relationship) => (
              <MenteeCard key={relationship.id} relationship={relationship} />
            ))}
          </div>
        )}

        {/* Completed Mentees */}
        {completedRelationships.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Completed ({completedRelationships.length})</h2>
            {completedRelationships.map((relationship) => (
              <MenteeCard key={relationship.id} relationship={relationship} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

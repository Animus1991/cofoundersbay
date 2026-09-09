'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Plus,
  CheckCircle2,
  MessageCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import {
  getUpcomingMentorshipSessions,
  type MentorshipSessionItem,
} from '@/lib/api';

function SessionCard({ session }: { session: MentorshipSessionItem }) {
  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-600 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    no_show: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  const meetingIcons: Record<string, React.ElementType> = {
    video: Video,
    in_person: MapPin,
    chat: MessageCircle,
  };

  const MeetingIcon = meetingIcons[session.meetingType || 'video'] || Video;

  const scheduledDate = new Date(session.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg bg-primary/5">
            <span className="text-xs text-muted-foreground uppercase">
              {scheduledDate.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-xl font-bold">{scheduledDate.getDate()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{session.title || 'Mentorship Session'}</p>
                <p className="text-sm text-muted-foreground">
                  {formattedTime}
                </p>
              </div>
              <Badge variant="outline" className={cn('text-xs', statusColors[session.status])}>
                {session.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {session.duration} min
              </span>
              {session.meetingType && (
                <span className="flex items-center gap-1">
                  <MeetingIcon className="h-3.5 w-3.5" />
                  {session.meetingType.replace('_', ' ')}
                </span>
              )}
            </div>

            {session.agenda && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {session.agenda}
              </p>
            )}

            {session.status === 'scheduled' && (
              <div className="flex gap-2 mt-3">
                {session.meetingUrl && (
                  <Button size="sm" variant="default" className="h-7 text-xs" asChild>
                    <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="icon-2xs mr-1" aria-hidden="true" />
                      Join Meeting
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Reschedule
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive">
                  Cancel
                </Button>
              </div>
            )}

            {session.status === 'completed' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                  <Link href={`/mentor/sessions/${session.id}/notes`}>
                    View Notes
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MentorSessionsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { hasSession, mounted } = useSession();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mentorship-sessions-upcoming'],
    queryFn: getUpcomingMentorshipSessions,
    enabled: hasSession && mounted,
  });

  const sessions = data?.sessions || [];
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const pastSessions = sessions.filter((s) => s.status !== 'scheduled');

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" aria-hidden="true" />
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
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" aria-hidden="true" />
              <h3 className="font-medium">Failed to load sessions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="icon-sm mr-2" aria-hidden="true" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground">
              Manage your mentorship sessions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/mentor/sessions/new">
                <Plus className="mr-2 icon-sm" aria-hidden="true" />
                Schedule Session
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Calendar className="icon-md text-blue-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{upcomingSessions.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle2 className="icon-md text-green-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {sessions.filter((s) => s.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="icon-md text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{totalDuration} min</p>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              {upcomingSessions.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {upcomingSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="icon-xl animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium">No upcoming sessions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Schedule a session with one of your mentees
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/mentor/sessions/new">
                      <Plus className="mr-2 icon-sm" aria-hidden="true" />
                      Schedule Session
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="icon-xl animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : pastSessions.length > 0 ? (
              pastSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium">No past sessions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Completed sessions will appear here
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

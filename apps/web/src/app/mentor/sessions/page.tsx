'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { ScheduleSessionDialog, RescheduleSessionDialog, SessionNotesDialog } from '@/components/mentoring/SessionDialogs';
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
  updateMentorshipSession,
  type MentorshipSessionItem,
} from '@/lib/api';

type SessionActions = {
  onReschedule: (s: MentorshipSessionItem) => void;
  onCancel: (s: MentorshipSessionItem) => void;
  onNotes: (s: MentorshipSessionItem) => void;
};

function SessionCard({ session, onReschedule, onCancel, onNotes }: { session: MentorshipSessionItem } & SessionActions) {
  const statusColors: Record<string, string> = {
    scheduled: 'bg-status-info-bg text-status-info border-status-info-border',
    completed: 'bg-status-success-bg text-status-success border-status-success-border',
    cancelled: 'bg-status-danger-bg text-status-danger border-status-danger-border',
    no_show: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  };

  const meetingIcons: Record<string, React.ElementType> = {
    video: Video,
    in_person: MapPin,
    chat: MessageCircle,
  };

  const MeetingIcon = meetingIcons[session.meetingType || 'video'] || Video;

  const scheduledDate = new Date(session.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short',
    day: 'numeric',
    year: 'numeric' });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex min-w-[3.5rem] flex-col items-center justify-center self-start rounded-lg bg-primary/5 p-2">
            <span className="text-xs text-muted-foreground uppercase">
              {scheduledDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' })}
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
                <Clock className="icon-sm" />
                {session.duration} min
              </span>
              {session.meetingType && (
                <span className="flex items-center gap-1">
                  <MeetingIcon className="icon-sm" />
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
              <div className="mt-3 flex flex-wrap gap-2">
                {session.meetingUrl && (
                  <Button size="sm" variant="default" className="h-7 text-xs" asChild>
                    <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="icon-sm mr-1" />
                      Join Meeting
                    </a>
                  </Button>
                )}
                {/* Both had no handler. */}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onReschedule(session)}>
                  Reschedule
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive-accessible" onClick={() => onCancel(session)}>
                  Cancel
                </Button>
              </div>
            )}

            {session.status === 'completed' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onNotes(session)}>
                  View Notes
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
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error: toastError } = useToast();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [menteeHint, setMenteeHint] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<MentorshipSessionItem | null>(null);
  const [notesFor, setNotesFor] = useState<MentorshipSessionItem | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['mentorship-sessions-upcoming'] });

  // /mentor/sessions?new=1&mentee=<id> - how the mentees page asks for a new
  // session with a particular mentee. Read after mount so SSR and hydration
  // agree and no Suspense boundary is needed.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('new') === '1') {
      setMenteeHint(q.get('mentee'));
      setScheduleOpen(true);
    }
  }, []);

  const cancelSession = async (s: MentorshipSessionItem) => {
    const ok = await confirm({
      title: 'Cancel this session?',
      description: 'Your mentee sees it as cancelled. You can schedule a new one at any time.',
      confirmLabel: 'Cancel session',
    });
    if (!ok) return;
    try {
      await updateMentorshipSession(s.id, { status: 'cancelled' });
      success('Session cancelled');
      refresh();
    } catch (e) {
      toastError('Could not cancel the session', e instanceof Error ? e.message : undefined);
    }
  };
  const actions: SessionActions = { onReschedule: setRescheduling, onCancel: (s) => void cancelSession(s), onNotes: setNotesFor };
  const dialogs = (
    <>
      <ScheduleSessionDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        initialMenteeId={menteeHint}
        onScheduled={() => { success('Session scheduled'); refresh(); }}
      />
      <RescheduleSessionDialog
        session={rescheduling}
        onOpenChange={(o) => { if (!o) setRescheduling(null); }}
        onSaved={() => { success('Session rescheduled'); refresh(); }}
      />
      <SessionNotesDialog
        session={notesFor}
        onOpenChange={(o) => { if (!o) setNotesFor(null); }}
        onSaved={() => { success('Notes saved'); refresh(); }}
      />
    </>
  );

  const sessions = data?.sessions || [];
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const pastSessions = sessions.filter((s) => s.status !== 'scheduled');

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
              <h3 className="font-medium">Failed to load sessions</h3>
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

  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <AppShell
      actions={
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn('icon-sm mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={() => setScheduleOpen(true)}>
              <Plus className="mr-2 icon-sm" aria-hidden="true" />
              Schedule Session
            </Button>
          </div>
        </>
      }
    >
      <div className="py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-status-info-bg p-2">
                <Calendar className="icon-md text-status-info" />
              </div>
              <div>
                <p className="text-xl font-bold">{upcomingSessions.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-status-success-bg p-2">
                <CheckCircle2 className="icon-md text-status-success" />
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
                <Clock className="icon-md text-primary-accessible" />
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
                <Loader2 className="icon-xl animate-spin text-muted-foreground" />
              </div>
            ) : upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <SessionCard key={session.id} session={session} {...actions} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium">No upcoming sessions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Schedule a session with one of your mentees
                  </p>
                  <Button className="mt-4" onClick={() => setScheduleOpen(true)}>
                    <Plus className="mr-2 icon-sm" aria-hidden="true" />
                    Schedule Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="icon-xl animate-spin text-muted-foreground" />
              </div>
            ) : pastSessions.length > 0 ? (
              pastSessions.map((session) => (
                <SessionCard key={session.id} session={session} {...actions} />
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
      {dialogs}
    </AppShell>
  );
}

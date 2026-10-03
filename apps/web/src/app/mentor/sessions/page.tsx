'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { qk } from '@/lib/query-keys';
import { CANCELLED, choiceControl, ROW_GONE, rowOptions, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import {
  getMentorshipSessions,
  getMyMentorships,
  getUpcomingMentorshipSessions,
  updateMentorshipSession,
  type MentorshipSessionItem,
} from '@/lib/api';
import { BilingualText } from '@/components/common/BilingualText';

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
    <Card className="transition-all hover:border-primary/30">
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
                      <BilingualText en="Join Meeting" el="Συμμετοχή στη συνάντηση" compact />
                    </a>
                  </Button>
                )}
                {/* Both had no handler. */}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onReschedule(session)}>
                  <BilingualText en="Reschedule" el="Αλλαγή ώρας" compact />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive-accessible" onClick={() => onCancel(session)}>
                  <BilingualText en="Cancel" el="Ακύρωση" compact />
                </Button>
              </div>
            )}

            {session.status === 'completed' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onNotes(session)}>
                  <BilingualText en="View Notes" el="Προβολή σημειώσεων" compact />
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
    queryKey: qk('mentorships', 'sessions-upcoming'),
    queryFn: getUpcomingMentorshipSessions,
    enabled: hasSession && mounted,
  });
  // The upcoming endpoint returns only what is still scheduled, so "Past"
  // and "Completed" could never show anything. Each mentorship's own session
  // list carries its history; the mentees page reads the same relationships.
  const { data: relData } = useQuery({
    queryKey: qk('mentorships', 'mentor'),
    queryFn: () => getMyMentorships('mentor'),
    enabled: hasSession && mounted,
  });
  const historyQueries = useQueries({
    queries: (relData?.relationships ?? []).map((r) => ({
      queryKey: qk('mentorships', 'sessions', r.id),
      queryFn: () => getMentorshipSessions(r.id),
      staleTime: 60_000,
      retry: 0,
    })),
  });
  const history = historyQueries.flatMap((q) => q.data?.sessions ?? []);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error: toastError } = useToast();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [menteeHint, setMenteeHint] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<MentorshipSessionItem | null>(null);
  const [notesFor, setNotesFor] = useState<MentorshipSessionItem | null>(null);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: qk('mentorships', 'sessions-upcoming') });
    void queryClient.invalidateQueries({ queryKey: qk('mentorships', 'sessions') });
  };

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

  const cancelSession = async (s: MentorshipSessionItem): Promise<PageControlRunResult> => {
    const ok = await confirm({
      title: <BilingualText en="Cancel this session?" el="Ακύρωση αυτής της συνεδρίας;" />,
      description: <BilingualText en="Your mentee sees it as cancelled. You can schedule a new one at any time." el="Ο καθοδηγούμενος τη βλέπει ως ακυρωμένη. Μπορείτε να προγραμματίσετε νέα οποτεδήποτε." />,
      confirmLabel: <BilingualText en="Cancel session" el="Ακύρωση συνεδρίας" compact />,
    });
    if (!ok) return CANCELLED;
    try {
      await updateMentorshipSession(s.id, { status: 'cancelled' });
      success('Session cancelled');
      refresh();
    } catch (e) {
      toastError('Could not cancel the session', e instanceof Error ? e.message : undefined);
      return { error: e instanceof Error && e.message ? e.message : 'The session is still booked.' };
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

  const byId = new Map<string, MentorshipSessionItem>();
  for (const x of [...(data?.sessions ?? []), ...history]) byId.set(x.id, x);
  const sessions = [...byId.values()];
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled').sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const pastSessions = sessions.filter((s) => s.status !== 'scheduled').sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  // Offered to the assistant, above the loading and error returns: the tab,
  // Schedule, and each session's reschedule, notes and cancel (which asks).
  const when = (s: MentorshipSessionItem) => `${s.title || 'Session'} · ${s.scheduledAt.slice(0, 16).replace('T', ' ')}`;
  const sessionById = (id?: string) => sessions.find((s) => s.id === id);
  usePageList([
    {
      id: 'sessions',
      labelEn: 'Mentoring sessions',
      labelEl: 'Συνεδρίες καθοδήγησης',
      rows: isLoading ? undefined : (activeTab === 'past' ? pastSessions : upcomingSessions).map((s) => `${when(s)} · ${s.duration} min${s.meetingType ? ` · ${s.meetingType.replace('_', ' ')}` : ''} · ${s.status}`),
      total: sessions.length,
    },
  ]);
  usePageControls([
    choiceControl('session_tab', 'Session filter', 'Φίλτρο συνεδριών', [
      { value: 'upcoming', en: 'Upcoming', el: 'Επερχόμενες' },
      { value: 'past', en: 'Past', el: 'Παρελθούσες' },
    ], activeTab, setActiveTab),
    { id: 'schedule_session', labelEn: 'Open the schedule session form', labelEl: 'Άνοιγμα φόρμας νέας συνεδρίας', writes: false, run: () => setScheduleOpen(true) },
    { id: 'reschedule_session', labelEn: 'Reschedule session', labelEl: 'Αλλαγή ώρας συνεδρίας', writes: false, options: rowOptions(upcomingSessions, (s) => s.id, when), run: (v) => { const s = sessionById(v); if (s) setRescheduling(s); } },
    { id: 'session_notes', labelEn: 'Open session notes', labelEl: 'Άνοιγμα σημειώσεων συνεδρίας', writes: false, options: rowOptions(sessions, (s) => s.id, when), run: (v) => { const s = sessionById(v); if (s) setNotesFor(s); } },
    { id: 'cancel_session', labelEn: 'Cancel session', labelEl: 'Ακύρωση συνεδρίας', writes: true, options: rowOptions(upcomingSessions, (s) => s.id, when), run: (v) => { const s = sessionById(v); return s ? cancelSession(s) : ROW_GONE; } },
  ]);

  if (!mounted) {
    return (
      <AppShell showHelp>
        <div className="py-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="icon-xl animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell showHelp>
        <div className="py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive-accessible mb-4" />
              <h3 className="font-medium"><BilingualText en="Failed to load sessions" el="Δεν ήταν δυνατή η φόρτωση των συνεδριών" compact /></h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="icon-sm mr-2" />
                <BilingualText en="Try Again" el="Δοκιμάστε ξανά" compact />
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <AppShell showHelp
      actions={
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn('icon-sm mr-2', isLoading && 'animate-spin')} />
              <BilingualText en="Refresh" el="Ανανέωση" compact />
            </Button>
            <Button onClick={() => setScheduleOpen(true)}>
              <Plus className="mr-2 icon-sm" aria-hidden="true" />
              <BilingualText en="Schedule Session" el="Προγραμματισμός συνεδρίας" compact />
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-status-info-bg p-2">
                <Calendar className="icon-md text-status-info" />
              </div>
              <div>
                <p className="page-stat text-xl font-bold">{upcomingSessions.length}</p>
                <p className="text-sm text-muted-foreground"><BilingualText en="Upcoming" el="Επερχόμενες" compact /></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-status-success-bg p-2">
                <CheckCircle2 className="icon-md text-status-success" />
              </div>
              <div>
                <p className="page-stat text-xl font-bold">
                  {sessions.filter((s) => s.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground"><BilingualText en="Completed" el="Ολοκληρωμένες" compact /></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="icon-md text-primary-accessible" />
              </div>
              <div>
                <p className="page-stat text-xl font-bold">{totalDuration} min</p>
                <p className="text-sm text-muted-foreground"><BilingualText en="Total Time" el="Συνολικός χρόνος" compact /></p>
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
            <TabsTrigger value="past"><BilingualText en="Past Sessions" el="Παρελθούσες συνεδρίες" compact /></TabsTrigger>
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
                  <h3 className="font-medium"><BilingualText en="No upcoming sessions" el="Δεν υπάρχουν επερχόμενες συνεδρίες" compact /></h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    <BilingualText en="Schedule a session with one of your mentees" el="Προγραμματίστε συνεδρία με έναν μαθητευόμενο" wrap />
                  </p>
                  <Button className="mt-4" onClick={() => setScheduleOpen(true)}>
                    <Plus className="mr-2 icon-sm" aria-hidden="true" />
                    <BilingualText en="Schedule Session" el="Προγραμματισμός συνεδρίας" compact />
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
                  <h3 className="font-medium"><BilingualText en="No past sessions" el="Δεν υπάρχουν παρελθούσες συνεδρίες" compact /></h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    <BilingualText en="Completed sessions will appear here" el="Οι ολοκληρωμένες συνεδρίες θα εμφανίζονται εδώ" wrap />
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

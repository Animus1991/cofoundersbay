'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  BrainCircuit, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle,
  Video, MapPin, MessageCircle, Star, Plus, ChevronRight, Target,
  Users, TrendingUp, ListChecks, ArrowRight, Lightbulb, RefreshCw,
  ClipboardList, Zap, BookOpen,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
type SessionType = 'accountability' | 'clarity' | 'team_dynamics' | 'execution' | 'strategy' | 'wellbeing';

interface CoachingSession {
  id: string;
  coachName: string;
  coachAvatar?: string;
  coachTitle: string;
  sessionType: SessionType;
  status: SessionStatus;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl?: string;
  meetingLocation?: string;
  agenda?: string;
  actionItems?: { task: string; done: boolean }[];
  keyInsights?: string;
  rating?: number;
}

interface CoachProfile {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  specialties: SessionType[];
  sessionCount: number;
  rating: number;
  responseTime: string;
  bio: string;
  pricePerHour?: number;
  availability: string;
  isVerified: boolean;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const DEMO_SESSIONS: CoachingSession[] = [
  {
    id: '1',
    coachName: 'Elena Papadopoulos',
    coachTitle: 'Startup Execution Coach',
    sessionType: 'execution',
    status: 'scheduled',
    title: 'Q1 OKR Review & Sprint Planning',
    scheduledAt: '2026-03-25T10:00:00Z',
    durationMinutes: 60,
    meetingUrl: 'https://meet.example.com/coaching-001',
    agenda: 'Review Q1 OKR progress, identify blockers, plan Q2 sprint priorities',
    actionItems: [
      { task: 'Define 3 key metrics for MVP launch', done: false },
      { task: 'Schedule team standup rhythm', done: true },
      { task: 'Draft investor update email', done: false },
    ],
  },
  {
    id: '2',
    coachName: 'Marcus Chen',
    coachTitle: 'Founder Clarity Coach',
    sessionType: 'clarity',
    status: 'completed',
    title: 'Vision Alignment Session',
    scheduledAt: '2026-03-18T14:00:00Z',
    durationMinutes: 45,
    keyInsights: 'Core tension identified: growth velocity vs. team culture. Decision: prioritize culture first for 60 days.',
    actionItems: [
      { task: 'Write 1-page vision doc', done: true },
      { task: 'Share with co-founder for feedback', done: true },
      { task: 'Book team offsite', done: false },
    ],
    rating: 5,
  },
  {
    id: '3',
    coachName: 'Elena Papadopoulos',
    coachTitle: 'Startup Execution Coach',
    sessionType: 'accountability',
    status: 'completed',
    title: 'Weekly Accountability Check-in',
    scheduledAt: '2026-03-11T10:00:00Z',
    durationMinutes: 30,
    actionItems: [
      { task: 'Launch waitlist page', done: true },
      { task: 'Interview 10 potential users', done: true },
      { task: 'Finalize pricing hypothesis', done: true },
    ],
    rating: 4,
  },
];

const DEMO_COACHES: CoachProfile[] = [
  {
    id: 'c1',
    name: 'Elena Papadopoulos',
    title: 'Startup Execution Coach',
    specialties: ['execution', 'accountability', 'strategy'],
    sessionCount: 142,
    rating: 4.9,
    responseTime: '< 2 hrs',
    bio: 'Ex-operator at 2 scale-ups, 3 exits. Specializes in founder accountability, execution rhythms, and OKR systems for early-stage startups.',
    pricePerHour: 120,
    availability: 'Mon–Fri, 9am–5pm CET',
    isVerified: true,
  },
  {
    id: 'c2',
    name: 'Marcus Chen',
    title: 'Founder Clarity Coach',
    specialties: ['clarity', 'team_dynamics', 'wellbeing'],
    sessionCount: 87,
    rating: 4.8,
    responseTime: '< 4 hrs',
    bio: 'ICF-certified coach with 8 years helping founders navigate clarity, co-founder dynamics, and founder wellbeing under pressure.',
    pricePerHour: 150,
    availability: 'Tue–Thu, flexible',
    isVerified: true,
  },
  {
    id: 'c3',
    name: 'Andreea Ionescu',
    title: 'GTM & Growth Strategy Coach',
    specialties: ['strategy', 'execution'],
    sessionCount: 53,
    rating: 4.7,
    responseTime: '< 8 hrs',
    bio: 'Former VP Marketing at Series B startup. Coaches early-stage founders on go-to-market, positioning, and growth strategy.',
    pricePerHour: 100,
    availability: 'Mon, Wed, Fri',
    isVerified: false,
  },
];

// ── Configs ───────────────────────────────────────────────────────────────────

const SESSION_TYPE_CONFIG: Record<SessionType, { label: string; color: string; icon: React.ElementType }> = {
  accountability: { label: 'Accountability', color: 'bg-status-info-bg text-status-info border-status-info-border', icon: ListChecks },
  clarity:        { label: 'Clarity',        color: 'bg-status-accent-bg text-status-accent border-status-accent-border', icon: Lightbulb },
  team_dynamics:  { label: 'Team Dynamics',  color: 'bg-status-success-bg text-status-success border-status-success-border', icon: Users },
  execution:      { label: 'Execution',      color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: Zap },
  strategy:       { label: 'Strategy',       color: 'bg-status-accent-bg text-status-accent border-status-accent-border', icon: Target },
  wellbeing:      { label: 'Wellbeing',      color: 'bg-status-success-bg text-status-success border-status-success-border', icon: BrainCircuit },
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: React.ElementType }> = {
  scheduled:   { label: 'Scheduled',   color: 'bg-status-info-bg text-status-info',    icon: Calendar },
  in_progress: { label: 'In Progress', color: 'bg-status-warning-bg text-status-warning',  icon: Clock },
  completed:   { label: 'Completed',   color: 'bg-status-success-bg text-status-success', icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',   color: 'bg-muted text-muted-foreground',  icon: XCircle },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: CoachingSession }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[session.status];
  const type = SESSION_TYPE_CONFIG[session.sessionType];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;
  const completedActions = session.actionItems?.filter((a) => a.done).length ?? 0;
  const totalActions = session.actionItems?.length ?? 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            {session.coachAvatar && <AvatarImage src={session.coachAvatar} />}
            <AvatarFallback className="bg-primary/10 text-primary-accessible text-xs font-semibold">
              {session.coachName.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{session.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">with {session.coachName} · {session.coachTitle}</p>
              </div>
              <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0', status.color)}>
                <StatusIcon className="icon-sm" />
                {status.label}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', type.color)}>
                <TypeIcon className="icon-sm" />{type.label}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="icon-sm" />
                {new Date(session.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="icon-sm" />
                {session.durationMinutes} min
              </span>
              {session.meetingUrl && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Video className="icon-sm" /> Video
                </span>
              )}
            </div>

            {/* Action items progress */}
            {totalActions > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ListChecks className="icon-sm" /> Action items
                  </span>
                  <span className="font-medium text-foreground">{completedActions}/{totalActions}</span>
                </div>
                <Progress value={(completedActions / totalActions) * 100} className="h-1.5" />
              </div>
            )}

            {/* Rating */}
            {session.rating && (
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('icon-sm', i < session.rating! ? 'fill-status-warning text-amber-400' : 'text-muted-foreground/30')} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">Your rating</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {session.status === 'scheduled' && session.meetingUrl && (
              <Button size="sm" className="gap-1">
                <Video className="icon-sm" /> Join session
              </Button>
            )}
            {session.status === 'completed' && !session.rating && (
              <Button size="sm" variant="outline" className="gap-1">
                <Star className="icon-sm" /> Rate session
              </Button>
            )}
            <Button size="sm" variant="ghost" className="gap-1">
              <MessageCircle className="icon-sm" /> Message coach
            </Button>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            {expanded ? 'Collapse' : 'Details'}
            <ChevronRight className={cn('icon-sm transition-transform', expanded && 'rotate-90')} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/30 p-4 space-y-3">
          {session.agenda && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Agenda</p>
              <p className="text-xs text-foreground/80">{session.agenda}</p>
            </div>
          )}
          {session.keyInsights && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Key Insights</p>
              <p className="text-xs text-foreground/80 italic">"{session.keyInsights}"</p>
            </div>
          )}
          {session.actionItems && session.actionItems.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Action Items</p>
              <ul className="space-y-1.5">
                {session.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={cn('icon-sm shrink-0', item.done ? 'text-status-success' : 'text-muted-foreground/40')} />
                    <span className={item.done ? 'line-through text-muted-foreground' : 'text-foreground'}>{item.task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoachCard({ coach }: { coach: CoachProfile }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 hover:shadow-sm hover:border-border transition-all">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          {coach.avatar && <AvatarImage src={coach.avatar} />}
          <AvatarFallback className="bg-primary/10 text-primary-accessible text-sm font-semibold">
            {coach.name.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{coach.name}</p>
                {coach.isVerified && (
                  <Badge size="sm" className="rounded-full px-1.5 bg-primary/10 text-primary-accessible border-primary/20">Verified</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{coach.title}</p>
            </div>
            {coach.pricePerHour && (
              <p className="text-sm font-semibold text-foreground shrink-0">${coach.pricePerHour}/hr</p>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{coach.bio}</p>

          <div className="mt-2 flex flex-wrap gap-1">
            {coach.specialties.slice(0, 3).map((s) => {
              const cfg = SESSION_TYPE_CONFIG[s];
              return (
                <span key={s} className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', cfg.color)}>
                  {cfg.label}
                </span>
              );
            })}
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="icon-sm fill-status-warning text-amber-400" /> {coach.rating} ({coach.sessionCount} sessions)
            </span>
            <span className="flex items-center gap-1">
              <Clock className="icon-sm" /> Responds {coach.responseTime}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" className="gap-1 flex-1">
              <Calendar className="icon-sm" /> Book session
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <MessageCircle className="icon-sm" /> Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CoachingPage() {
  const [activeTab, setActiveTab] = useState('sessions');
  const { showDemoData } = useDemoData();
  const sessions = showDemoData ? DEMO_SESSIONS : [];
  const upcoming = sessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress');
  const completed = sessions.filter((s) => s.status === 'completed');
  const totalActionItems = sessions.flatMap((s) => s.actionItems ?? []);
  const completedActions = totalActionItems.filter((a) => a.done).length;

  return (
    <AppShell
      title="Coaching"
      description="Accountability, clarity, and execution coaching for founders and teams"
    >
      <div className="space-y-6 pb-10">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { labelEn: 'Total sessions', labelEl: 'Συνολικές συνεδρίες', value: sessions.length, icon: Calendar, color: 'text-primary-accessible', bg: 'bg-primary/10' },
            { labelEn: 'Upcoming', labelEl: 'Επερχόμενες', value: upcoming.length, icon: Clock, color: 'text-status-info', bg: 'bg-status-info-bg' },
            { labelEn: 'Action items done', labelEl: 'Ολοκληρωμένες ενέργειες', value: `${completedActions}/${totalActionItems.length}`, icon: ListChecks, color: 'text-status-success', bg: 'bg-status-success-bg' },
            { labelEn: 'Avg rating', labelEl: 'Μέση βαθμολογία', value: completed.length ? `${(completed.filter(s => s.rating).reduce((a, s) => a + (s.rating ?? 0), 0) / completed.filter(s => s.rating).length).toFixed(1)}/5` : '—', icon: Star, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
          ].map(({ labelEn, labelEl, value, icon: Icon, color, bg }) => (
            <Card key={labelEn} className="shadow-sm border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg, color)}>
                  <Icon className="icon-sm" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-none">{value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground"><BilingualText en={labelEn} el={labelEl} compact /></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming session banner */}
        {upcoming.length > 0 && (
          <div className="rounded-xl border border-status-info-border bg-status-info-bg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-status-info mb-1"><BilingualText en="Next Session" el="Επόμενη συνεδρία" compact /></p>
                <p className="text-sm font-semibold text-foreground">{upcoming[0].title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  with {upcoming[0].coachName} ·{' '}
                  {new Date(upcoming[0].scheduledAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}{' '}
                  at {new Date(upcoming[0].scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {upcoming[0].meetingUrl && (
                <Button size="sm" className="gap-1.5 shrink-0">
                  <Video className="icon-sm" /> <BilingualText en="Join" el="Σύνδεση" compact />
                </Button>
              )}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-3">
            <TabsList className="h-9">
              <TabsTrigger value="sessions" className="text-xs"><BilingualText en="My Sessions" el="Οι συνεδρίες μου" compact /></TabsTrigger>
              <TabsTrigger value="find" className="text-xs"><BilingualText en="Find a Coach" el="Εύρεση coach" compact /></TabsTrigger>
              <TabsTrigger value="actions" className="text-xs"><BilingualText en="Action Items" el="Ενέργειες" compact /></TabsTrigger>
              <TabsTrigger value="insights" className="text-xs"><BilingualText en="Insights" el="Αναλύσεις" compact /></TabsTrigger>
            </TabsList>
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Plus className="icon-sm" /> <BilingualText en="Book session" el="Κράτηση συνεδρίας" compact />
            </Button>
          </div>

          {/* My Sessions */}
          <TabsContent value="sessions" className="mt-4 space-y-3">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <BrainCircuit className="h-7 w-7 text-primary-accessible" />
                </div>
                <div>
                  <p className="font-medium text-foreground"><BilingualText en="No coaching sessions yet" el="Δεν υπάρχουν συνεδρίες coaching ακόμα" /></p>
                  <p className="mt-1 text-sm text-muted-foreground"><BilingualText en="Book your first session with a coach to get started." el="Κλείστε την πρώτη σας συνεδρία με coach για να ξεκινήσετε." /></p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('find')}><BilingualText en="Find a coach" el="Εύρεση coach" compact /></Button>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"><BilingualText en="Upcoming" el="Επερχόμενες" compact /></p>
                    <div className="space-y-3">{upcoming.map((s) => <SessionCard key={s.id} session={s} />)}</div>
                  </div>
                )}
                {completed.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"><BilingualText en="Completed" el="Ολοκληρωμένες" compact /></p>
                    <div className="space-y-3">{completed.map((s) => <SessionCard key={s.id} session={s} />)}</div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Find a Coach */}
          <TabsContent value="find" className="mt-4 space-y-4">
            {/* Session type filter chips */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SESSION_TYPE_CONFIG) as [SessionType, typeof SESSION_TYPE_CONFIG[SessionType]][]).map(([key, cfg]) => (
                <button key={key} className={cn('flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all hover:opacity-80', cfg.color)}>
                  <cfg.icon className="icon-sm" />{cfg.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {DEMO_COACHES.map((coach) => <CoachCard key={coach.id} coach={coach} />)}
            </div>

            <div className="rounded-xl border border-dashed border-border/60 bg-card/50 p-6 text-center">
              <BookOpen className="icon-xl text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1"><BilingualText en="Become a coach on CoFounderBay" el="Γίνετε coach στο CoFounderBay" /></p>
              <p className="text-xs text-muted-foreground mb-3"><BilingualText en="Share your expertise and earn while helping founders grow." el="Μοιραστείτε την εμπειρογνωμοσύνη σας και κερδίστε βοηθώντας ιδρυτές να αναπτυχθούν." /></p>
              <Button variant="outline" size="sm"><BilingualText en="Apply as coach" el="Αίτηση ως coach" compact /></Button>
            </div>
          </TabsContent>

          {/* Action Items */}
          <TabsContent value="actions" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm"><BilingualText en="All Action Items" el="Όλες οι ενέργειες" compact /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {sessions.flatMap((session) =>
                  (session.actionItems ?? []).map((item, idx) => (
                    <div key={`${session.id}-${idx}`} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
                      <CheckCircle2 className={cn('mt-0.5 icon-sm shrink-0', item.done ? 'text-status-success' : 'text-muted-foreground/30')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', item.done ? 'line-through text-muted-foreground' : 'text-foreground')}>{item.task}</p>
                        <p className="text-2xs text-muted-foreground">From: {session.title}</p>
                      </div>
                      {!item.done && (
                        <Badge variant="outline" className="shrink-0 text-2xs"><BilingualText en="Pending" el="Εκκρεμεί" compact /></Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="icon-sm text-primary-accessible" /> <BilingualText en="Session Themes" el="Θέματα συνεδριών" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(Object.keys(SESSION_TYPE_CONFIG) as SessionType[]).map((type) => {
                    const count = sessions.filter((s) => s.sessionType === type).length;
                    if (!count) return null;
                    const cfg = SESSION_TYPE_CONFIG[type];
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className={cn('rounded-full border px-2 py-0.5 text-2xs w-32', cfg.color)}>{cfg.label}</span>
                        <Progress value={(count / sessions.length) * 100} className="flex-1 h-1.5" />
                        <span className="text-xs text-muted-foreground w-4">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="icon-sm text-status-success" /> <BilingualText en="Execution Rate" el="Ποσοστό εκτέλεσης" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                        <circle
                          cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                          strokeDasharray={`${(completedActions / Math.max(totalActionItems.length, 1)) * 97.4} 97.4`}
                          className="stroke-status-success" strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-foreground">
                          {totalActionItems.length ? Math.round((completedActions / totalActionItems.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground"><BilingualText en="Action completion" el="Ολοκλήρωση ενεργειών" compact /></p>
                      <p className="text-xs text-muted-foreground">{completedActions} of {totalActionItems.length} items done</p>
                      <p className="text-xs text-status-success font-medium"><BilingualText en="Keep the momentum going!" el="Διατηρήστε τη δυναμική!" compact /></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key insight quotes */}
            {sessions.filter((s) => s.keyInsights).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="icon-sm text-status-warning" /> <BilingualText en="Key Insights" el="Βασικές αναλύσεις" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessions.filter((s) => s.keyInsights).map((s) => (
                    <div key={s.id} className="rounded-lg bg-muted/50 px-3 py-2 border-l-2 border-amber-400">
                      <p className="text-xs text-foreground/80 italic">"{s.keyInsights}"</p>
                      <p className="text-2xs text-muted-foreground mt-1">— {s.title}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

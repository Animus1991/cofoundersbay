'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { ventureDimensionEl } from '@/lib/i18n/venture-dimensions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/useSession';
import { useDemoData } from '@/contexts/DemoDataContext';
import { usePublishPageSnapshot } from '@/contexts/PageSnapshotContext';
import { isPreviewDemo } from '@/lib/preview-demo';
import { cn } from '@/lib/utils';
import { STATUS, TREND, type StatusTone } from '@/lib/semantic-colors';
import { queryKeys } from '@/lib/query-keys';
import {
  getDashboardStats,
  getMeProfile,
  getRecommendations,
  listConnectionRequests,
  getVentureReadiness,
  type SearchHit,
} from '@/lib/api';
import {
  fundraisingRoundView,
  fundraisingPipelineStats,
  FUNDRAISING_SEED_LEADS,
} from '@/lib/fundraising-demo';
import {
  OnboardingChecklist,
  buildOnboardingSteps,
  useOnboardingChecklistDismissed,
} from '@/components/gamification/OnboardingChecklist';
import { NextActionBanner, deriveNextAction } from '@/components/gamification/NextActionBanner';
import { VentureReadinessCard } from '@/components/gamification/VentureReadinessCard';
import { BehavioralNudge } from '@/components/behavioral/BehavioralNudge';
import { XPProgressWidget } from '@/components/gamification/XPProgressWidget';
import { BadgesWidget } from '@/components/gamification/BadgesWidget';
import { BilingualText } from '@/components/common/BilingualText';
import { dashboardEn, dashboardEl } from '@/lib/i18n/strings-dashboard';
import { bilingualAria, formatShortDate } from '@/lib/i18n/format';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

function getTimeBasedGreeting(): { en: string; el: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { en: dashboardEn('good_morning'), el: dashboardEl('good_morning') };
  if (hour < 17) return { en: dashboardEn('good_afternoon'), el: dashboardEl('good_afternoon') };
  return { en: dashboardEn('good_evening'), el: dashboardEl('good_evening') };
}

function AskAiButton({
  labelEn,
  labelEl,
  prompt,
  className,
  variant = 'outline',
  size = 'sm',
}: {
  labelEn?: string;
  labelEl?: string;
  /** Lands on `/ai?q=` so the assistant gets the page, not an empty popup. */
  prompt?: string;
  className?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md';
}) {
  const { primary } = useLanguagePreference();
  const visible = primary === 'el'
    ? (labelEl ?? dashboardEl('ask_ai'))
    : (labelEn ?? dashboardEn('ask_ai'));
  const href = prompt ? `/ai?q=${encodeURIComponent(prompt)}` : '/ai';
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn('h-auto min-h-9 gap-1.5 whitespace-nowrap', className)}
    >
      <Link href={href}>
        <CfbGlyph name="spark" className="icon-sm shrink-0" />
        {visible}
      </Link>
    </Button>
  );
}

const PREVIEW_HEADLINE_EL: Record<string, string> = {
  'Founder & CEO at Harbor': 'Ιδρυτής και CEO στο Harbor',
  'Technical cofounder · Full-stack': 'Τεχνικός συνιδρυτής · Full-stack',
  'Startup mentor · Ex-Google · 3x founder': 'Μέντορας νεοφυών · πρώην Google · 3× ιδρυτής',
  'Angel investor · Seed': 'Angel επενδυτής · Seed',
};

// ── Demo data ─────────────────────────────────────────────────────────────────
//
// Dates are derived from "today", not hardcoded. Fixed dates silently rot: the
// previous literals had all passed, so every demo milestone rendered with the
// overdue alert icon and every "upcoming" event claimed to be days away while
// showing a date months in the past.

/** ISO date `offsetDays` from now. */
function isoInDays(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

type DemoMilestone = {
  id: string;
  titleEn: string;
  titleEl: string;
  status: 'in_progress' | 'pending' | 'completed';
  progress: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
};

const DEMO_MILESTONES: DemoMilestone[] = [
  { id: '1', titleEn: 'Complete MVP v1', titleEl: 'Ολοκλήρωση MVP v1', status: 'in_progress', progress: 65, dueDate: isoInDays(24), priority: 'high' },
  { id: '2', titleEn: 'First 100 active users', titleEl: 'Πρώτοι 100 ενεργοί χρήστες', status: 'in_progress', progress: 23, dueDate: isoInDays(40), priority: 'high' },
  { id: '3', titleEn: 'Seed funding round', titleEl: 'Γύρος Seed χρηματοδότησης', status: 'pending', progress: 10, dueDate: isoInDays(100), priority: 'medium' },
  { id: '4', titleEn: 'Build founding team', titleEl: 'Συγκρότηση ιδρυτικής ομάδας', status: 'pending', progress: 0, dueDate: isoInDays(39), priority: 'high' },
];

const DEMO_ACTIVITY = [
  { id: '1', href: '/matches', glyph: 'spark' as const, textEn: 'New 87% match — Nikos Papadakis, CTO', textEl: 'Νέα αντιστοίχιση 87% — Νίκος Παπαδάκης, CTO', timeEn: '2h ago', timeEl: 'πριν 2 ώρες' },
  { id: '2', href: '/connections', glyph: 'people' as const, textEn: 'Elena Papadopoulos accepted your request', textEl: 'Η Έλενα Παπαδοπούλου αποδέχτηκε το αίτημά σας', timeEn: '5h ago', timeEl: 'πριν 5 ώρες' },
  { id: '3', href: '/messages', glyph: 'messages' as const, textEn: 'New message from Marcus Chen', textEl: 'Νέο μήνυμα από τον Marcus Chen', timeEn: '8h ago', timeEl: 'πριν 8 ώρες' },
  { id: '4', href: '/analytics', glyph: 'profile' as const, textEn: 'Your profile was viewed 12 times today', textEl: 'Το προφίλ σας προβλήθηκε 12 φορές σήμερα', timeEn: '1d ago', timeEl: 'πριν 1 ημέρα' },
];

type EventType = 'mentorship' | 'deadline' | 'event' | 'pitch';
const EVENT_CONFIG: Record<EventType, StatusTone> = {
  mentorship: 'accent',
  deadline: 'danger',
  event: 'info',
  pitch: 'success',
};

// daysLeft is derived from the date so the two can never disagree.
const DEMO_EVENTS = (
  [
    { id: '1', titleEn: 'Mentor Session — Dr. Sarah Chen', titleEl: 'Συνεδρία μέντορα — Dr. Sarah Chen', type: 'mentorship' as EventType, time: '14:00', daysLeft: 2 },
    { id: '2', titleEn: 'Pitch Deck Deadline', titleEl: 'Προθεσμία pitch deck', type: 'deadline' as EventType, time: '23:59', daysLeft: 4 },
    { id: '3', titleEn: 'Startup Networking Mixer', titleEl: 'Networking mixer νεοφυών', type: 'event' as EventType, time: '18:00', daysLeft: 9 },
    { id: '4', titleEn: 'Investor Demo Day', titleEl: 'Demo Day επενδυτών', type: 'pitch' as EventType, time: '10:00', daysLeft: 17 },
  ]
).map((e) => ({ ...e, date: isoInDays(e.daysLeft) }));

const QUICK_ACTIONS: { href: string; glyph: CfbGlyphName; labelEn: string; labelEl: string }[] = [
  { href: '/ai', glyph: 'spark', labelEn: 'Ask AI', labelEl: 'Ρώτα το AI' },
  { href: '/discover', glyph: 'discover', labelEn: 'Find co-founders', labelEl: 'Εύρεση συνιδρυτών' },
  { href: '/mentoring', glyph: 'mentor', labelEn: 'Find mentors', labelEl: 'Εύρεση μεντόρων' },
  { href: '/coaching', glyph: 'mentor', labelEn: 'Coaching', labelEl: 'Καθοδήγηση' },
  { href: '/expert-reviews', glyph: 'award', labelEn: 'Expert review', labelEl: 'Αξιολόγηση ειδικού' },
  { href: '/opportunities', glyph: 'target', labelEn: 'Opportunities', labelEl: 'Ευκαιρίες' },
  { href: '/programs', glyph: 'award', labelEn: 'Programs', labelEl: 'Προγράμματα' },
  { href: '/marketplace', glyph: 'briefcase', labelEn: 'Services', labelEl: 'Υπηρεσίες' },
  { href: '/analytics', glyph: 'chart', labelEn: 'Analytics', labelEl: 'Αναλυτικά' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  glyph, label, value, trend, href, caption, captionEl,
}: {
  glyph: CfbGlyphName; label: ReactNode; value: number | string;
  trend?: { value: number; positive: boolean }; href?: string;
  caption?: string; captionEl?: string;
}) {
  const content = (
    <Card className="relative h-full min-w-0 overflow-hidden transition-colors group-hover:border-border">
      {/* Equal anatomy: every tile has a figure and a footer band of the same
          height. Trend cards keep their week-over-week line; the other two
          get a real caption (inbox state, next due date) — not a fake sparkline
          and not a centred void. `mt-auto` pins that band to the bottom so a
          short caption still sits where the trend sits. */}
      <CardContent className="flex h-full flex-col p-4 sm:p-5">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">{label}</p>
            <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</p>
          </div>
          <CfbGlyph name={glyph} className="icon-sm shrink-0 text-muted-foreground/70" />
        </div>
        <div className="mt-auto min-h-[2.75rem] pt-2">
          {trend ? (
            <div className="space-y-0.5">
              <p className={cn('text-[11px] font-medium tabular-nums leading-snug sm:text-xs', trend.positive ? TREND.up : TREND.down)}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
              <p className="text-[11px] font-normal leading-snug text-muted-foreground sm:text-xs">
                <BilingualText en={dashboardEn('this_week')} el={dashboardEl('this_week')} stacked wrap />
              </p>
            </div>
          ) : caption ? (
            <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
              <BilingualText en={caption} el={captionEl ?? caption} stacked wrap />
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link
      href={href}
      className="group block min-w-0 w-full rounded-2xl focus-visible:outline-none"
    >
      {content}
    </Link>
  ) : content;
}

function AttentionChips({
  items,
}: {
  items: { href: string; glyph: CfbGlyphName; en: string; el: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <ul className="flex min-w-0 flex-wrap gap-2">
      {items.map((item) => (
        <li key={`${item.href}:${item.en}`} className="min-w-0">
          <Link
            href={item.href}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/50"
          >
            <CfbGlyph name={item.glyph} className="icon-sm shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate">
              <BilingualText en={item.en} el={item.el} compact />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MatchPreviewCard({ match }: { match: SearchHit }) {
  const score = match.matchScore ?? 0;
  const scoreColor = score >= 85 ? STATUS.success.icon : score >= 70 ? STATUS.info.icon : STATUS.warning.icon;
  return (
    <Link href={`/matches/${match.userId}`} className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 transition-colors hover:border-border hover:bg-muted/30">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={match.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
          {match.displayName?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{match.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {match.headline && PREVIEW_HEADLINE_EL[match.headline]
            ? <BilingualText en={match.headline} el={PREVIEW_HEADLINE_EL[match.headline]} compact />
            : match.headline}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={cn('flex items-center gap-0.5 text-sm font-bold tabular-nums', scoreColor)}>
          <CfbGlyph name="spark" className="icon-sm" />{score}%
        </span>
        <ChevronRight className="icon-sm hidden text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
      </div>
    </Link>
  );
}

function MilestoneRow({ milestone }: { milestone: DemoMilestone }) {
  const isComplete = milestone.status === 'completed';
  const isOverdue = !!milestone.dueDate && new Date(milestone.dueDate) < new Date() && !isComplete;
  const stateLabel = isComplete
    ? bilingualAria('Completed', 'Ολοκληρωμένο')
    : isOverdue
    ? bilingualAria('Overdue', 'Εκπρόθεσμο')
    : bilingualAria('In progress', 'Σε εξέλιξη');
  return (
    <Link
      href="/milestones"
      className="flex items-center gap-3 rounded-2xl p-1 -mx-1 transition-colors hover:bg-muted/40"
    >
      <div
        className="mt-0.5 shrink-0 text-muted-foreground"
        role="img"
        aria-label={stateLabel}
        title={stateLabel}
      >
        {isComplete
          ? <CheckCircle2 className={cn('icon-sm', STATUS.success.icon)} aria-hidden="true" />
          : isOverdue
          ? <AlertCircle className={cn('icon-sm', STATUS.danger.icon)} aria-hidden="true" />
          : <Circle className="icon-sm text-muted-foreground" aria-hidden="true" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            <BilingualText en={milestone.titleEn} el={milestone.titleEl} compact wrap />
          </p>
          {/* 'warning', not 'destructive': high priority is not an error state, and
              reserving red for overdue/failure keeps the colour meaningful.
              The word 'priority' is spelled out — a bare 'High' next to a
              percentage was ambiguous. */}
          {milestone.priority === 'high' && (
            <Badge variant="warning" size="sm" className="shrink-0">
              <BilingualText en="High priority" el="Υψηλή προτεραιότητα" compact />
            </Badge>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Progress value={milestone.progress} label={milestone.titleEn} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0 w-9 text-right tabular-nums">{milestone.progress}%</span>
        </div>
        <p className={cn('text-xs mt-1', isOverdue ? STATUS.danger.text : 'text-muted-foreground')}>
          <BilingualText
            en={`Due ${formatShortDate(milestone.dueDate, 'en')}`}
            el={`Λήξη ${formatShortDate(milestone.dueDate, 'el')}`}
            compact
          />
        </p>
      </div>
    </Link>
  );
}

export default function FounderDashboardContent() {
  const { hasSession, mounted } = useSession();
  const { showDemoData } = useDemoData();
  const { messages: unreadMessages } = useUnreadCounts();

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: hasSession && mounted,
  });

  const { data: recommendations } = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: () => getRecommendations({ limit: 5 }),
    enabled: hasSession && mounted,
  });

  const { data: connectionRequests } = useQuery({
    queryKey: queryKeys.connections.pendingReceived(),
    queryFn: () => listConnectionRequests({ type: 'received', limit: 50 }),
    enabled: hasSession && mounted,
  });

  const { data: vrs } = useQuery({
    queryKey: ['venture-readiness'],
    queryFn: getVentureReadiness,
    enabled: hasSession && mounted,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = profile?.profile?.displayName || 'Founder';
  const pendingRequests = connectionRequests?.connections?.filter((r: { status?: string }) => r.status === 'pending')?.length ?? 0;
  const profilePct = profile?.hasCompletedOnboarding ? 100 : 52;
  const founderProgress = vrs?.overall ?? 0;
  const fundRound = fundraisingRoundView(FUNDRAISING_SEED_LEADS);
  const fundStats = fundraisingPipelineStats(FUNDRAISING_SEED_LEADS);
  const fundingPct = Math.round((fundRound.raised / fundRound.target) * 100);
  const greeting = getTimeBasedGreeting();
  const completedMilestoneCount = DEMO_MILESTONES.filter((m) => m.status === 'completed' || m.progress >= 100).length;
  const openMilestones = DEMO_MILESTONES.filter((m) => m.status !== 'completed' && m.progress < 100);
  const nextOpenMilestone = [...openMilestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const messageCaption = unreadMessages === 0
    ? { en: dashboardEn('inbox_clear'), el: dashboardEl('inbox_clear') }
    : unreadMessages === 1
      ? { en: '1 waiting', el: '1 σε αναμονή' }
      : { en: `${unreadMessages} waiting`, el: `${unreadMessages} σε αναμονή` };
  const milestoneCaption = DEMO_MILESTONES.length === 0
    ? { en: dashboardEn('add_first_milestone'), el: dashboardEl('add_first_milestone') }
    : completedMilestoneCount === DEMO_MILESTONES.length
      ? { en: dashboardEn('milestones_all_complete'), el: dashboardEl('milestones_all_complete') }
      : nextOpenMilestone
        ? {
            en: `${openMilestones.length} open · ${formatShortDate(nextOpenMilestone.dueDate, 'en')}`,
            el: `${openMilestones.length} ανοιχτά · ${formatShortDate(nextOpenMilestone.dueDate, 'el')}`,
          }
        : {
            en: `${openMilestones.length} open`,
            el: `${openMilestones.length} ανοιχτά`,
          };
  const attentionItems: { href: string; glyph: CfbGlyphName; en: string; el: string }[] = [];
  if (unreadMessages > 0) {
    attentionItems.push({
      href: '/messages',
      glyph: 'messages',
      en: unreadMessages === 1 ? '1 unread message' : `${unreadMessages} unread messages`,
      el: unreadMessages === 1 ? '1 αδιάβαστο μήνυμα' : `${unreadMessages} αδιάβαστα μηνύματα`,
    });
  }
  if (pendingRequests > 0) {
    attentionItems.push({
      href: '/connections?tab=requests',
      glyph: 'people',
      en: pendingRequests === 1 ? '1 intro waiting' : `${pendingRequests} intros waiting`,
      el: pendingRequests === 1 ? '1 γνωριμία σε αναμονή' : `${pendingRequests} γνωριμίες σε αναμονή`,
    });
  }
  if (nextOpenMilestone) {
    attentionItems.push({
      href: '/milestones',
      glyph: 'flag',
      en: `Next: ${nextOpenMilestone.titleEn}`,
      el: `Επόμενο: ${nextOpenMilestone.titleEl}`,
    });
  }
  if (vrs?.lowestDimension?.href && typeof vrs.lowestDimension.score === 'number' && vrs.lowestDimension.score < 55) {
    attentionItems.push({
      href: vrs.lowestDimension.href,
      glyph: 'chart',
      // "Ανύψωση" was a literal rendering of "Lift" that means physically
      // raising something. The colon form also matches the milestone chip
      // beside it ("Επόμενο: …") and sidesteps declining the dimension name.
      en: `Lift ${vrs.lowestDimension.label} (${vrs.lowestDimension.score}%)`,
      el: `Βελτιώστε: ${ventureDimensionEl(vrs.lowestDimension.key, vrs.lowestDimension.label)} (${vrs.lowestDimension.score}%)`,
    });
  }

  /**
   * The dashboard's own figures, for the assistant.
   *
   * This is the screen a founder opens on, so it is the one where "what should
   * I do next?" is asked most — and the one where the assistant previously had
   * to answer from the route name alone.
   */
  usePublishPageSnapshot('/dashboard/founder', {
    title: 'Founder dashboard',
    state: !mounted ? 'loading' : isPreviewDemo() ? 'demo' : 'ready',
    summary: `${displayName}'s dashboard: profile, readiness, connections and the current round.`,
    figures: {
      'Profile completeness': `${profilePct}%`,
      'Founder progress': `${founderProgress}%`,
      'Pending intros': pendingRequests,
      'Unread messages': unreadMessages,
      'Recommended matches': recommendations?.suggestions?.length ?? 0,
      'Milestones complete': `${completedMilestoneCount}/${DEMO_MILESTONES.length}`,
      'Next milestone': nextOpenMilestone?.titleEn ?? 'none',
      'Round progress': `${fundingPct}%`,
      'Committed investors': fundStats.committed,
    },
    actions: ['navigate', 'shortlist_add', 'send_connection', 'start_or_send_message'],
  });

  const onboardingSteps = buildOnboardingSteps({
    hasProfile:      !!(profile?.profile?.displayName && profile?.profile?.headline),
    hasPreferences:  !!((profile?.profile as { lookingFor?: unknown[] } | undefined)?.lookingFor && ((profile?.profile as { lookingFor?: unknown[] }).lookingFor as unknown[])?.length > 0),
    hasConnection:   (vrs?.signals?.connectionCount ?? 0) > 0,
    hasBoard:        (vrs?.signals?.boardCount ?? 0) > 0,
    hasArtifact:     (vrs?.signals?.docCount ?? 0) > 0,
  });

  const checklistDismissed = useOnboardingChecklistDismissed();
  const checklistDone = onboardingSteps.every((s) => s.done);

  const nextAction = deriveNextAction({
    hasProfile:      !!(profile?.profile?.displayName && profile?.profile?.headline),
    hasPreferences:  !!((profile?.profile as { lookingFor?: unknown[] } | undefined)?.lookingFor && ((profile?.profile as { lookingFor?: unknown[] }).lookingFor as unknown[])?.length > 0),
    connectionCount: vrs?.signals?.connectionCount ?? 0,
    boardCount:      vrs?.signals?.boardCount ?? 0,
    docCount:        vrs?.signals?.docCount ?? 0,
    vrsLowestKey:    vrs?.lowestDimension?.key,
    pendingRequests,
    unreadMessages,
  });

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="min-w-0 h-24" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      showHelp
      // One Ask AI in the header, not three. AppShell renders its own whenever the
      // page has a title, and this page was additionally passing an AIInsightButton
      // and an AskAiButton through `actions` — on a 360px screen that stacked into
      // three near-identical buttons. Handing AppShell the specific prompt keeps the
      // most useful of the three in the standard position; the prompt-less "open the
      // assistant" affordance is unchanged and still reachable from the chat bubble.
      askAi="Summarize my founder graph and tell me the next action: intros, matches, messages, or profile gaps."
      actions={
        <>
          <Badge variant="outline" className="gap-1.5">
            <CfbGlyph name="builder" className="icon-sm" /> <BilingualText en="Founder" el="Ιδρυτής" compact />
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/readiness">
              <CfbGlyph name="chart" className="icon-sm" />
              <BilingualText en={`Progress: ${founderProgress}%`} el={`Πρόοδος: ${founderProgress}%`} compact />
            </Link>
          </Button>
        </>
      }
    >
      <div className="min-w-0 space-y-6 overflow-x-clip">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <BilingualText
              en={`${greeting.en}, ${displayName}. ${dashboardEn('greeting_lead')}`}
              el={`${greeting.el}, ${displayName}. ${dashboardEl('greeting_lead')}`}
              stacked
              wrap
              secondaryFrom="lg"
            />
          </p>
          <Button asChild variant="ghost" size="sm" className="h-8 shrink-0 gap-1.5 self-start px-2.5 text-xs text-muted-foreground hover:text-foreground">
            <Link href={`/ai?q=${encodeURIComponent('Brief me on this founder dashboard: what needs attention this week, and what should I do next?')}`}>
              <CfbGlyph name="spark" className="icon-sm" />
              <BilingualText en={dashboardEn('ask_ai_briefing')} el={dashboardEl('ask_ai_briefing')} compact />
            </Link>
          </Button>
        </div>

        {/* Getting-started checklist. */}
        <OnboardingChecklist steps={onboardingSteps} />

        {/* One "what to do next" prompt at a time.
            The checklist already names the next incomplete step and links to it,
            so a NextActionBanner above it was a second copy of the same advice.
            Once the checklist is finished or dismissed the banner takes over, so
            the guidance is never lost. `undefined` means localStorage has not
            been read yet — render nothing rather than flash the banner. */}
        {nextAction && (checklistDone || checklistDismissed === true) && (
          <NextActionBanner action={nextAction} />
        )}

        {/* Stats */}
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard glyph="profile" label={<BilingualText en={dashboardEn('profile_views')} el={dashboardEl('profile_views')} stacked wrap />} value={stats?.activeProfiles ?? 48} trend={{ value: 12, positive: true }} href="/analytics" />
          <StatCard glyph="matches" label={<BilingualText en={dashboardEn('top_matches')} el={dashboardEl('top_matches')} stacked wrap />} value={stats?.matchesThisWeek ?? 7} trend={{ value: 3, positive: true }} href="/matches" />
          <StatCard
            glyph="messages"
            label={<BilingualText en={dashboardEn('unread_messages')} el={dashboardEl('unread_messages')} stacked wrap />}
            value={unreadMessages}
            href="/messages"
            caption={messageCaption.en}
            captionEl={messageCaption.el}
          />
          <StatCard
            glyph="flag"
            label={<BilingualText en={dashboardEn('milestones')} el={dashboardEl('milestones')} stacked wrap />}
            value={`${completedMilestoneCount}/${DEMO_MILESTONES.length}`}
            href="/milestones"
            caption={milestoneCaption.en}
            captionEl={milestoneCaption.el}
          />
        </div>

        <AttentionChips items={attentionItems} />

        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="min-w-0 space-y-6 lg:col-span-2">

            {/* Readiness — single home.
                This previously rendered VentureReadinessCard *and* a second
                "Startup Readiness" card built from the same `vrs` payload: same
                score, same dimensions, one just showed fewer of them and did not
                link them. The three navigation actions that were unique to the
                second card now sit in this card's footer, so nothing is lost. */}
            {vrs && (
              <VentureReadinessCard
                data={vrs}
                footer={
                  <div className="space-y-2.5">
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <Button variant="outline" size="md" className="w-full gap-1.5" asChild>
                        <Link href="/readiness" className="w-full">
                          <CfbGlyph name="chart" className="icon-sm" />
                          <BilingualText en="Full report" el="Πλήρης αναφορά" compact wrap />
                        </Link>
                      </Button>
                      <Button variant="outline" size="md" className="w-full gap-1.5" asChild>
                        <Link href="/builder" className="w-full">
                          <CfbGlyph name="builder" className="icon-sm" />
                          <BilingualText en="Open Builder" el="Άνοιγμα Builder" compact wrap />
                        </Link>
                      </Button>
                      <Button variant="outline" size="md" className="w-full gap-1.5" asChild>
                        <Link href="/expert-reviews" className="w-full">
                          <CfbGlyph name="award" className="icon-sm" />
                          <BilingualText en="Get Expert Review" el="Αξιολόγηση ειδικού" compact wrap />
                        </Link>
                      </Button>
                    </div>
                    <AskAiButton
                      variant="ghost"
                      className="w-full"
                      prompt="What should I improve next on venture readiness, given the lowest dimension on this dashboard?"
                      labelEn={dashboardEn('ask_ai_readiness')}
                      labelEl={dashboardEl('ask_ai_readiness')}
                    />
                  </div>
                }
              />
            )}

            {/* Fundraising widget */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CfbGlyph name="wallet" className="icon-sm text-primary-accessible" />
                    <BilingualText en={dashboardEn('fundraising')} el={dashboardEl('fundraising')} />
                  </CardTitle>
                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
                    <AskAiButton
                      variant="ghost"
                      className="min-h-8 px-2.5"
                      prompt="Review this fundraising round against my readiness and tell me the next investor action."
                      labelEn={dashboardEn('ask_ai_fundraising')}
                      labelEl={dashboardEl('ask_ai_fundraising')}
                    />
                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                      <Link href="/fundraising">
                        <BilingualText en={dashboardEn('open_tracker')} el={dashboardEl('open_tracker')} compact />
                        <ArrowRight className="icon-sm" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-[11px] text-muted-foreground">
                    <BilingualText
                      en="Sample pipeline — live tracker is on Fundraising."
                      el="Δείγμα pipeline — η ζωντανή παρακολούθηση είναι στη Χρηματοδότηση."
                      compact
                      wrap
                    />
                  </p>
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {fundRound.name}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {fundRound.currency}{(fundRound.raised / 1000).toFixed(0)}K
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {fundRound.currency}{(fundRound.target / 1000).toFixed(0)}K
                        </span>
                      </p>
                    </div>
                    <span className={cn(
                      'shrink-0 text-sm font-bold',
                      fundingPct >= 75 ? STATUS.success.icon : fundingPct >= 40 ? STATUS.warning.icon : 'text-muted-foreground'
                    )}>
                      {fundingPct}%
                    </span>
                  </div>
                  <Progress value={fundingPct} label="Round progress" className="h-2.5" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CfbGlyph name="people" className="icon-sm" />
                      {fundStats.total}{' '}
                      <BilingualText en={dashboardEn('leads_tracked')} el={dashboardEl('leads_tracked')} compact />
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className={cn('icon-sm', STATUS.success.icon)} />
                      {fundStats.committed}{' '}
                      <BilingualText en={dashboardEn('committed_count')} el={dashboardEl('committed_count')} compact />
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <Button variant="outline" size="md" className="w-full gap-1.5" asChild>
                      <Link href="/fundraising" className="flex-1">
                        <CfbGlyph name="wallet" className="icon-sm" />
                        <BilingualText en={dashboardEn('manage_pipeline')} el={dashboardEl('manage_pipeline')} compact />
                      </Link>
                    </Button>
                    <Button variant="outline" size="md" className="w-full gap-1.5" asChild>
                      <Link href="/investors" className="flex-1">
                        <CfbGlyph name="discover" className="icon-sm" />
                        <BilingualText en={dashboardEn('find_investors')} el={dashboardEl('find_investors')} compact />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Matches */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CfbGlyph name="matches" className="icon-sm text-primary-accessible" />
                    <BilingualText en={dashboardEn('top_matches')} el={dashboardEl('top_matches')} />
                  </CardTitle>
                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
                    <AskAiButton
                      variant="ghost"
                      className="min-h-8 px-2.5"
                      prompt="How can I improve these matches and who should I reach out to first?"
                      labelEn={dashboardEn('ask_ai_matches')}
                      labelEl={dashboardEl('ask_ai_matches')}
                    />
                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                      <Link href="/matches">
                        <BilingualText en={dashboardEn('view_all')} el={dashboardEl('view_all')} compact />
                        <ArrowRight className="icon-sm" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {recommendations?.suggestions?.slice(0, 4).map((match: SearchHit) => (
                  <MatchPreviewCard key={match.userId} match={match} />
                ))}
                {(!recommendations?.suggestions || recommendations.suggestions.length === 0) && (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
                    <CfbGlyph name="matches" className="mx-auto mb-3 icon-lg text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      <BilingualText
                        en={dashboardEn('complete_profile_for_matches')}
                        el={dashboardEl('complete_profile_for_matches')}
                      />
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <Link href="/profile/edit">
                          <CfbGlyph name="profile" className="icon-sm" />
                          <BilingualText en={dashboardEn('complete_profile')} el={dashboardEl('complete_profile')} compact />
                        </Link>
                      </Button>
                      <AskAiButton
                        variant="ghost"
                        prompt="How can I start receiving better matches from this profile?"
                        labelEn={dashboardEn('ask_ai_matches')}
                        labelEl={dashboardEl('ask_ai_matches')}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CfbGlyph name="flag" className="icon-sm text-primary-accessible" />
                    <BilingualText en={dashboardEn('milestones')} el={dashboardEl('milestones')} />
                  </CardTitle>
                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
                    <AskAiButton
                      variant="ghost"
                      className="min-h-8 px-2.5"
                      prompt="How do I hit these milestone dates, and what should I sequence first?"
                      labelEn={dashboardEn('ask_ai_milestones')}
                      labelEl={dashboardEl('ask_ai_milestones')}
                    />
                    <Button variant="ghost" size="sm" className="gap-1" asChild>
                      <Link href="/milestones">
                        <BilingualText en={dashboardEn('manage')} el={dashboardEl('manage')} compact />
                        <ArrowRight className="icon-sm" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[11px] leading-snug text-muted-foreground">
                  <BilingualText
                    en="Sample timeline — manage live items on Milestones."
                    el="Δείγμα χρονοδιαγράμματος — διαχειριστείτε τα πραγματικά στα Ορόσημα."
                    compact
                    wrap
                  />
                </p>
                {DEMO_MILESTONES.map((m) => <MilestoneRow key={m.id} milestone={m} />)}
              </CardContent>
            </Card>
            {/* Profile strength — moved here from the sidebar.
                The two columns were 1663px and 2169px, so the wider,
                more important one ended 506px early and the page had a
                void down its left side. This card is the one sidebar
                item that is a task rather than a readout, so it is the
                one that belongs in the main column; moving it leaves the
                columns within ~25px of each other and keeps XP and
                Badges together where they belong. */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CfbGlyph name="shield" className="icon-sm text-primary-accessible" />
                  <BilingualText en={dashboardEn('profile_strength')} el={dashboardEl('profile_strength')} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <BilingualText en={dashboardEn('completion')} el={dashboardEl('completion')} compact />
                  </span>
                  <span className={cn('font-bold', profilePct >= 80 ? STATUS.success.icon : STATUS.warning.icon)}>{profilePct}%</span>
                </div>
                <Progress value={profilePct} label="Profile completeness" className="h-2" />
                {/* Two columns from `sm`: this card moved out of the 381px
                    sidebar into the 786px main column, where four checklist
                    rows stacked single-file would be four short lines with
                    half the card empty beside them. */}
                <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 sm:space-y-0">
                  {[
                    { labelEn: 'Photo & headline', labelEl: 'Φωτογραφία & τίτλος', done: true },
                    { labelEn: 'Skills (5+)', labelEl: 'Δεξιότητες (5+)', done: profilePct > 50 },
                    { labelEn: 'Work experience', labelEl: 'Εργασιακή εμπειρία', done: profilePct > 70 },
                    { labelEn: 'Startup idea linked', labelEl: 'Σύνδεση ιδέας νεοφυούς', done: profilePct > 80 },
                  ].map((item) => (
                    <div key={item.labelEn} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={cn('icon-sm shrink-0', item.done ? STATUS.success.icon : 'text-muted-foreground/30')} />
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                        <BilingualText en={item.labelEn} el={item.labelEl} compact />
                      </span>
                    </div>
                  ))}
                </div>
                {profilePct < 100 ? (
                  <Button variant="secondary" size="md" className="w-full gap-1.5" asChild>
                    <Link href="/profile/edit">
                      <CfbGlyph name="profile" className="icon-sm" />
                      <BilingualText en={dashboardEn('fill_remaining_profile')} el={dashboardEl('fill_remaining_profile')} compact />
                    </Link>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 sm:flex-1" asChild>
                      <Link href="/profile">
                        <CfbGlyph name="profile" className="icon-sm" />
                        <BilingualText en={dashboardEn('keep_current')} el={dashboardEl('keep_current')} compact />
                      </Link>
                    </Button>
                    <AskAiButton
                      variant="ghost"
                      className="w-full sm:flex-1"
                      prompt="Review my founder profile and suggest what would make it stronger for investors and co-founders."
                      labelEn={dashboardEn('ask_ai_profile')}
                      labelEl={dashboardEl('ask_ai_profile')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-6">

            {/* Behavioral Nudge */}
            <BehavioralNudge surface="dashboard" />

            {/* XP Progress Widget */}
            <XPProgressWidget />

            {/* Badges Widget */}
            <BadgesWidget />

            {/* Quick Actions Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  <BilingualText en={dashboardEn('quick_actions')} el={dashboardEl('quick_actions')} />
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                {/* List, not a 3×3 app-icon grid: the nine destinations stay,
                    the bordered tiles were the noisiest block on the rail.
                    Ask AI is visually first so the control surface is obvious. */}
                <div className="flex flex-col">
                  {QUICK_ACTIONS.map(({ href, glyph, labelEn, labelEl }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex min-h-9 min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/50',
                        href === '/ai' && 'bg-primary/[0.04] font-medium',
                      )}
                    >
                      <CfbGlyph
                        name={glyph}
                        className={cn('icon-sm shrink-0', href === '/ai' ? 'text-primary-accessible' : 'text-muted-foreground')}
                      />
                      <span className="min-w-0 leading-snug">
                        <BilingualText en={labelEn} el={labelEl} compact wrap />
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CfbGlyph name="spark" className="icon-sm text-muted-foreground" />
                    <BilingualText en={dashboardEn('recent_activity')} el={dashboardEl('recent_activity')} />
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-xs" asChild>
                    <Link href="/activity">
                      <BilingualText en={dashboardEn('view_all_activity')} el={dashboardEl('view_all_activity')} compact />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {DEMO_ACTIVITY.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="mt-0.5 shrink-0 text-muted-foreground">
                      <CfbGlyph name={item.glyph} className="icon-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">
                        <BilingualText en={item.textEn} el={item.textEl} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <BilingualText en={item.timeEn} el={item.timeEl} compact />
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CfbGlyph name="calendar" className="icon-sm text-primary-accessible" />
                    <BilingualText en={dashboardEn('upcoming')} el={dashboardEl('upcoming')} />
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-xs gap-1" asChild>
                    <Link href="/events">
                      <BilingualText en={dashboardEn('view_all')} el={dashboardEl('view_all')} compact />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {showDemoData ? (
                  DEMO_EVENTS.slice(0, 3).map((event) => {
                    const tone = EVENT_CONFIG[event.type];
                    const cfg = STATUS[tone];
                    const isUrgent = event.daysLeft <= 3;
                    return (
                      <Link
                        key={event.id}
                        href="/events"
                        className="flex items-start gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="mt-0.5 shrink-0 text-muted-foreground">
                          <CfbGlyph name="calendar" className={cn('icon-sm', isUrgent ? cfg.icon : 'text-muted-foreground')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Two lines rather than an ellipsis: in a 381px
                              rail "Mentor Session — Dr. Sarah Chen" lost 37% of
                              itself, and which mentor it is with is most of the
                              information in the row. */}
                          <p className="text-xs font-medium leading-snug text-foreground">
                            <BilingualText en={event.titleEn} el={event.titleEl} compact wrap />
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="text-xs text-muted-foreground">
                              <BilingualText
                                en={`${formatShortDate(event.date, 'en')} · ${event.time}`}
                                el={`${formatShortDate(event.date, 'el')} · ${event.time}`}
                                compact
                              />
                            </span>
                            <span className={cn(
                              'text-xs font-medium',
                              isUrgent ? STATUS.danger.icon : event.daysLeft <= 7 ? STATUS.warning.icon : 'text-muted-foreground'
                            )}>
                              {event.daysLeft === 0
                                ? <BilingualText en={dashboardEn('today')} el={dashboardEl('today')} compact />
                                : event.daysLeft === 1
                                ? <BilingualText en={dashboardEn('tomorrow')} el={dashboardEl('tomorrow')} compact />
                                : <BilingualText en={`In ${event.daysLeft}d`} el={`Σε ${event.daysLeft} ημ.`} compact />}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-xl bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      <BilingualText en="No events this week" el="Δεν υπάρχουν εκδηλώσεις αυτή την εβδομάδα" />
                    </p>
                    <Button variant="ghost" size="sm" className="mt-1.5 gap-1" asChild>
                      <Link href="/events">
                        <BilingualText en="Browse events" el="Περιήγηση εκδηλώσεων" /> <ArrowRight className="icon-sm" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

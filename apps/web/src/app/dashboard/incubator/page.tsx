'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  BarChart3,
  Building,
  CalendarClock,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  MessageCircle,
  Plus,
  Rocket,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BilingualText } from '@/components/common/BilingualText';
import { RelativeTime } from '@/components/common/RelativeTime';
import { HomeNextStep } from '@/components/dashboard/HomeNextStep';
import { MetricTile } from '@/components/dashboard/MetricTile';
import { EmptyLine, FailedLine, QuickLinks, RowHead, SectionCard } from '@/components/dashboard/SectionCard';
import { useSession } from '@/hooks/useSession';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import {
  getMeProfile,
  getOrgMentorPool,
  getProgramParticipants,
  listOrganizationPrograms,
  type ProgramItem,
} from '@/lib/api';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { qk, queryKeys } from '@/lib/query-keys';
import { cn, formatRelativeTime, initialsOf } from '@/lib/utils';
import { WhatsNewPanel } from '@/components/dashboard/WhatsNewPanel';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { bilingualAria } from '@/lib/i18n/format';
import { demoMark } from '@/lib/demo/photos';
import { HomeAskHero } from '@/components/dashboard/HomeAskHero';

/*
 * The organisation's home.
 *
 * Every figure here was a constant behind the sample-data switch: 3 programs,
 * 42 startups "+15% vs last cohort", 28 mentors, 12 applications, a 67%
 * average progress and an 85% graduation rate, with programs called "AI
 * Accelerator 2025" and startups (NeuralFlow, GreenGrid, PayFlow) that no
 * other page had heard of. Outside the showcase every one of them read 0.
 *
 * It now reads the same endpoints /org/programs, /org/applications,
 * /org/startups and /org/mentors list from - the organisation's programs,
 * their participants, its members and its mentor pool - so a figure here is
 * the length of a list one click away. "Coming up" is taken from the
 * programs' own dates rather than a milestone list nobody maintains.
 */

const DAY = 86_400_000;
const ENROLLED = new Set(['accepted', 'active', 'completed']);

const STATUS_BADGE: Record<string, { en: string; el: string; variant: 'success' | 'info' | 'secondary' | 'warning' }> = {
  active: { en: 'Running', el: 'Σε εξέλιξη', variant: 'success' },
  upcoming: { en: 'Upcoming', el: 'Προσεχές', variant: 'info' },
  completed: { en: 'Completed', el: 'Ολοκληρώθηκε', variant: 'secondary' },
  draft: { en: 'Draft', el: 'Πρόχειρο', variant: 'warning' },
  archived: { en: 'Archived', el: 'Αρχειοθετημένο', variant: 'secondary' },
};

/** "Founder at Taverna OS" names the startup; a participant row carries no other field for it. */
function startupOf(headline: string | null | undefined): string | null {
  const match = headline?.match(/\bat\s+(.+)$/i);
  return match ? match[1] : null;
}

function daysFromNow(iso: string | null, now: number): number | null {
  if (!iso) return null;
  return Math.round((Date.parse(iso) - now) / DAY);
}


export default function IncubatorDashboard() {
  const fmtDate = useDateFormat();
  const shortDate = (iso: string | null) => (iso ? fmtDate(iso, { day: 'numeric', month: 'short' }) : '—');
  const { hasSession, mounted } = useSession();
  const {
    membership, name: orgName, isLoading: orgLoading, isNone,
    failed: orgFailed, refetch: refetchOrg, isFetching: orgFetching,
  } = useCurrentOrg();
  const organizationId = membership?.organizationId ?? null;

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const {
    data: programData, isLoading: programsLoading, isError: programsError,
    refetch: refetchPrograms, isFetching: programsFetching,
  } = useQuery({
    queryKey: qk('programs', 'organization', organizationId),
    queryFn: () => listOrganizationPrograms(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 0,
  });
  const programs = useMemo(() => programData ?? [], [programData]);

  const participantQueries = useQueries({
    queries: programs.map((program) => ({
      queryKey: qk('org', 'participants', program.id),
      queryFn: () => getProgramParticipants(program.id),
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const { data: mentorData, isError: mentorsError } = useQuery({
    queryKey: qk('org', 'mentor-pool', organizationId),
    queryFn: () => getOrgMentorPool(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 0,
  });

  /*
   * What was not read is unknown, not zero (docs §96). Unread, the home said
   * "No organisation yet", drew four tiles at 0 and told an organisation
   * with programmes to "Create a program to start taking applications".
   * Programmes failing takes every section with it (one line says so);
   * participants failing takes the applications and the startups.
   */
  const programsFailed = orgFailed || (programsError && !programData);
  const participantsFailed = participantQueries.some((q) => q.isError && !q.data);
  const participantsFetching = participantQueries.some((q) => q.isFetching);
  const mentorsFailed = orgFailed || (mentorsError && !mentorData);
  const retryPrograms = () => { refetchOrg(); void refetchPrograms(); };
  const retryParticipants = () => participantQueries.forEach((q) => { if (q.isError) void q.refetch(); });

  const now = Date.now();
  const rows = participantQueries.flatMap((q, i) =>
    (q.data?.participants ?? []).map((row) => ({ row, program: programs[i] as ProgramItem })),
  );
  const waiting = rows
    .filter(({ row }) => row.status === 'applied')
    .sort((a, b) => Date.parse(b.row.appliedAt) - Date.parse(a.row.appliedAt));
  const decided = rows.filter(({ row }) => row.status !== 'applied');
  const accepted = decided.filter(({ row }) => ENROLLED.has(row.status));
  const inPrograms = rows.filter(({ row, program }) => (row.status === 'active' || row.status === 'accepted') && program.status === 'active');
  const alumni = rows.filter(({ row }) => row.status === 'completed');

  const running = programs.filter((p) => p.status === 'active');
  const upcoming = programs.filter((p) => p.status === 'upcoming');
  const completed = programs.filter((p) => p.status === 'completed');
  const seats = running.reduce((s, p) => s + (p.capacity ?? 0), 0);
  const filled = running.reduce((s, p) => s + p.participantCount, 0);

  const mentors = mentorData?.mentors ?? [];
  const menteeSlots = mentors.reduce((s, m) => s + (m.maxMentees ?? 0), 0);
  const menteesTaken = mentors.reduce((s, m) => s + m.currentMentees, 0);

  const nextClose = programs
    .map((p) => ({ p, d: daysFromNow(p.applicationDeadline, now) }))
    .filter((x): x is { p: ProgramItem; d: number } => x.d != null && x.d >= 0)
    .sort((a, b) => a.d - b.d)[0];

  // Dates the programs themselves carry: applications closing, starts, and
  // the end of a running program (its demo day).
  const comingUp = programs
    .flatMap((p) => [
      { id: `${p.id}-close`, en: 'Applications close', el: 'Κλείνουν οι αιτήσεις', program: p, iso: p.applicationDeadline },
      { id: `${p.id}-start`, en: 'Program starts', el: 'Ξεκινά το πρόγραμμα', program: p, iso: p.startDate },
      { id: `${p.id}-end`, en: p.programType === 'accelerator' ? 'Demo day' : 'Program ends', el: p.programType === 'accelerator' ? 'Demo day' : 'Λήξη προγράμματος', program: p, iso: p.endDate },
    ])
    .map((x) => ({ ...x, days: daysFromNow(x.iso, now) }))
    .filter((x): x is typeof x & { days: number } => x.days != null && x.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  const loading = orgLoading || programsLoading;
  const nextApplication = waiting[0];
  const nextApplicantName = nextApplication?.row.user.profile?.displayName ?? 'Applicant';
  const nextApplicantStartup = nextApplication
    ? startupOf(nextApplication.row.user.profile?.headline)
    : null;
  const nextApplicationTitle = nextApplicantStartup
    ? `${nextApplicantStartup} · ${nextApplicantName}`
    : nextApplicantName;
  const acceptance = decided.length ? Math.round((accepted.length / decided.length) * 100) : null;
  const fill = seats ? Math.round((filled / seats) * 100) : null;

  if (!mounted) {
    return (
      <AppShell showHelp>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell askAi={false} showHelp
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Building className="icon-sm" aria-hidden="true" />
            {orgName ?? <BilingualText en="Incubator admin" el="Διαχείριση θερμοκοιτίδας" compact />}
          </Badge>
          <Button size="sm" asChild>
            <Link href="/tenant/programs">
              <Plus className="mr-1.5 icon-sm" aria-hidden="true" />
              <BilingualText en="New program" el="Νέο πρόγραμμα" compact />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <HomeAskHero role="incubator" name={profile?.profile?.displayName} lead={{ en: dashboardEn('incubator_lead'), el: dashboardEl('incubator_lead') }} />

        {!loading && nextApplication ? (
          <HomeNextStep
            tone="waiting"
            kickerEn="Application waiting"
            kickerEl="Αίτηση σε αναμονή"
            title={nextApplicationTitle}
            href={`/org/applications?review=${nextApplication.row.id}`}
            actionEn="Review"
            actionEl="Αξιολόγηση"
          />
        ) : null}

        {isNone && (
          <SectionCard title="No organisation yet" titleEl="Δεν υπάρχει οργανισμός ακόμα">
            <EmptyLine
              en="Programs, applications and cohorts appear here once your account belongs to an organisation."
              el="Προγράμματα, αιτήσεις και κύκλοι εμφανίζονται εδώ όταν ο λογαριασμός σας ανήκει σε οργανισμό."
            />
          </SectionCard>
        )}

        {programsFailed && (
          <SectionCard title="Programs" titleEl="Προγράμματα" icon={FolderKanban}>
            <FailedLine
              en={orgFailed ? 'Your organisation could not be read just now.' : 'Your programmes could not be read just now.'}
              el={orgFailed ? 'Ο οργανισμός σας δεν διαβάστηκε αυτή τη στιγμή.' : 'Τα προγράμματά σας δεν διαβάστηκαν αυτή τη στιγμή.'}
              busy={orgFetching || programsFetching}
              onRetry={retryPrograms}
            />
          </SectionCard>
        )}

        {/* Four figures, each the length of a list one click away. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <MetricTile
            icon={LayoutGrid}
            label="Running programs"
            labelEl="Ενεργά προγράμματα"
            value={loading || programsFailed ? '—' : running.length}
            caption={programsFailed ? 'Not read just now' : `${upcoming.length} upcoming · ${completed.length} completed`}
            captionEl={programsFailed ? 'Δεν διαβάστηκε αυτή τη στιγμή' : `${upcoming.length} προσεχώς · ${completed.length} ολοκληρωμένα`}
            href="/org/programs"
          />
          <MetricTile
            icon={Rocket}
            label="Startups in programs"
            labelEl="Startups σε προγράμματα"
            value={loading || programsFailed || participantsFailed ? '—' : inPrograms.length}
            caption={programsFailed || participantsFailed ? 'Not read just now' : `${alumni.length} alumni`}
            captionEl={programsFailed || participantsFailed ? 'Δεν διαβάστηκε αυτή τη στιγμή' : `${alumni.length} απόφοιτοι`}
            href="/org/startups"
          />
          <MetricTile
            icon={GraduationCap}
            label="Mentors"
            labelEl="Μέντορες"
            value={mentorData && !mentorsFailed ? mentors.length : '—'}
            caption={mentorsFailed ? 'Not read just now' : menteeSlots ? `${menteesTaken} of ${menteeSlots} mentee places taken` : 'Your mentor pool'}
            captionEl={mentorsFailed ? 'Δεν διαβάστηκε αυτή τη στιγμή' : menteeSlots ? `${menteesTaken} από ${menteeSlots} θέσεις καθοδηγούμενων` : 'Η δεξαμενή μεντόρων σας'}
            href="/org/mentors"
          />
          <MetricTile
            icon={UserPlus}
            label="Applications waiting"
            labelEl="Αιτήσεις σε αναμονή"
            value={loading || programsFailed || participantsFailed ? '—' : waiting.length}
            caption={programsFailed ? 'Not read just now' : nextClose ? `${nextClose.p.title.split(' · ')[0]} closes in ${nextClose.d} days` : 'No round is open'}
            captionEl={programsFailed ? 'Δεν διαβάστηκε αυτή τη στιγμή' : nextClose ? `${nextClose.p.title.split(' · ')[0]}: κλείνει σε ${nextClose.d} ημέρες` : 'Κανένας γύρος ανοιχτός'}
            href="/org/applications"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Decisions first: each application waits on this organisation.
                The one the flash above names is not listed again here. */}
            {!programsFailed && (<>
            <SectionCard
              title={nextApplication && !loading ? 'Also waiting' : 'Applications waiting'}
              titleEl={nextApplication && !loading ? 'Επίσης σε αναμονή' : 'Αιτήσεις σε αναμονή'}
              icon={UserPlus}
              action={{ href: '/org/applications', label: 'All applications', labelEl: 'Όλες οι αιτήσεις' }}
              contentClassName="card-rows"
            >
              {loading && [0, 1].map((i) => <Skeleton key={i} className="h-16" />)}
              {participantsFailed && (
                <FailedLine
                  en="Applications could not be read just now."
                  el="Οι αιτήσεις δεν διαβάστηκαν αυτή τη στιγμή."
                  busy={participantsFetching}
                  onRetry={retryParticipants}
                />
              )}
              {waiting.slice(nextApplication && !loading ? 1 : 0, 6).map(({ row, program }) => {
                const name = row.user.profile?.displayName ?? 'Applicant';
                const startup = startupOf(row.user.profile?.headline);
                // The applicant's circle, the startup over the program and
                // when, and the two ways to answer at the right (under the
                // line on a phone, on the title's edge).
                return (
                  <RowHead
                    key={row.id}
                    mark={(
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={row.user.profile?.avatarUrl ?? undefined} alt="" />
                        <AvatarFallback className="bg-muted text-foreground">{initialsOf(name)}</AvatarFallback>
                      </Avatar>
                    )}
                    title={(
                      <span className="block truncate">
                        {startup ?? name}
                        {startup ? <span className="font-normal text-muted-foreground"> · {name}</span> : null}
                      </span>
                    )}
                    subtitle={(
                      <span className="block truncate">
                        {program.title} · <RelativeTime date={row.appliedAt} format={formatRelativeTime} />
                        {row.score != null ? <> · <BilingualText en={`Score ${row.score}`} el={`Βαθμός ${row.score}`} compact /></> : null}
                      </span>
                    )}
                    aside={(
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/org/applications?review=${row.id}`} aria-label={bilingualAria(`Review ${startup ?? name}`, `Αξιολόγηση: ${startup ?? name}`)}><BilingualText en="Review" el="Αξιολόγηση" compact /></Link>
                        </Button>
                        <Button size="icon" variant="ghost" aria-label={bilingualAria(`Message ${name} to schedule a call`, `Μήνυμα σε ${name} για να κλείσετε κλήση`)} asChild>
                          <Link href={`/messages?to=${row.userId}`}>
                            <MessageCircle className="icon-sm" aria-hidden="true" />
                          </Link>
                        </Button>
                      </>
                    )}
                  />
                );
              })}
              {!loading && !participantsFailed && waiting.length === 0 && (
                <EmptyLine en="No application is waiting for a decision." el="Καμία αίτηση δεν περιμένει απόφαση." />
              )}
              {!loading && !participantsFailed && waiting.length === 1 && (
                <EmptyLine en="No other application is waiting." el="Καμία άλλη αίτηση δεν περιμένει." />
              )}
            </SectionCard>

            <SectionCard title="Programs" titleEl="Προγράμματα" icon={FolderKanban} action={{ href: '/org/programs', label: 'Manage', labelEl: 'Διαχείριση' }} contentClassName="card-rows">
              {loading && [0, 1].map((i) => <Skeleton key={i} className="h-20" />)}
              {programs.map((program) => {
                const badge = STATUS_BADGE[program.status] ?? STATUS_BADGE.draft;
                const pct = program.capacity ? Math.min(100, Math.round((program.participantCount / program.capacity) * 100)) : null;
                return (
                  <Link
                    key={program.id}
                    href={`/programs/${program.id}`}
                    className="axis-row block rounded-md transition-colors hover:bg-accent focus-ring"
                  >
                    <RowHead
                      title={program.title}
                      subtitle={(
                        <BilingualText en={`${shortDate(program.startDate)} – ${shortDate(program.endDate)} · ${program.applicationCount} applications`} el={`${shortDate(program.startDate)} – ${shortDate(program.endDate)} · ${program.applicationCount} αιτήσεις`} compact wrap />
                      )}
                      aside={<Badge size="sm" variant={badge.variant}><BilingualText en={badge.en} el={badge.el} compact /></Badge>}
                    />
                    {pct != null && (
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={pct} className="h-1.5 flex-1" aria-label={bilingualAria(`${program.title}: ${program.participantCount} of ${program.capacity} places filled`, `${program.title}: ${program.participantCount} από ${program.capacity} θέσεις καλυμμένες`)} />
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {program.participantCount}/{program.capacity}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
              {!loading && programs.length === 0 && (
                <EmptyLine en="Create a program to start taking applications." el="Δημιουργήστε ένα πρόγραμμα για να δέχεστε αιτήσεις." />
              )}
            </SectionCard>

            {!participantsFailed && (
            <SectionCard title="Startups in programs" titleEl="Startups σε προγράμματα" icon={Rocket} action={{ href: '/org/startups', label: 'All startups', labelEl: 'Όλες οι startups' }} contentClassName="card-rows">
              {/* Startups are rounded squares, the founder and the program
                  under the name: two columns of rows, no frame per row. */}
              {inPrograms.length > 0 && (
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {inPrograms.map(({ row, program }) => {
                    const name = row.user.profile?.displayName ?? 'Founder';
                    const startup = startupOf(row.user.profile?.headline) ?? name;
                    return (
                      <RowHead
                        key={row.id}
                        mark={(
                          <Avatar className="h-10 w-10 rounded-xl">
                            <AvatarImage src={demoMark(startup, [program?.title])} alt="" className="rounded-xl" />
                            <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary-accessible">{initialsOf(startup)}</AvatarFallback>
                          </Avatar>
                        )}
                        title={<span className="block truncate">{startup}</span>}
                        subtitle={<span className="block truncate">{name} · {program.title.split(' · ')[0]}</span>}
                      />
                    );
                  })}
                </div>
              )}
              {!loading && inPrograms.length === 0 && (
                <EmptyLine en="Accepted applicants appear here once their program starts." el="Οι αποδεκτοί εμφανίζονται εδώ όταν ξεκινά το πρόγραμμά τους." />
              )}
            </SectionCard>
            )}
            </>)}
          </div>

          <div className="space-y-6">
            <QuickLinks
              label="Organisation pages"
              labelEl="Σελίδες οργανισμού"
              links={[
                { href: '/org/applications', icon: UserPlus, label: 'Review applications', labelEl: 'Αξιολόγηση αιτήσεων' },
                { href: '/org/cohorts', icon: Users, label: 'Cohorts', labelEl: 'Κύκλοι' },
                { href: '/org/mentors', icon: GraduationCap, label: 'Manage mentors', labelEl: 'Μέντορες' },
                { href: '/org/analytics', icon: BarChart3, label: 'Cohort reports', labelEl: 'Αναφορές' },
                { href: '/org/settings', icon: Settings, label: 'Organisation settings', labelEl: 'Ρυθμίσεις οργανισμού' },
              ]}
            />

            {!programsFailed && (<>
            <SectionCard title="Coming up" titleEl="Επόμενα" icon={CalendarClock} contentClassName="card-rows">
              {comingUp.map((item) => (
                <RowHead
                  key={item.id}
                  title={<BilingualText en={item.en} el={item.el} />}
                  subtitle={<span className="block truncate">{item.program.title}</span>}
                  // How far off, under the program on the title's axis; the
                  // date alone at the right. Stacked at the right, the
                  // countdown line hung 214px in from the axis at 1440.
                  meta={(
                    <span className={cn('tabular-nums', item.days <= 7 && 'text-status-warning')}>
                      {item.days === 0
                        ? <BilingualText en="Today" el="Σήμερα" compact />
                        : <BilingualText en={`In ${item.days}d`} el={`Σε ${item.days} ημ.`} compact />}
                    </span>
                  )}
                  asideStays
                  aside={<span className="font-medium tabular-nums text-foreground">{shortDate(item.iso)}</span>}
                />
              ))}
              {!loading && comingUp.length === 0 && (
                <EmptyLine en="No program date is ahead." el="Καμία ημερομηνία προγράμματος μπροστά." />
              )}
            </SectionCard>

            <SectionCard title="Program health" titleEl="Υγεία προγραμμάτων" contentClassName="space-y-4">
              {[
                { en: 'Places filled', el: 'Πληρότητα θέσεων', value: fill, detail: seats ? { en: `${filled} of ${seats} in running programs`, el: `${filled} από ${seats} σε προγράμματα σε εξέλιξη` } : null },
                { en: 'Acceptance rate', el: 'Ποσοστό αποδοχής', value: participantsFailed ? null : acceptance, detail: participantsFailed ? { en: 'Applications were not read just now', el: 'Οι αιτήσεις δεν διαβάστηκαν αυτή τη στιγμή' } : decided.length ? { en: `${accepted.length} of ${decided.length} decided applications`, el: `${accepted.length} από ${decided.length} αιτήσεις που κρίθηκαν` } : null },
              ].map((row) => (
                <div key={row.en} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      <BilingualText en={row.en} el={row.el} />
                    </span>
                    <span className="font-semibold tabular-nums">{row.value == null ? '—' : `${row.value}%`}</span>
                  </div>
                  <Progress value={row.value ?? 0} className="h-1.5" aria-label={bilingualAria(row.en, row.el)} />
                  {row.detail ? <p className="text-xs text-muted-foreground"><BilingualText en={row.detail.en} el={row.detail.el} wrap /></p> : null}
                </div>
              ))}
              <p className="flex items-center gap-1.5 border-t border-border pt-3 text-sm">
                <GraduationCap className="icon-sm text-muted-foreground" aria-hidden="true" />
                <span className="tabular-nums">{participantsFailed ? '—' : alumni.length}</span>
                <BilingualText en="startups graduated" el="startups αποφοίτησαν" />
              </p>
            </SectionCard>
            </>)}
          </div>
        </div>

        {/* After the work. The application that waits and the figures stay
            the first glance; this list is what shipped, and it is still one press away. */}
        <WhatsNewPanel audience="org" />
      </div>
    </AppShell>
  );
}

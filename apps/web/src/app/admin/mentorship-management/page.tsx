'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { BilingualText } from '@/components/common/BilingualText';
import { PageFacts } from '@/components/common/PageFacts';
import { RowHead, EmptyLine, SectionCard } from '@/components/dashboard/SectionCard';
import { FactLine } from '@/components/common/FactLine';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { discoverMentors } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { initialsOf } from '@/lib/utils';
import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';

const AVAILABILITY: Record<string, { en: string; el: string; variant: 'success' | 'warning' | 'secondary' }> = {
  available: { en: 'Available', el: 'Διαθέσιμος', variant: 'success' },
  limited: { en: 'Limited', el: 'Περιορισμένα', variant: 'warning' },
  unavailable: { en: 'Unavailable', el: 'Μη διαθέσιμος', variant: 'secondary' },
};

/*
 * "Jane Smith, 8 mentees, 42 sessions" and an average of 4.8 were written into
 * this file, beside a "Pending applicant" row whose button led to the user
 * list - there is no mentor-application queue in the API to review. The
 * roster is now the mentor directory `/mentorship/mentors` serves (the list
 * /coaching reads), the figures are sums over it, and the rows that ask for
 * attention are the real ones: mentors nobody has booked yet, and mentors who
 * are not taking sessions.
 */
export default function MentorshipManagementPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: qk('mentors', 'admin'),
    queryFn: () => discoverMentors({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });

  const mentors = data?.mentors ?? [];
  const sessions = mentors.reduce((sum, m) => sum + (m.sessionCount ?? 0), 0);
  const rated = mentors.filter((m) => m.rating != null && m.reviewCount > 0);
  const reviews = rated.reduce((sum, m) => sum + m.reviewCount, 0);
  // Weighted by reviews, so one five-star review does not outvote twenty.
  const avg = reviews ? rated.reduce((sum, m) => sum + (m.rating ?? 0) * m.reviewCount, 0) / reviews : null;
  const unbooked = mentors.filter((m) => !m.sessionCount);
  const unavailable = mentors.filter((m) => m.availabilityStatus === 'unavailable');
  const sorted = [...mentors].sort((a, b) => (b.sessionCount ?? 0) - (a.sessionCount ?? 0));
  // The two figures that ask for attention also narrow the roster (docs §64.5, §111).
  const [show, setShow] = useState<'all' | 'unbooked' | 'unavailable'>('all');
  const shown = show === 'unbooked'
    ? sorted.filter((m) => !m.sessionCount)
    : show === 'unavailable'
      ? sorted.filter((m) => m.availabilityStatus === 'unavailable')
      : sorted;
  const toggle = (next: 'unbooked' | 'unavailable') => setShow((current) => (current === next ? 'all' : next));

  const router = useRouter();
  usePageControls([
    choiceControl('roster_filter', 'Mentors shown', 'Μέντορες που εμφανίζονται', [
      { value: 'all', en: 'All mentors', el: 'Όλοι οι μέντορες' },
      { value: 'unbooked', en: 'Not yet booked', el: 'Χωρίς κράτηση' },
      { value: 'unavailable', en: 'Not taking sessions', el: 'Δεν δέχονται συνεδρίες' },
    ], show, (v) => setShow(v as typeof show)),
    {
      id: 'open_mentor',
      labelEn: 'Open a mentor\'s profile',
      labelEl: 'Άνοιγμα προφίλ μέντορα',
      writes: false,
      options: rowOptions(sorted, (m) => m.userId, (m) => m.displayName),
      unavailableEn: mentors.length === 0 ? 'No mentor profiles yet.' : undefined,
      unavailableEl: mentors.length === 0 ? 'Δεν υπάρχουν προφίλ μεντόρων ακόμα.' : undefined,
      run: (value) => { if (value) router.push(`/profiles/${value}`); },
    },
  ]);
  usePageList([
    {
      id: 'mentors',
      labelEn: 'Mentor roster',
      labelEl: 'Κατάλογος μεντόρων',
      rows: isLoading
        ? undefined
        : shown.map((m) => `${m.displayName} · ${m.sessionCount ?? 0} sessions · ${m.availabilityStatus}${m.rating != null && m.reviewCount > 0 ? ` · ${m.rating.toFixed(1)}★ (${m.reviewCount})` : ''}`),
      total: mentors.length,
      sample: false,
    },
  ]);

  return (
    <AppShell
      title="Mentorship management"
      titleEl="Διαχείριση καθοδήγησης"
      description="The mentor directory: who is available, who is booked, and how their sessions are rated."
      descriptionEl="Ο κατάλογος μεντόρων: ποιος είναι διαθέσιμος, ποιος έχει κρατήσεις και πώς αξιολογούνται οι συνεδρίες."
      showHelp
    >
      <HelpCallout id="admin-mentorship" title="Mentorship oversight" titleEl="Εποπτεία καθοδήγησης">
        <p>
          A mentor with no sessions has not been booked yet - worth a nudge or a featured slot. Ratings are averaged
          over reviews, so a mentor with many reviews weighs more than one with a single rating.
        </p>
        <p lang="el" className="mt-2 text-muted-foreground">
          Ένας μέντορας χωρίς συνεδρίες δεν έχει κλειστεί ακόμα - αξίζει μια υπενθύμιση ή προβολή. Οι βαθμολογίες
          σταθμίζονται με τις κριτικές, οπότε όποιος έχει πολλές κριτικές μετρά περισσότερο από όποιον έχει μία.
        </p>
      </HelpCallout>

      {/* One line of figures before the roster (docs §64.5, §111): four
          tiles took a row of boxes for numbers read at a glance. The two
          that ask for attention are buttons that narrow the roster; the
          way to the public directory is the roster's own action. */}
      <PageFacts
        labelEn="Mentors in figures"
        labelEl="Οι μέντορες σε αριθμούς"
        facts={[
          { id: 'mentors', value: isLoading ? null : mentors.length, en: mentors.length === 1 ? 'mentor' : 'mentors', el: mentors.length === 1 ? 'μέντορας' : 'μέντορες' },
          { id: 'sessions', value: isLoading ? null : sessions, en: 'sessions held', el: 'συνεδρίες' },
          {
            id: 'rating',
            value: isLoading || avg == null ? null : `${avg.toFixed(1)}★`,
            en: `average, from ${reviews} ${reviews === 1 ? 'review' : 'reviews'}`,
            el: `μέσος όρος, από ${reviews} ${reviews === 1 ? 'κριτική' : 'κριτικές'}`,
          },
          {
            id: 'unbooked',
            value: isLoading ? null : unbooked.length,
            en: 'not yet booked',
            el: 'χωρίς κράτηση',
            onSelect: unbooked.length ? () => toggle('unbooked') : undefined,
            selected: show === 'unbooked',
          },
          {
            id: 'unavailable',
            value: isLoading || !unavailable.length ? null : unavailable.length,
            en: 'not taking sessions',
            el: 'δεν δέχονται συνεδρίες',
            onSelect: () => toggle('unavailable'),
            selected: show === 'unavailable',
          },
        ]}
      />

      <SectionCard title="Mentor roster" titleEl="Κατάλογος μεντόρων" icon={GraduationCap} className="mt-4" contentClassName="card-rows" action={{ href: '/mentoring', label: 'Public directory', labelEl: 'Δημόσιος κατάλογος' }}>
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
        {!isLoading && isError && mentors.length === 0 && (
          <EmptyLine en="The mentor directory could not be loaded." el="Ο κατάλογος μεντόρων δεν φορτώθηκε." />
        )}
        {!isLoading && !isError && mentors.length === 0 && (
          <EmptyLine en="No mentor profiles yet." el="Δεν υπάρχουν προφίλ μεντόρων ακόμα." />
        )}
        {!isLoading && mentors.length > 0 && shown.length === 0 && (
          <EmptyLine en="No mentor matches this figure now." el="Κανένας μέντορας δεν ταιριάζει τώρα σε αυτόν τον αριθμό." />
        )}
        {shown.map((m) => {
          const availability = AVAILABILITY[m.availabilityStatus] ?? AVAILABILITY.available;
          return (
            // A row of the roster, not a framed tile: the person's circle,
            // the name over the headline, the record on the caption line,
            // the availability at the right.
            <Link
              key={m.id}
              href={`/profiles/${m.userId}`}
              className="axis-row group block rounded-md transition-colors hover:bg-muted/30 focus-ring"
            >
              <RowHead
                mark={(
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={(m as { avatarUrl?: string | null }).avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="bg-muted text-foreground">{initialsOf(m.displayName)}</AvatarFallback>
                  </Avatar>
                )}
                title={m.displayName}
                subtitle={m.headline
                  ? <span className="block first-letter:uppercase">{m.headline}</span>
                  : (m.skills?.length ? <FactLine items={m.skills.slice(0, 3)} /> : undefined)}
                meta={(
                  <span className="tabular-nums">
                    <BilingualText
                      en={`${m.sessionCount ?? 0} sessions${m.rating != null && m.reviewCount > 0 ? ` · ${m.rating.toFixed(1)}★ (${m.reviewCount})` : ''}${m.isFree ? ' · free' : m.hourlyRate ? ` · ${m.currency ?? 'EUR'} ${m.hourlyRate}/h` : ''}`}
                      el={`${m.sessionCount ?? 0} συνεδρίες${m.rating != null && m.reviewCount > 0 ? ` · ${m.rating.toFixed(1)}★ (${m.reviewCount})` : ''}${m.isFree ? ' · δωρεάν' : m.hourlyRate ? ` · ${m.currency ?? 'EUR'} ${m.hourlyRate}/ώρα` : ''}`}
                      compact
                      wrap
                    />
                  </span>
                )}
                asideStays
                aside={(
                  <>
                    <Badge variant={availability.variant} size="sm" className="shrink-0">
                      <BilingualText en={availability.en} el={availability.el} compact />
                    </Badge>
                    <ChevronRight className="icon-sm shrink-0 text-muted-foreground/60 group-hover:text-foreground" aria-hidden="true" />
                  </>
                )}
              />
            </Link>
          );
        })}
      </SectionCard>
    </AppShell>
  );
}

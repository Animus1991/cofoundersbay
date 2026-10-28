'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Star,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OrgReadFailed } from '@/components/org/OrgReadFailed';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { statusOf } from '@/lib/read-status';
import { EmptyLine, FailedLine, RowHead } from '@/components/dashboard/SectionCard';
import { RelativeTime } from '@/components/common/RelativeTime';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { acceptMentorPoolRequest, declineMentorPoolRequest, getOrganizationPolicies, getOrgMentorPool, listMentorPoolRequests, type OrgMentorPoolItem } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyOrgMentors, namedFilters, namedQuery } from '@/components/common/EmptyStates';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { cn, formatRelativeTime, initialsOf } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { qk } from '@/lib/query-keys';
import { rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
import { useDemoData } from '@/contexts/DemoDataContext';
import { BilingualText } from '@/components/common/BilingualText';
import { CardHead } from '@/components/common/CardAnatomy';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { StatusText } from '@/components/common/StatusText';
import { FactLine } from '@/components/common/FactLine';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { attachDemoPhotos } from '@/lib/demo/photos';
import { ORG_MENTORS } from '@/lib/demo/org-world';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { Skeleton } from '@/components/ui/skeleton';
import { ASK } from '@/lib/page-questions';

/**
 * The page's own row from the pool row.
 *
 * `/api/organizations/:id/mentors` existed but returned bare rows with no
 * profile, so this page could not have named a mentor even if it had called
 * it. The endpoint joins the person now; sessions and rating stay absent
 * because the pool records neither.
 */
function toPageMentor(row: OrgMentorPoolItem): Mentor {
  return {
    id: row.id,
    userId: row.userId,
    name: row.displayName ?? 'Unnamed mentor',
    avatar: row.avatarUrl ?? undefined,
    headline: row.headline ?? undefined,
    expertise: row.expertiseAreas,
    activeMentees: row.currentMentees,
    maxMentees: row.maxMentees ?? 0,
    totalSessions: null,
    status: row.isActive ? 'active' : 'inactive',
    isVerified: false,
  };
}

type Mentor = {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  headline?: string;
  expertise: string[];
  activeMentees: number;
  maxMentees: number;
  /** Null when the pool row carries no session count (the live endpoint). */
  totalSessions: number | null;
  rating?: number;
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
};

const MENTOR_STATUS_TONE: Record<Mentor['status'], StatusTone> = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
};

function MentorCard({ mentor, sample = false }: { mentor: Mentor; /** A sample mentor has no profile or thread (ids 'mentor1'…). */ sample?: boolean }) {
  const initials = mentor.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  const statusColors = STATUS[MENTOR_STATUS_TONE[mentor.status]];

  return (
    <Card className="transition-all hover:border-primary/30">
      <CardContent className="space-y-3">
        <CardHead
          // The avatar, the name and the menu's "View Profile" were three
          // links to one profile; the name is the one (docs §96). It opens
          // the member profile, as /mentor/mentees does, not the public /p
          // page, which is addressed by username.
          mark={(
            <Avatar className="h-10 w-10">
              <AvatarImage src={mentor.avatar} alt="" />
              <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          title={(
            <span className="flex items-center gap-1.5">
              {sample ? mentor.name : (
                <Link href={`/profiles/${mentor.userId}`} className="tap-extend-y hover:text-primary-accessible transition-colors">
                  {mentor.name}
                </Link>
              )}
              {mentor.isVerified && (
                <CheckCircle2 className="icon-sm text-primary-accessible" aria-label={bilingualInline('Verified', 'Επαληθευμένος')} />
              )}
            </span>
          )}
          subtitle={mentor.headline || undefined}
          asideStays
          aside={(
            <>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                <StatusText value={mentor.status} />
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label={bilingualAria(`More options for ${mentor.name}`, `Περισσότερες επιλογές: ${mentor.name}`)} variant="ghost" size="icon">
                    <MoreVertical className="icon-sm" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <UnavailableMenuItem en="Assign to Startup" el="Ανάθεση σε startup" reasonEn="Mentor assignments are not stored yet." reasonEl="Οι αναθέσεις μεντόρων δεν αποθηκεύονται ακόμη." />
                  <UnavailableMenuItem en="View Sessions" el="Συνεδρίες" reasonEn="No organisation-wide session view yet." reasonEl="Δεν υπάρχει ακόμη προβολή συνεδριών ανά οργανισμό." />
                  {sample ? (
                    <UnavailableMenuItem en="Send Message" el="Αποστολή μηνύματος" reasonEn="A sample mentor cannot receive messages." reasonEl="Ένα δείγμα μέντορα δεν λαμβάνει μηνύματα." />
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href={`/messages?to=${mentor.userId}`}><BilingualText en="Send Message" el="Αποστολή μηνύματος" compact /></Link>
                    </DropdownMenuItem>
                  )}
                  <UnavailableMenuItem className="text-destructive-accessible" en="Remove from Pool" el="Αφαίρεση από τη δεξαμενή" reasonEn="The pool is read from mentor profiles; there is no pool membership to remove." reasonEl="Η δεξαμενή προκύπτει από τα προφίλ μεντόρων· δεν υπάρχει συμμετοχή για αφαίρεση." />
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        />

        <div className="space-y-1">
          <FactLine items={mentor.expertise.slice(0, 4)} />
          <FactLine
            items={[
              <BilingualText
                key="mentees"
                // No cap set (a mentor who joined by request): the count alone, not "0/0".
                en={mentor.maxMentees ? `${mentor.activeMentees}/${mentor.maxMentees} mentees` : `${mentor.activeMentees} ${mentor.activeMentees === 1 ? 'mentee' : 'mentees'}`}
                el={mentor.maxMentees ? `${mentor.activeMentees}/${mentor.maxMentees} καθοδηγούμενοι` : `${mentor.activeMentees} ${mentor.activeMentees === 1 ? 'καθοδηγούμενος' : 'καθοδηγούμενοι'}`}
                compact
              />,
              mentor.totalSessions != null ? <BilingualText key="sessions" en={`${mentor.totalSessions} sessions`} el={`${mentor.totalSessions} συνεδρίες`} compact /> : null,
              mentor.rating ? <span key="rating" className="inline-flex items-center gap-1"><Star className={cn('icon-sm', STATUS.warning.icon)} />{mentor.rating.toFixed(1)}</span> : null,
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Shown to an organisation whose mentor pool is empty, with sample data on:
 * the demo world's mentors in the roles it gives them (they were four
 * invented people with invented session counts and ratings).
 */
const SEED_MENTORS: Mentor[] = attachDemoPhotos(ORG_MENTORS.map((m) => ({
  id: `sample-${m.id}`,
  userId: m.id,
  name: m.name,
  headline: m.headline,
  expertise: m.expertise,
  activeMentees: m.mentees.length,
  maxMentees: m.maxMentees,
  totalSessions: null,
  status: 'active' as const,
  isVerified: false,
})), { portraitKey: 'avatar' });

export default function OrgMentorsPage() {
  const sayOne = useBilingualString();
  // Illustrative rows are for the showcase; a real account with nothing
  // to list sees the page's empty state, not invented people and records.
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');

  /*
   * The organisation's real pool. The seed below is what an organisation
   * with an empty pool sees, so the screen still teaches its shape.
   */
  const { membership, isLoading: orgLoading, failed: orgFailed, refetch: refetchOrg, isFetching: orgFetching } = useCurrentOrg();
  const organizationId = membership?.organizationId ?? null;
  const { data, isLoading, isError: mainError, refetch: refetchMain, isFetching: mainFetching } = useQuery({
    queryKey: qk('org', 'mentor-pool', organizationId),
    queryFn: () => getOrgMentorPool(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.mentors ?? []).map(toPageMentor), [data]);
/*
   * Mentors asking to join (docs §103): with "Mentor self-registration" on,
   * a mentor asks from the organisation's page and an owner or admin answers
   * here. A member who is not an admin is refused the list (403), and the
   * section is left out for them.
   */
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  useScrollToHash();
  const requestsQuery = useQuery({
    queryKey: qk('org', 'mentor-requests', organizationId),
    queryFn: () => listMentorPoolRequests(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 30_000,
    retry: 0,
  });
  const policiesQuery = useQuery({
    queryKey: qk('org', 'policies', organizationId),
    queryFn: () => getOrganizationPolicies(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 30_000,
    retry: 0,
  });
  const requests = requestsQuery.data?.requests ?? [];
  const requestsForbidden = requestsQuery.isError && statusOf(requestsQuery.error) === 403;
  const requestsFailed = requestsQuery.isError && !requestsForbidden && !requestsQuery.data;
  const selfRegistration = policiesQuery.data?.policies.mentorSelfRegistration ?? false;
  const showRequests = !requestsForbidden && (requests.length > 0 || requestsFailed || selfRegistration);
  const answer = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => (accept ? acceptMentorPoolRequest(organizationId!, id) : declineMentorPoolRequest(organizationId!, id)),
    onSuccess: (res, vars) => {
      const who = requests.find((r) => r.id === vars.id)?.displayName ?? undefined;
      success(res.accepted ? 'Added to your mentor pool' : 'Request declined', who);
      void queryClient.invalidateQueries({ queryKey: qk('org', 'mentor-requests', organizationId) });
      void queryClient.invalidateQueries({ queryKey: qk('org', 'mentor-pool', organizationId) });
    },
    onError: (err) => showError('Could not answer the request', err instanceof Error ? err.message : undefined),
  });
  const mentors: Mentor[] = live.length > 0 ? live : isLoading || orgLoading || !showDemoData ? [] : SEED_MENTORS;
  const isSample = live.length === 0 && mentors.length > 0;
  const reading = orgLoading || isLoading;
  // The pool records no sessions, so a live pool's "Total Sessions" read "—"
  // for ever; the figure shows only where every row carries one.
  const sessionsCounted = mentors.length > 0 && mentors.every((m) => m.totalSessions != null);


  const filteredMentors = mentors.filter((m) => {
    return !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()));
  });

  const activeMentors = mentors.filter((m) => m.status === 'active');
  const totalCapacity = mentors.reduce((acc, m) => acc + m.maxMentees, 0);
  const currentMentees = mentors.reduce((acc, m) => acc + m.activeMentees, 0);

  usePageList([
    {
      id: 'mentor_requests',
      labelEn: 'Mentors asking to join',
      labelEl: 'Μέντορες που ζητούν ένταξη',
      rows: requestsQuery.isLoading ? undefined : requests.map((r) => `${r.displayName ?? 'A mentor'}${r.headline ? ` · ${r.headline}` : ''}${r.note ? ` · "${r.note}"` : ''}`),
      total: requests.length,
    },
    {
      id: 'mentors',
      labelEn: 'Mentor pool',
      labelEl: 'Δεξαμενή μεντόρων',
      rows: reading ? undefined : filteredMentors.map((m) => `${m.name}${m.headline ? ` · ${m.headline}` : ''} · ${m.expertise.slice(0, 3).join(', ')} · ${m.activeMentees}/${m.maxMentees} mentees · ${m.status}`),
      total: mentors.length,
      sample: !reading && live.length === 0,
    },
  ]);
  usePageControls([
    {
      id: 'accept_mentor_request',
      labelEn: 'Add a mentor who asked to join to the pool',
      labelEl: 'Προσθήκη στη δεξαμενή μέντορα που ζήτησε ένταξη',
      writes: true,
      options: rowOptions(requests, (r) => r.id, (r) => r.displayName ?? 'A mentor'),
      unavailableEn: requests.length ? undefined : 'No mentor is waiting.',
      unavailableEl: requests.length ? undefined : 'Δεν περιμένει κανένας μέντορας.',
      run: async (v) => { if (v) await answer.mutateAsync({ id: v, accept: true }); },
    },
    {
      id: 'decline_mentor_request',
      labelEn: 'Decline a request to join the pool',
      labelEl: 'Απόρριψη αιτήματος ένταξης στη δεξαμενή',
      writes: true,
      options: rowOptions(requests, (r) => r.id, (r) => r.displayName ?? 'A mentor'),
      unavailableEn: requests.length ? undefined : 'No mentor is waiting.',
      unavailableEl: requests.length ? undefined : 'Δεν περιμένει κανένας μέντορας.',
      run: async (v) => { if (v) await answer.mutateAsync({ id: v, accept: false }); },
    },
    { id: 'clear_search', labelEn: 'Clear the mentor search', labelEl: 'Καθαρισμός αναζήτησης μεντόρων', writes: false, unavailableEn: search ? undefined : 'No search is set.', unavailableEl: search ? undefined : 'Δεν υπάρχει αναζήτηση.', run: () => setSearch('') },
  ]);

  // Unread, the page drew its tiles as 0 and its empty state, as if the
  // organisation had nothing in it (docs §96).
  if (orgFailed || (mainError && !data)) {
    return (
      <AppShell showHelp>
        <OrgReadFailed en={orgFailed ? undefined : 'Your mentor pool could not be read just now.'} el={orgFailed ? undefined : 'Η δεξαμενή μεντόρων σας δεν διαβάστηκε αυτή τη στιγμή.'} busy={orgFetching || mainFetching} onRetry={() => { refetchOrg(); void refetchMain(); }} />
      </AppShell>
    );
  }

  return (
    <AppShell showHelp
      title="Mentor Pool"
      description="Manage mentors available to your cohorts. Find them in the platform's mentor directory."
      descriptionEl="Διαχειριστείτε τους μέντορες των κύκλων σας. Βρείτε νέους στον κατάλογο μεντόρων της πλατφόρμας."
      // Linked to /org/mentors/invite, which never existed, and promised
      // email invites no endpoint sends. The directory is where a mentor is
      // found today; the empty state carries the same link (docs §96).
      actions={mentors.length > 0 || reading ? (
        <Button asChild>
          <Link href="/mentoring">
            <Plus className="mr-2 icon-sm" aria-hidden="true" />
            <BilingualText en="Find a mentor" el="Βρείτε μέντορα" compact />
          </Link>
        </Button>
      ) : undefined}
    >
      <div className="space-y-6">
        {isSample && (
          <SampleDataNotice
            surface="Mentor Pool"
            detail="Your mentor pool is empty, so these are samples that show the layout; they open no profile."
            askAiPrompt={ASK.orgMentorsSample}
          />
        )}

        {showRequests ? (
          <Card id="requests">
            <CardContent className="space-y-3">
              <div>
                <h2 className="card-title"><BilingualText en="Asking to join" el="Αιτήματα ένταξης" compact /></h2>
                <p className="text-xs text-muted-foreground">
                  <BilingualText
                    en="Mentors who asked from your organisation's page. Accepting adds them to the pool; they are told either way."
                    el="Μέντορες που ζήτησαν ένταξη από τη σελίδα του οργανισμού σας. Η αποδοχή τους προσθέτει στη δεξαμενή· ενημερώνονται σε κάθε περίπτωση."
                    wrap
                  />
                </p>
              </div>
              {requestsFailed ? (
                <FailedLine en="The requests could not be read just now." el="Τα αιτήματα δεν διαβάστηκαν αυτή τη στιγμή." busy={requestsQuery.isFetching} onRetry={() => void requestsQuery.refetch()} />
              ) : requests.length === 0 ? (
                <EmptyLine en="No mentor has asked to join yet." el="Κανένας μέντορας δεν έχει ζητήσει ένταξη ακόμη." />
              ) : (
                <div className="card-rows">
                  {requests.map((r) => (
                    <div key={r.id} className="space-y-2">
                      <RowHead
                        mark={(
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={r.avatarUrl ?? undefined} alt="" />
                            <AvatarFallback className="bg-primary/10 font-semibold text-primary-accessible">{initialsOf(r.displayName ?? '?')}</AvatarFallback>
                          </Avatar>
                        )}
                        title={<Link href={`/profiles/${r.userId}`} className="tap-extend-y hover:text-primary-accessible">{r.displayName ?? 'A mentor'}</Link>}
                        subtitle={r.headline ? <span className="line-clamp-1">{r.headline}</span> : undefined}
                        meta={r.requestedAt ? <><BilingualText en="asked" el="ζήτησε" compact /> <RelativeTime date={r.requestedAt} format={formatRelativeTime} /></> : undefined}
                      />
                      {r.expertise.length ? <FactLine items={r.expertise} /> : null}
                      {r.note ? <p className="card-body text-muted-foreground first-letter:uppercase">{r.note}</p> : null}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" disabled={answer.isPending} onClick={() => answer.mutate({ id: r.id, accept: true })} aria-label={bilingualAria(`Add ${r.displayName ?? 'this mentor'} to the pool`, `Προσθήκη στη δεξαμενή: ${r.displayName ?? 'μέντορας'}`)}>
                          <BilingualText en="Add to pool" el="Προσθήκη" compact />
                        </Button>
                        <Button size="sm" variant="outline" disabled={answer.isPending} onClick={() => answer.mutate({ id: r.id, accept: false })} aria-label={bilingualAria(`Decline ${r.displayName ?? 'this mentor'}'s request`, `Απόρριψη αιτήματος: ${r.displayName ?? 'μέντορας'}`)}>
                          <BilingualText en="Decline" el="Απόρριψη" compact />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {mentors.length > 0 && (<>
        <div className={cn('grid grid-cols-2 gap-4', sessionsCounted ? 'kpi-odd-span-md md:grid-cols-4' : 'md:grid-cols-3')}>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Total Mentors" el="Σύνολο μεντόρων" compact /></p>
              <p className="page-stat text-xl font-bold">{mentors.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Active" el="Ενεργοί" compact /></p>
              <p className={cn('page-stat text-xl font-bold', STATUS.success.icon)}>{activeMentors.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground"><BilingualText en="Capacity" el="Χωρητικότητα" compact /></p>
              <p className="page-stat text-xl font-bold">{currentMentees}/{totalCapacity}</p>
            </CardContent>
          </Card>
          {sessionsCounted && (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground"><BilingualText en="Total Sessions" el="Σύνολο συνεδριών" compact /></p>
                <p className="page-stat text-xl font-bold">{mentors.reduce((acc, m) => acc + (m.totalSessions ?? 0), 0)}</p>
              </CardContent>
            </Card>
          )}
        </div>
        </>)}

        {(mentors.length > 0 || !!search) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label={bilingualAria('Search mentors', 'Αναζήτηση μεντόρων')}
            placeholder={sayOne('Search mentors by name or expertise…', 'Αναζήτηση μεντόρων με όνομα ή εξειδίκευση…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        )}

        {/* Mentors List */}
        <div className="space-y-3">
          {reading && mentors.length === 0 && [0, 1].map((i) => <Skeleton key={i} className="h-28" />)}
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} sample={isSample} />
          ))}
          {!reading && filteredMentors.length === 0 && (
            <EmptyOrgMentors filtersActive={!!search} onClearFilters={() => setSearch('')} active={namedFilters(namedQuery(search))} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

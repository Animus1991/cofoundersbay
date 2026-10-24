'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { ApiError, acceptsApplications, applyToProgram, getMyPrograms, getProgram } from '@/lib/api';
import { ORG_POLICY_PROBLEM_COPY } from '@cofounderbay/shared';
import { useCoverFailed } from '@/hooks/useCoverFailed';
import { programsEl, programsEn } from '@/lib/i18n/strings-programs';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { qk } from '@/lib/query-keys';
import { usePageControls } from '@/lib/page-controls';
import { StatusText } from '@/components/common/StatusText';
import type { ReactNode } from 'react';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { FactLine } from '@/components/common/FactLine';

/**
 * One labelled fact. No icon: the calm-surface rule hides decorative glyphs
 * inside cards, and the caption is what names the value.
 */
function Fact({ en, el, children }: { en: string; el: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground"><BilingualText en={en} el={el} compact /></dt>
      <dd className="mt-1 font-medium text-foreground">{children}</dd>
    </div>
  );
}

const PROGRAM_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

/**
 * One programme.
 *
 * The public programmes list linked every card's "View Details" to
 * /programs/:id, which did not exist. GET /programs/:id did, and so did the
 * apply route the list's modal uses, so this page reads the programme and
 * lets a founder apply from it, with the same optional note.
 */
export default function ProgramDetailPage() {
  const fmtDate = useDateFormat();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [note, setNote] = useState('');
  const { primary } = useLanguagePreference();
  const placeholder = primary === 'el' ? programsEl('fit_placeholder') : programsEn('fit_placeholder');

  const { data, isLoading, isError, error: readError, refetch, isFetching } = useQuery({
    queryKey: qk('programs', 'detail', id),
    queryFn: () => getProgram(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: 0,
  });
  const cover = useCoverFailed(data?.program?.coverImageUrl);
  const { data: mine } = useQuery({
    queryKey: qk('programs', 'mine'),
    queryFn: getMyPrograms,
    staleTime: 60_000,
    retry: 0,
  });
  const program = data?.program ?? null;
  const enrolled = Boolean(program && (mine?.programs ?? []).some((p) => p.id === program.id));

  const apply = useMutation({
    mutationFn: () => applyToProgram(id, note.trim() ? { coverNote: note.trim() } : undefined),
    onSuccess: () => {
      success(programsEn('applied'), program?.title);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: qk('programs') });
    },
    onError: (e) => showError('Could not apply', e instanceof Error ? e.message : 'Sign in and try again.'),
  });

  // Applying, offered to the assistant with whatever note the reader has
  // typed. No undo: the programmes API has no withdraw, so an application
  // stays until the organisation decides on it.
  const open = program ? acceptsApplications(program) && !(program.capacity != null && program.participantCount >= program.capacity) : false;
  usePageControls([
    {
      id: 'apply_to_program',
      labelEn: 'Apply to this programme',
      labelEl: 'Αίτηση στο πρόγραμμα',
      writes: true,
      unavailableEn: !program ? 'The programme has not loaded.' : enrolled ? 'You have already applied.' : program.byInvitation ? ORG_POLICY_PROBLEM_COPY.applications_closed.en : !open ? 'This programme is not taking applications.' : undefined,
      unavailableEl: !program ? 'Το πρόγραμμα δεν έχει φορτωθεί.' : enrolled ? 'Έχετε ήδη κάνει αίτηση.' : program.byInvitation ? ORG_POLICY_PROBLEM_COPY.applications_closed.el : !open ? 'Το πρόγραμμα δεν δέχεται αιτήσεις.' : undefined,
      run: async () => { await apply.mutateAsync(); },
    },
  ]);

  if (isLoading) {
    return (
      <AppShell title="Program" titleEl="Πρόγραμμα">
        <div className="space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  // "Not found" only when the answer says so; a read that failed (the API
  // unreachable) said the programme "does not exist" (docs §77).
  if (isError && !(readError instanceof ApiError && (readError.status === 404 || readError.status === 403))) {
    return (
      <AppShell title="Program" titleEl="Πρόγραμμα">
        <Card>
          <CardContent className="py-12 text-center">
            <p role="alert" className="text-sm text-muted-foreground">
              <BilingualText en="This programme could not be read just now." el="Το πρόγραμμα δεν διαβάστηκε αυτή τη στιγμή." compact wrap />
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
                <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
              </Button>
              <Button variant="ghost" className="gap-2" asChild>
                <Link href="/programs">
                  <ArrowLeft className="icon-sm" aria-hidden="true" />
                  <BilingualText en="All programs" el="Όλα τα προγράμματα" compact />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (isError || !program) {
    return (
      <AppShell title="Program not found" titleEl="Το πρόγραμμα δεν βρέθηκε">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              <BilingualText
                en="This programme does not exist or is no longer public."
                el="Το πρόγραμμα δεν υπάρχει ή δεν είναι πλέον δημόσιο."
                compact
                wrap
              />
            </p>
            <Button variant="outline" className="mt-4 gap-2" asChild>
              <Link href="/programs">
                <ArrowLeft className="icon-sm" aria-hidden="true" />
                <BilingualText en="All programs" el="Όλα τα προγράμματα" compact />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const deadlinePassed = program.applicationDeadline ? new Date(program.applicationDeadline).getTime() < Date.now() : false;
  const full = program.capacity != null && program.participantCount >= program.capacity;
  // The API takes applications while a program is upcoming or running and
  // before its deadline (program.service `apply`); "active only" closed
  // every upcoming program, which is when most applications arrive.
  const closed = !acceptsApplications(program) || full;

  return (
    <AppShell
      title={program.title}
      description={program.organization?.name}
      askAi={{
        en: `Is the programme "${program.title}" a good fit for my startup?`,
        el: `Ταιριάζει το πρόγραμμα «${program.title}» στη startup μου;`,
      }}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Each figure under its own name: the card listed "Aegean Venture
              Lab · Accelerator · Active · Athens" with nothing saying which
              was the organiser, the type, the status or the place. */}
          <Card className="overflow-hidden">
            {/* A cover that fails to load leaves no band: it was a blank
                16:9 area, 480px at 1440, over the facts (docs §77). */}
            {program.coverImageUrl && !cover.failed ? (
              <img ref={cover.ref} onError={cover.onError} src={program.coverImageUrl} alt="" referrerPolicy="no-referrer" className="aspect-video w-full object-cover" />
            ) : null}
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <Fact en="Organiser" el="Διοργανωτής">
                  {program.organization?.slug ? (
                    <Link href={`/org/${program.organization.slug}`} className="hover:text-primary-accessible hover:underline underline-offset-4">
                      {program.organization.name}
                    </Link>
                  ) : (
                    program.organization?.name ?? '—'
                  )}
                </Fact>
                <Fact en="Type and status" el="Τύπος και κατάσταση">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary"><StatusText value={program.programType} /></Badge>
                    <Badge variant="outline"><StatusText value={program.status} /></Badge>
                  </span>
                </Fact>
                <Fact en="Dates" el="Ημερομηνίες">
                  {program.startDate ? fmtDate(program.startDate, PROGRAM_DATE) : '—'} – {program.endDate ? fmtDate(program.endDate, PROGRAM_DATE) : '—'}
                </Fact>
                <Fact en={programsEn('application_deadline')} el={programsEl('application_deadline')}>
                  {program.applicationDeadline ? fmtDate(program.applicationDeadline, PROGRAM_DATE) : '—'}
                </Fact>
                <Fact en="Location" el="Τοποθεσία">
                  {program.isRemote ? <BilingualText en="Remote" el="Εξ αποστάσεως" compact /> : program.location ?? '—'}
                </Fact>
                <Fact en="Places" el="Θέσεις">
                  <span className="tabular-nums">{program.participantCount}</span>
                  {program.capacity != null && (
                    <>
                      <span className="tabular-nums">/{program.capacity}</span>{' '}
                      <span className="text-muted-foreground"><BilingualText en={programsEn('spots_taken')} el={programsEl('spots_taken')} compact /></span>
                    </>
                  )}
                </Fact>
              </dl>
            </CardContent>
          </Card>
          {/* The sentence and the industries in one card: the industries
              stood between two cards with no card of their own (docs §77). */}
          {program.description || (program.industries?.length ?? 0) > 0 ? (
            <Card>
              <CardContent className="space-y-4">
                {program.description ? <p className="card-body whitespace-pre-line">{program.description}</p> : null}
                {(program.industries?.length ?? 0) > 0 && (
                  <section aria-labelledby="program-industries" className="space-y-1">
                    <h2 id="program-industries" className="text-xs font-medium text-muted-foreground"><BilingualText en="Industries" el="Κλάδοι" compact /></h2>
                    <FactLine
                      className="text-foreground sm:text-sm"
                      items={program.industries.map((industry) =>
                        /^any$/i.test(industry.trim()) ? <BilingualText key="any" en="Any industry" el="Κάθε κλάδος" compact /> : industry,
                      )}
                    />
                  </section>
                )}
              </CardContent>
            </Card>
          ) : null}
          {(program.benefits?.length ?? 0) > 0 && (
            <Card>
              <CardContent className="space-y-3">
                <h2 className="card-title"><BilingualText en="What the programme offers" el="Τι προσφέρει το πρόγραμμα" compact wrap /></h2>
                <ul className="card-body space-y-1.5">
                  {program.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 icon-sm shrink-0 text-status-success" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
          <Card>
            <CardContent className="space-y-3">
              {/* The heading says what the card holds: "Apply to …" stood
                  over "Applied" and over "Applications have closed". */}
              <h2 className="card-title">
                {enrolled ? (
                  <BilingualText en="Your application" el="Η αίτησή σας" compact wrap />
                ) : closed ? (
                  <BilingualText en="Applications" el="Αιτήσεις" compact wrap />
                ) : (
                  <BilingualText en={`${programsEn('apply_to')} ${program.title}`} el={`${programsEl('apply_to')} ${program.title}`} compact wrap />
                )}
              </h2>
              {enrolled ? (
                <Badge className="gap-1.5" variant="secondary">
                  <CheckCircle2 className="icon-sm" aria-hidden="true" />
                  <BilingualText en={programsEn('applied')} el={programsEl('applied')} compact />
                </Badge>
              ) : closed ? (
                <p className="card-body text-muted-foreground">
                  <BilingualText
                    en={program.byInvitation ? ORG_POLICY_PROBLEM_COPY.applications_closed.en : full ? 'The programme is full.' : deadlinePassed ? 'Applications have closed.' : 'This programme is not taking applications.'}
                    el={program.byInvitation ? ORG_POLICY_PROBLEM_COPY.applications_closed.el : full ? 'Το πρόγραμμα είναι πλήρες.' : deadlinePassed ? 'Οι αιτήσεις έκλεισαν.' : 'Το πρόγραμμα δεν δέχεται αιτήσεις.'}
                    compact
                    wrap
                  />
                </p>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e) => { e.preventDefault(); apply.mutate(); }}
                >
                  <label htmlFor="program-fit" className="text-sm font-medium">
                    <BilingualText en={programsEn('fit_label')} el={programsEl('fit_label')} compact />{' '}
                    <span className="text-muted-foreground"><BilingualText en={programsEn('optional')} el={programsEl('optional')} compact /></span>
                  </label>
                  <Textarea id="program-fit" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} className="resize-none" />
                  <Button type="submit" className="w-full gap-2" disabled={apply.isPending}>
                    {apply.isPending ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Zap className="icon-sm" aria-hidden="true" />}
                    <BilingualText en={programsEn('submit_application')} el={programsEl('submit_application')} compact />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

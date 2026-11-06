'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, FileText, Scale, ShieldAlert, Sparkles } from 'lucide-react';
import {
  LEGAL_CATEGORIES,
  LEGAL_CHECKLIST,
  LEGAL_CHECKLIST_PHASES,
  LEGAL_STATUS_COPY,
  LEGAL_TEMPLATES,
  isLegalCategory,
  type LegalCategoryId,
  type LegalTemplate,
} from '@cofounderbay/shared';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { STATUS } from '@/lib/semantic-colors';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';
import { cn } from '@/lib/utils';

type Filter = 'all' | LegalCategoryId;

/** Ticks stay in this browser: a planning aid, not a record of compliance. */
const CHECKLIST_KEY = 'cfb:legal-checklist';

function readChecklist(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHECKLIST_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

const FILTERS: Array<{ value: Filter; en: string; el: string }> = [
  { value: 'all', en: 'All', el: 'Όλα' },
  ...LEGAL_CATEGORIES.map((c) => ({ value: c.id, en: c.label.en, el: c.label.el })),
];

const STATUS_CHIP: Record<LegalTemplate['status'], string> = {
  critical: STATUS.danger.chip,
  verified: STATUS.success.chip,
  standard: STATUS.info.chip,
  optional: STATUS.neutral.chip,
};

const ASK_LEGAL = {
  en: 'Which of these legal documents does my startup need at its current stage, and what should I decide before signing each one?',
  el: 'Ποια από αυτά τα νομικά έγγραφα χρειάζεται η startup μου στο τρέχον στάδιο, και τι πρέπει να αποφασίσω πριν υπογράψω το καθένα;',
};

export default function LegalHubPage() {
  const { ask } = useAskAssistant();
  const { primary } = useLanguagePreference();
  const say = (b: { en: string; el: string }) => (primary === 'el' ? b.el : b.en);
  const [filter, setFilter] = useState<Filter>('all');
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone(readChecklist()), []);
  const setItem = (id: string, on: boolean) => {
    setDone((prev) => {
      const next = on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id);
      try {
        window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        // Storage blocked: the tick holds for this visit.
      }
      return next;
    });
  };
  const nextStep = LEGAL_CHECKLIST.find((item) => !done.includes(item.id));

  const templates = useMemo(
    () => (filter === 'all' ? LEGAL_TEMPLATES : LEGAL_TEMPLATES.filter((t) => t.category === filter)),
    [filter],
  );
  const critical = LEGAL_TEMPLATES.filter((t) => t.status === 'critical');

  // Every prompt goes through the assistant, which asks before it writes anything.
  const draftPrompt = (t: LegalTemplate) =>
    primary === 'el'
      ? `Σύνταξε ένα αρχικό προσχέδιο για «${t.name.el}» για τη startup μου, με κενά για: ${t.decide.el} Εξήγησε κάθε όρο με απλά λόγια.`
      : `Draft a starter outline of a "${t.name.en}" for my startup, leaving blanks for: ${t.decide.en} Explain each clause in plain words.`;
  const officeHoursPrompt =
    primary === 'el'
      ? 'Ετοίμασε μια εκδήλωση «Νομικές ερωτήσεις» στο ημερολόγιό μου: 15 λεπτά για τις νομικές μου ερωτήσεις με τον δικηγόρο μου, μέσα στις επόμενες 5 εργάσιμες ημέρες στις 15:00.'
      : 'Draft an event "Legal questions": 15 minutes for my legal questions with my own lawyer, within the next 5 working days at 15:00.';

  usePageControls([
    choiceControl('legal_category', 'Show one legal category', 'Μία νομική κατηγορία', FILTERS, filter, (v) => setFilter(isLegalCategory(v) ? v : 'all')),
    {
      id: 'legal_tick',
      labelEn: 'Tick a step on the legal checklist (kept in this browser)',
      labelEl: 'Σημείωση βήματος στη νομική λίστα (μένει σε αυτόν τον browser)',
      writes: true,
      options: LEGAL_CHECKLIST.filter((item) => !done.includes(item.id)).map((item) => ({ value: item.id, labelEn: item.title.en, labelEl: item.title.el })),
      run: (value) => { if (value) setItem(value, true); },
      undo: (value) => (value ? { control: 'legal_untick', value } : undefined),
    },
    {
      id: 'legal_untick',
      labelEn: 'Untick a step on the legal checklist',
      labelEl: 'Αφαίρεση σημείωσης από τη νομική λίστα',
      writes: true,
      options: LEGAL_CHECKLIST.filter((item) => done.includes(item.id)).map((item) => ({ value: item.id, labelEn: item.title.en, labelEl: item.title.el })),
      run: (value) => { if (value) setItem(value, false); },
      undo: (value) => (value ? { control: 'legal_tick', value } : undefined),
    },
  ]);
  usePageList([
    {
      id: 'legal_templates',
      labelEn: 'Legal templates on this page',
      labelEl: 'Νομικά πρότυπα σε αυτή τη σελίδα',
      rows: templates.map((t) => `${t.name.en} — ${LEGAL_STATUS_COPY[t.status].en}`),
      rowsEl: templates.map((t) => `${t.name.el} — ${LEGAL_STATUS_COPY[t.status].el}`),
    },
    {
      id: 'legal_checklist',
      labelEn: 'Legal checklist',
      labelEl: 'Νομική λίστα ελέγχου',
      rows: LEGAL_CHECKLIST.map((item) => `${done.includes(item.id) ? '(done) ' : ''}${item.title.en}`),
      rowsEl: LEGAL_CHECKLIST.map((item) => `${done.includes(item.id) ? '(έγινε) ' : ''}${item.title.el}`),
    },
  ]);

  return (
    <AppShell showHelp askAi={ASK_LEGAL}>
      <div className="space-y-6">
        {/* The two things to do first, before any template. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="border-status-danger-border/40">
            <CardContent className="space-y-3 pt-5">
              <CardHead
                mark={<ShieldAlert className={cn('icon-md', STATUS.danger.icon)} aria-hidden="true" />}
                title={<BilingualText en="Sign these first" el="Υπογράψτε πρώτα αυτά" compact />}
                subtitle={<BilingualText en="The two documents a lawyer asks about before anything else." el="Τα δύο έγγραφα που ρωτά πρώτα ένας δικηγόρος." wrap />}
              />
              <ul className="space-y-2" data-testid="legal-critical-list">
                {critical.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2">
                    <span className="min-w-0 text-sm font-medium">{say(t.name)}</span>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => ask(draftPrompt(t))} data-testid={`legal-critical-draft-${t.id}`}>
                      <Sparkles className="icon-sm" aria-hidden="true" />
                      <BilingualText en="Draft with assistant" el="Σύνταξη με τον βοηθό" compact />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-5">
              <CardHead
                mark={<CalendarClock className="icon-md text-primary-accessible" aria-hidden="true" />}
                title={<BilingualText en="Legal office hours" el="Νομικές ώρες γραφείου" compact />}
                subtitle={<BilingualText en="Set aside 15 minutes for your questions, with your own lawyer. CoFounderBay does not provide one; the assistant adds it to your calendar and asks before it writes." el="Κρατήστε 15 λεπτά για τις ερωτήσεις σας, με τον δικό σας δικηγόρο. Το CoFounderBay δεν παρέχει δικηγόρο· ο βοηθός το βάζει στο ημερολόγιό σας και ρωτά πριν γράψει." wrap />}
              />
              <Button className="w-full gap-2" onClick={() => ask(officeHoursPrompt)} data-testid="legal-book-office-hours">
                <CalendarClock className="icon-sm" aria-hidden="true" />
                <BilingualText en="Set aside 15 min" el="Κρατήστε 15′" compact />
              </Button>
              <p className="text-xs text-muted-foreground">
                <BilingualText
                  en="Not legal advice. Templates are starting points to review with counsel in your jurisdiction."
                  el="Δεν αποτελεί νομική συμβουλή. Τα πρότυπα είναι αφετηρία για έλεγχο με δικηγόρο στη δικαιοδοσία σας."
                  wrap
                />
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What to sort out, in the order it comes up. */}
        <Card data-testid="legal-checklist">
          <CardContent className="space-y-4 pt-5">
            <CardHead
              title={<BilingualText en="Your legal checklist" el="Η νομική σας λίστα" compact />}
              subtitle={<BilingualText en="What a founding team in Greece usually sorts out, in the order it comes up. General guidance, not legal or tax advice: check each step with your lawyer and accountant. Ticks stay in this browser." el="Όσα συνήθως τακτοποιεί μια ιδρυτική ομάδα στην Ελλάδα, με τη σειρά που προκύπτουν. Γενική καθοδήγηση, όχι νομική ή φορολογική συμβουλή: ελέγξτε κάθε βήμα με τον δικηγόρο και τον λογιστή σας. Οι σημειώσεις μένουν σε αυτόν τον browser." wrap />}
              aside={<span className="text-xs tabular-nums text-muted-foreground">{done.length}/{LEGAL_CHECKLIST.length}</span>}
              asideStays
            />
            {LEGAL_CHECKLIST_PHASES.map((phase) => (
              <section key={phase.id} className="space-y-2" aria-label={say(phase.label)}>
                <h3 className="text-xs font-medium text-muted-foreground"><BilingualText en={phase.label.en} el={phase.label.el} compact /></h3>
                <ul className="divide-y divide-border rounded-xl border border-border/60">
                  {LEGAL_CHECKLIST.filter((item) => item.phase === phase.id).map((item) => {
                    const template = item.template ? LEGAL_TEMPLATES.find((t) => t.id === item.template) : undefined;
                    const ticked = done.includes(item.id);
                    return (
                      <li key={item.id} className="flex flex-wrap items-start gap-3 px-3 py-2.5">
                        <input
                          id={`legal-step-${item.id}`}
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0"
                          checked={ticked}
                          onChange={(e) => setItem(item.id, e.target.checked)}
                        />
                        <label htmlFor={`legal-step-${item.id}`} className="min-w-0 flex-1 space-y-0.5">
                          <span className={cn('block text-sm font-medium', ticked && 'text-muted-foreground line-through')}>{say(item.title)}</span>
                          <span className="block text-xs text-muted-foreground">{say(item.detail)}</span>
                        </label>
                        {template && !ticked ? (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => ask(draftPrompt(template))}>
                            <BilingualText en="Draft with assistant" el="Σύνταξη με τον βοηθό" compact />
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {nextStep ? null : (
              <p className="text-sm text-muted-foreground"><BilingualText en="Every step is ticked. Revisit the list when the company changes." el="Όλα τα βήματα είναι σημειωμένα. Ξαναδείτε τη λίστα όταν αλλάξει η εταιρεία." wrap /></p>
            )}
          </CardContent>
        </Card>

        {/* Templates by the moment they are needed. */}
        <Tabs value={filter} onValueChange={(v) => setFilter(isLegalCategory(v) ? v : 'all')} className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start" data-testid="legal-category-tabs">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value} data-testid={`legal-tab-${f.value}`}>
                <BilingualText en={f.en} el={f.el} compact />
              </TabsTrigger>
            ))}
          </TabsList>

          {filter !== 'all' && (
            <p className="text-sm text-muted-foreground" data-testid="legal-category-when">
              <span className="font-medium text-foreground"><BilingualText en="When:" el="Πότε:" compact /></span>{' '}
              {say(LEGAL_CATEGORIES.find((c) => c.id === filter)!.when)}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="legal-template-grid">
            {templates.map((t) => (
              <Card key={t.id} className="flex flex-col" data-testid={`legal-template-${t.id}`}>
                <CardContent className="flex flex-1 flex-col gap-3 pt-5">
                  <CardHead
                    mark={<FileText className="icon-md text-muted-foreground" aria-hidden="true" />}
                    title={say(t.name)}
                    subtitle={<span className="text-xs text-muted-foreground">{say(LEGAL_CATEGORIES.find((c) => c.id === t.category)!.label)}</span>}
                    aside={
                      <Badge variant="outline" className={cn('text-2xs uppercase tracking-wide', STATUS_CHIP[t.status])}>
                        {say(LEGAL_STATUS_COPY[t.status])}
                      </Badge>
                    }
                    asideStays
                  />
                  <p className="card-body text-muted-foreground">{say(t.description)}</p>
                  <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs leading-snug">
                    <span className="font-medium"><BilingualText en="Decide first:" el="Αποφασίστε πρώτα:" compact /></span>{' '}
                    {say(t.decide)}
                  </p>
                  <CardFoot meta={<span className="text-2xs text-muted-foreground">{t.stages.join(' · ')}</span>}>
                    <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => ask(draftPrompt(t))} data-testid={`legal-draft-${t.id}`}>
                      <Sparkles className="icon-sm" aria-hidden="true" />
                      <BilingualText en="Draft with assistant" el="Σύνταξη με τον βοηθό" compact />
                    </Button>
                  </CardFoot>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs>

        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <Scale className="icon-sm" aria-hidden="true" />
          <BilingualText en="Raising soon? The SAFE and term sheet pair with your investor pipeline." el="Αντλείτε κεφάλαια σύντομα; Το SAFE και το term sheet συνδυάζονται με το pipeline επενδυτών σας." compact />
          <Link href="/fundraising" className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline" data-testid="legal-fundraising-link">
            <BilingualText en="Open Fundraising" el="Άνοιγμα Χρηματοδότησης" compact />
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

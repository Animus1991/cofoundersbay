'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, FileText, Scale, ShieldAlert, Sparkles } from 'lucide-react';
import {
  LEGAL_CATEGORIES,
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
      ? 'Ετοίμασε μια εκδήλωση «Legal office hours» στο ημερολόγιό μου: 15λεπτη νομική συνεδρία με δικηγόρο startups, μέσα στις επόμενες 5 εργάσιμες ημέρες στις 15:00.'
      : 'Draft an event "Legal office hours": 15 minutes with a startup lawyer, within the next 5 working days at 15:00.';

  usePageControls([
    choiceControl('legal_category', 'Show one legal category', 'Μία νομική κατηγορία', FILTERS, filter, (v) => setFilter(isLegalCategory(v) ? v : 'all')),
  ]);
  usePageList([
    {
      id: 'legal_templates',
      labelEn: 'Legal templates on this page',
      labelEl: 'Νομικά πρότυπα σε αυτή τη σελίδα',
      rows: templates.map((t) => `${t.name.en} — ${LEGAL_STATUS_COPY[t.status].en}`),
      rowsEl: templates.map((t) => `${t.name.el} — ${LEGAL_STATUS_COPY[t.status].el}`),
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
                subtitle={<BilingualText en="15 minutes with a startup lawyer. Booked into your calendar by the assistant — it asks before it writes." el="15 λεπτά με δικηγόρο startups. Το κλείνει ο βοηθός στο ημερολόγιό σας — ρωτά πριν γράψει." wrap />}
              />
              <Button className="w-full gap-2" onClick={() => ask(officeHoursPrompt)} data-testid="legal-book-office-hours">
                <CalendarClock className="icon-sm" aria-hidden="true" />
                <BilingualText en="Book 15 min" el="Κλείστε 15′" compact />
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

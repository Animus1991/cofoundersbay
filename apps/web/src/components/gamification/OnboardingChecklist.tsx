'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Rocket, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { STATUS } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';

/* ── Step definitions ────────────────────────────────────────────────────── */

export interface OnboardingStep {
  id: string;
  label: string;
  labelEl?: string;
  description: string;
  descriptionEl?: string;
  href: string;
  cta: string;
  ctaEl?: string;
  done: boolean;
  identitySignal?: string;
  identitySignalEl?: string;
}

const STORAGE_KEY = 'cfb_onboarding_dismissed_v1';

/**
 * Whether the user has dismissed the checklist.
 *
 * Exposed so a page can avoid stacking a second "do this next" banner on top of
 * the checklist while still showing one once the checklist is gone.
 * `undefined` until read on the client, so callers can avoid a hydration flash.
 */
export function useOnboardingChecklistDismissed(): boolean | undefined {
  const [dismissed, setDismissed] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);
  return dismissed;
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  /** If true, shows collapsed by default once >50% done */
  autoCollapse?: boolean;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function OnboardingChecklist({ steps, autoCollapse = true }: OnboardingChecklistProps) {
  const completedCount = steps.filter((s) => s.done).length;
  const pct           = Math.round((completedCount / steps.length) * 100);
  const allDone       = completedCount === steps.length;

  const [dismissed, setDismissed] = useState(false);
  const [expanded,  setExpanded]  = useState(true);
  const listId = useId();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') setDismissed(true);
    if (autoCollapse && pct > 50) setExpanded(false);
  }, [autoCollapse, pct]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (dismissed || allDone) return null;

  const nextStep = steps.find((s) => !s.done);
  const dismissLabel = bilingualAria('Dismiss the getting-started checklist', 'Απόρριψη λίστας πρώτων βημάτων');

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Title is not personalised: displayName falls back to 'Founder', which
              produced "Founder's Founder Journey", and a possessive apostrophe
              does not translate. The greeting above already names the user. */}
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 rounded-md text-left"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={listId}
          >
            <div className="shrink-0 rounded-lg bg-primary/10 p-1.5">
              <Rocket className="icon-sm text-primary-accessible" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold text-foreground">
                <BilingualText en="Your founder journey" el="Η πορεία σας ως ιδρυτής" />
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <BilingualText
                  en={`${completedCount} of ${steps.length} steps complete`}
                  el={`${completedCount} από ${steps.length} βήματα ολοκληρωμένα`}
                  compact
                />
              </p>
            </div>
            {expanded
              ? <ChevronDown className="ml-2 icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
              : <ChevronRight className="ml-2 icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
            }
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-muted-foreground"
            title={dismissLabel}
            aria-label={dismissLabel}
          >
            <X className="icon-sm" aria-hidden="true" />
          </button>
        </div>
        <Progress
          value={pct}
          className="mt-2 h-1.5"
          aria-label={bilingualAria(
            `Getting started: ${pct}% complete`,
            `Πρώτα βήματα: ${pct}% ολοκληρωμένο`,
          )}
        />
      </CardHeader>

      {expanded && (
        <CardContent id={listId} className="space-y-1.5 pb-3 pt-0">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                step.done
                  ? 'opacity-60'
                  : 'border border-border/40 bg-background/60 hover:border-primary/30 hover:bg-primary/5',
              )}
            >
              <div className="mt-0.5 shrink-0">
                {step.done
                  ? <CheckCircle2 className={cn('icon-sm', STATUS.success.icon)} aria-label={bilingualAria('Done', 'Έγινε')} />
                  : <Circle className="icon-sm text-muted-foreground/40" aria-hidden="true" />
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-xs font-medium', step.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                  <BilingualText en={step.label} el={step.labelEl} stacked />
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    <BilingualText en={step.description} el={step.descriptionEl} stacked />
                  </p>
                )}
              </div>
              {!step.done && (
                <Link href={step.href} className="shrink-0">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary-accessible hover:bg-primary/10">
                    <BilingualText en={step.cta} el={step.ctaEl} compact />
                    <ChevronRight className="icon-sm" aria-hidden="true" />
                  </Button>
                </Link>
              )}
            </div>
          ))}

          {nextStep?.identitySignal && (
            <p className="px-1 pt-1 text-xs italic text-muted-foreground">
              <span aria-hidden="true">✦ </span>
              <BilingualText
                en={`Next: ${nextStep.identitySignal}`}
                el={nextStep.identitySignalEl ? `Επόμενο: ${nextStep.identitySignalEl}` : undefined}
                stacked
              />
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/* ── Helper: build steps from real API data ──────────────────────────────── */

export function buildOnboardingSteps(opts: {
  hasProfile: boolean;
  hasPreferences: boolean;
  hasConnection: boolean;
  hasBoard: boolean;
  hasArtifact: boolean;
}): OnboardingStep[] {
  return [
    {
      id: 'profile',
      label: 'Complete your founder profile',
      labelEl: 'Ολοκληρώστε το προφίλ ιδρυτή',
      description: 'Add skills, startup stage, and what you\'re looking for to unlock quality matches.',
      descriptionEl: 'Προσθέστε δεξιότητες, στάδιο startup και τι αναζητάτε, για ποιοτικές αντιστοιχίσεις.',
      href: '/profile',
      cta: 'Complete',
      ctaEl: 'Ολοκλήρωση',
      done: opts.hasProfile,
      identitySignal: 'You\'re setting yourself up as a serious, findable founder.',
      identitySignalEl: 'Παρουσιάζεστε ως σοβαρός ιδρυτής που μπορεί να βρεθεί.',
    },
    {
      id: 'preferences',
      label: 'Set matching preferences',
      labelEl: 'Ορίστε προτιμήσεις αντιστοίχισης',
      description: 'Tell us who you\'re looking for — co-founders, mentors, or investors.',
      descriptionEl: 'Πείτε μας ποιους αναζητάτε — συνιδρυτές, μέντορες ή επενδυτές.',
      href: '/profile#preferences',
      cta: 'Set up',
      ctaEl: 'Ρύθμιση',
      done: opts.hasPreferences,
      identitySignal: 'Structured founders know exactly who they need.',
      identitySignalEl: 'Οι μεθοδικοί ιδρυτές ξέρουν ακριβώς ποιους χρειάζονται.',
    },
    {
      id: 'connection',
      label: 'Make your first connection',
      labelEl: 'Κάντε την πρώτη σας σύνδεση',
      description: 'Browse top matches and send your first connection request.',
      descriptionEl: 'Δείτε τις κορυφαίες αντιστοιχίσεις και στείλτε το πρώτο αίτημα σύνδεσης.',
      href: '/discover',
      cta: 'Discover',
      ctaEl: 'Εξερεύνηση',
      done: opts.hasConnection,
      identitySignal: 'Startup success is built on the right relationships.',
      identitySignalEl: 'Η επιτυχία ενός startup χτίζεται στις σωστές σχέσεις.',
    },
    {
      id: 'board',
      label: 'Create a research board',
      labelEl: 'Δημιουργήστε πίνακα έρευνας',
      description: 'Map your problem, hypothesis, and early market insights on a canvas.',
      descriptionEl: 'Χαρτογραφήστε πρόβλημα, υπόθεση και πρώτα ευρήματα αγοράς σε έναν καμβά.',
      href: '/research',
      cta: 'Create board',
      ctaEl: 'Δημιουργία πίνακα',
      done: opts.hasBoard,
      identitySignal: 'Thinking visually separates founders who build from those who brainstorm.',
      identitySignalEl: 'Η οπτική σκέψη ξεχωρίζει όσους χτίζουν από όσους απλώς συζητούν ιδέες.',
    },
    {
      id: 'artifact',
      label: 'Build your first startup artifact',
      labelEl: 'Φτιάξτε το πρώτο σας παραδοτέο',
      description: 'Create a Business Model Canvas, pitch deck, or market analysis in Builder.',
      descriptionEl: 'Δημιουργήστε Business Model Canvas, pitch deck ή ανάλυση αγοράς στο Builder.',
      href: '/builder',
      cta: 'Open Builder',
      ctaEl: 'Άνοιγμα Builder',
      done: opts.hasArtifact,
      identitySignal: 'You\'re now building like a structured startup team.',
      identitySignalEl: 'Πλέον δουλεύετε σαν οργανωμένη ομάδα startup.',
    },
  ];
}

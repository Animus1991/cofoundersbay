'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, X } from 'lucide-react';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
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
const DISMISSAL_EVENT = 'cfb:onboarding-dismissed';
let dismissedSnapshot = false;
let unsavedDismissal = false;

function readDismissal() {
  try {
    if (!unsavedDismissal) dismissedSnapshot = window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return dismissedSnapshot;
  }
  return dismissedSnapshot;
}

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
    const onDismissal = () => setDismissed(dismissedSnapshot);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      dismissedSnapshot = event.newValue === 'true';
      unsavedDismissal = false;
      setDismissed(dismissedSnapshot);
    };
    window.addEventListener(DISMISSAL_EVENT, onDismissal);
    window.addEventListener('storage', onStorage);
    setDismissed(readDismissal());
    return () => {
      window.removeEventListener(DISMISSAL_EVENT, onDismissal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return dismissed;
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  userName?: string;
  /** If true, shows collapsed by default once >50% done */
  autoCollapse?: boolean;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function OnboardingChecklist({ steps, userName, autoCollapse = true }: OnboardingChecklistProps) {
  const completedCount = steps.filter((s) => s.done).length;
  const pct           = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  const allDone       = completedCount === steps.length;

  const dismissed = useOnboardingChecklistDismissed();
  const [expandedChoice, setExpandedChoice] = useState<boolean | undefined>(undefined);
  const expanded = expandedChoice ?? !(autoCollapse && pct > 50);
  const listId = useId();

  const handleDismiss = () => {
    dismissedSnapshot = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
      unsavedDismissal = false;
    } catch {
      unsavedDismissal = true;
    }
    window.dispatchEvent(new Event(DISMISSAL_EVENT));
  };

  if (dismissed !== false || allDone) return null;

  const nextStep = steps.find((s) => !s.done);
  const dismissLabel = bilingualAria('Dismiss the getting-started checklist', 'Απόρριψη λίστας πρώτων βημάτων');

  const titleEn = userName ? `${userName}'s founder journey` : 'Your founder journey';
  const titleEl = userName ? `Η πορεία του ${userName} ως ιδρυτής` : 'Η πορεία σας ως ιδρυτής';

  return (
    <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 rounded-md text-left"
            onClick={() => setExpandedChoice(!expanded)}
            aria-expanded={expanded}
            aria-controls={listId}
          >
            <div className="shrink-0 rounded-lg bg-primary/10 p-1.5">
              <CfbGlyph name="builder" className="icon-sm text-primary-accessible" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold text-foreground">
                <BilingualText en={titleEn} el={titleEl} />
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

      <CardContent id={listId} hidden={!expanded} className="space-y-1.5 pb-3 pt-0">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 rounded-lg px-3 py-2.5 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto]',
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
            <div className="min-w-0">
              <p className={cn('text-xs font-medium', step.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                <BilingualText
                  en={step.label}
                  el={step.labelEl}
                  stacked
                  primaryClassName="whitespace-normal break-words"
                  secondaryClassName="whitespace-normal break-words"
                />
              </p>
              {!step.done && (
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  <BilingualText
                    en={step.description}
                    el={step.descriptionEl}
                    stacked
                    primaryClassName="whitespace-normal break-words"
                    secondaryClassName="whitespace-normal break-words"
                  />
                </p>
              )}
            </div>
            {!step.done && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="col-start-2 h-auto min-h-8 min-w-0 max-w-full justify-self-start gap-1 whitespace-normal py-1.5 text-left text-primary-accessible hover:bg-primary/10 sm:col-start-auto"
              >
                <Link href={step.href}>
                  <BilingualText
                    en={step.cta}
                    el={step.ctaEl}
                    stacked
                    primaryClassName="whitespace-normal break-words"
                    secondaryClassName="whitespace-normal break-words"
                  />
                  <ChevronRight className="icon-sm" aria-hidden="true" />
                </Link>
              </Button>
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
              primaryClassName="whitespace-normal break-words"
              secondaryClassName="whitespace-normal break-words"
            />
          </p>
        )}
      </CardContent>
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

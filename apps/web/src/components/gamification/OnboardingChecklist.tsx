'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Rocket, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ── Step definitions ────────────────────────────────────────────────────── */

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
  identitySignal?: string;
}

const STORAGE_KEY = 'cfb_onboarding_dismissed_v1';

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
  const pct           = Math.round((completedCount / steps.length) * 100);
  const allDone       = completedCount === steps.length;

  const [dismissed, setDismissed] = useState(false);
  const [expanded,  setExpanded]  = useState(true);

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

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-left"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Rocket className="icon-sm text-primary" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {userName ? `${userName}'s` : 'Your'} Founder Journey
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedCount} of {steps.length} steps complete
              </p>
            </div>
            {expanded
              ? <ChevronDown className="ml-2 icon-sm text-muted-foreground" aria-hidden="true" />
              : <ChevronRight className="ml-2 icon-sm text-muted-foreground" aria-hidden="true" />
            }
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/60 hover:text-muted-foreground"
            title="Dismiss checklist"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <Progress value={pct} className="h-1.5 mt-2" />
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-3 space-y-1.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                step.done
                  ? 'opacity-50'
                  : 'bg-background/60 border border-border/40 hover:border-primary/30 hover:bg-primary/5',
              )}
            >
              <div className="mt-0.5 shrink-0">
                {step.done
                  ? <CheckCircle2 className="icon-sm text-emerald-500" aria-hidden="true" />
                  : <Circle className="icon-sm text-muted-foreground/40" aria-hidden="true" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', step.done ? 'line-through text-muted-foreground' : 'text-foreground')}>
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.description}</p>
                )}
              </div>
              {!step.done && (
                <Link href={step.href} className="shrink-0">
                  <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-primary px-2 hover:bg-primary/10">
                    {step.cta} <ChevronRight className="icon-2xs" aria-hidden="true" />
                  </Button>
                </Link>
              )}
            </div>
          ))}

          {nextStep?.identitySignal && (
            <p className="text-xs text-muted-foreground/70 italic px-1 pt-1">
              ✦ Next: {nextStep.identitySignal}
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
      description: 'Add skills, startup stage, and what you\'re looking for to unlock quality matches.',
      href: '/profile',
      cta: 'Complete',
      done: opts.hasProfile,
      identitySignal: 'You\'re setting yourself up as a serious, findable founder.',
    },
    {
      id: 'preferences',
      label: 'Set matching preferences',
      description: 'Tell us who you\'re looking for — co-founders, mentors, or investors.',
      href: '/profile#preferences',
      cta: 'Set up',
      done: opts.hasPreferences,
      identitySignal: 'Structured founders know exactly who they need.',
    },
    {
      id: 'connection',
      label: 'Make your first connection',
      description: 'Browse top matches and send your first connection request.',
      href: '/discover',
      cta: 'Discover',
      done: opts.hasConnection,
      identitySignal: 'Startup success is built on the right relationships.',
    },
    {
      id: 'board',
      label: 'Create a research board',
      description: 'Map your problem, hypothesis, and early market insights on a canvas.',
      href: '/research',
      cta: 'Create board',
      done: opts.hasBoard,
      identitySignal: 'Thinking visually separates founders who build from those who brainstorm.',
    },
    {
      id: 'artifact',
      label: 'Build your first startup artifact',
      description: 'Create a Business Model Canvas, pitch deck, or market analysis in Builder.',
      href: '/builder',
      cta: 'Open Builder',
      done: opts.hasArtifact,
      identitySignal: 'You\'re now building like a structured startup team.',
    },
  ];
}

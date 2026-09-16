'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { CfbGlyph } from '@/components/icons/CfbGlyph';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface NextAction {
  id: string;
  label: string;
  labelEl?: string;
  description: string;
  descriptionEl?: string;
  href: string;
  cta: string;
  ctaEl?: string;
  /** Optional interpolation variables for templates like `{count}`. */
  vars?: Record<string, string | number>;
  /** One of: 'primary' | 'amber' | 'emerald' | 'violet' */
  accent?: 'primary' | 'amber' | 'emerald' | 'violet';
  /** Identity-reinforcing micro-copy shown after CTA */
  identitySignal?: string;
  identitySignalEl?: string;
}

const STORAGE_PREFIX = 'cfb_nab_dismissed_v1_';

interface NextActionBannerProps {
  action: NextAction;
  /** If provided, banner will be suppressed after this ISO date */
  expiresAt?: string;
  className?: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

/* ── Color maps ──────────────────────────────────────────────────────────── */

const ACCENT_CLASSES: Record<string, { border: string; bg: string; icon: string; cta: string }> = {
  primary: {
    border: 'border-primary/30',
    bg:     'bg-primary/5',
    icon:   'text-primary-accessible',
    cta:    'text-primary-accessible hover:bg-primary/10',
  },
  amber: {
    border: 'border-status-warning-border',
    bg:     'bg-status-warning-bg',
    icon:   'text-status-warning',
    cta:    'text-status-warning hover:bg-status-warning-bg',
  },
  emerald: {
    border: 'border-status-success-border',
    bg:     'bg-status-success-bg',
    icon:   'text-status-success',
    cta:    'text-status-success hover:bg-status-success-bg',
  },
  violet: {
    border: 'border-status-accent-border',
    bg:     'bg-status-accent-bg',
    icon:   'text-status-accent',
    cta:    'text-status-accent hover:bg-status-accent-bg',
  },
};

/* ── Component ───────────────────────────────────────────────────────────── */

export function NextActionBanner({ action, expiresAt, className }: NextActionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const storageKey = `${STORAGE_PREFIX}${action.id}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(storageKey) === 'true') {
      setDismissed(true);
      return;
    }
    if (expiresAt && new Date(expiresAt) < new Date()) {
      setDismissed(true);
    }
  }, [storageKey, expiresAt]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, 'true');
  };

  if (dismissed) return null;

  const accent = action.accent ?? 'primary';
  const ac     = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.primary;

  const label = interpolate(action.label, action.vars);
  const labelEl = action.labelEl ? interpolate(action.labelEl, action.vars) : undefined;
  const description = interpolate(action.description, action.vars);
  const descriptionEl = action.descriptionEl ? interpolate(action.descriptionEl, action.vars) : undefined;
  const cta = interpolate(action.cta, action.vars);
  const ctaEl = action.ctaEl ? interpolate(action.ctaEl, action.vars) : undefined;
  const identitySignal = action.identitySignal ? interpolate(action.identitySignal, action.vars) : undefined;
  const identitySignalEl = action.identitySignalEl ? interpolate(action.identitySignalEl, action.vars) : undefined;

  return (
    <div
      className={cn(
        'relative rounded-xl border px-4 py-3.5 pr-10 transition-all sm:pr-4',
        ac.border,
        ac.bg,
        className,
      )}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground sm:hidden"
        title={bilingualAria('Dismiss', 'Απόρριψη')}
        aria-label={bilingualAria('Dismiss next-action suggestion', 'Απόρριψη επόμενης ενέργειας')}
      >
        <X className="icon-sm" />
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-3">
          <CfbGlyph name="spark" className={cn('icon-sm mt-0.5 shrink-0', ac.icon)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-foreground">
              <BilingualText en={label} el={labelEl} />
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              <BilingualText en={description} el={descriptionEl} />
            </p>
            {identitySignal && (
              <p className={cn('mt-1 text-xs italic opacity-70', ac.icon)}>
                <BilingualText en={identitySignal} el={identitySignalEl} />
              </p>
            )}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn('mt-2.5 inline-flex h-9 gap-1.5 px-3 text-xs font-semibold sm:hidden', ac.cta)}
            >
              <Link href={action.href}>
                <BilingualText en={cta} el={ctaEl} compact />
                <ArrowRight className="icon-sm" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn('h-9 gap-1.5 px-3 text-xs font-semibold', ac.cta)}
          >
            <Link href={action.href}>
              <BilingualText en={cta} el={ctaEl} compact />
              <ArrowRight className="icon-sm" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
            title={bilingualAria('Dismiss', 'Απόρριψη')}
            aria-label={bilingualAria('Dismiss next-action suggestion', 'Απόρριψη επόμενης ενέργειας')}
          >
            <X className="icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helper: derive the highest-value next action from context data ───────── */

export function deriveNextAction(opts: {
  hasProfile: boolean;
  hasPreferences: boolean;
  connectionCount: number;
  boardCount: number;
  docCount: number;
  vrsLowestKey?: string;
  pendingRequests: number;
  unreadMessages: number;
}): NextAction | null {
  // Pending requests first — social proof trigger
  if (opts.pendingRequests > 0) {
    return {
      id: 'pending-requests',
      label: opts.pendingRequests === 1 ? '{count} connection request waiting' : '{count} connection requests waiting',
      labelEl: opts.pendingRequests === 1
        ? '{count} αίτημα σύνδεσης σε αναμονή'
        : '{count} αιτήματα σύνδεσης σε αναμονή',
      vars: { count: opts.pendingRequests },
      description: 'Review and accept — new connections compound your opportunities.',
      descriptionEl: 'Δείτε και αποδεχτείτε — οι νέες συνδέσεις πολλαπλασιάζουν τις ευκαιρίες.',
      href: '/connections?tab=requests',
      cta: 'Review now',
      ctaEl: 'Έλεγχος τώρα',
      accent: 'amber',
      identitySignal: 'Responsive founders build stronger networks.',
      identitySignalEl: 'Οι ιδρυτές που απαντούν χτίζουν ισχυρότερα δίκτυα.',
    };
  }

  // Profile is prerequisite for everything
  if (!opts.hasProfile) {
    return {
      id: 'complete-profile',
      label: 'Complete your founder profile',
      labelEl: 'Ολοκληρώστε το προφίλ ιδρυτή',
      description: 'Unlock accurate matches and be found by investors, co-founders, and mentors.',
      descriptionEl: 'Ξεκλειδώστε ακριβείς αντιστοιχίσεις και βρείτε επενδυτές, συνιδρυτές και μέντορες.',
      href: '/profile',
      cta: 'Complete profile',
      ctaEl: 'Ολοκλήρωση προφίλ',
      accent: 'primary',
      identitySignal: 'Your profile is your startup\'s first impression.',
      identitySignalEl: 'Το προφίλ είναι η πρώτη εντύπωση του startup σας.',
    };
  }

  // Research canvas
  if (opts.boardCount === 0) {
    return {
      id: 'create-board',
      label: 'Start your first research board',
      labelEl: 'Ξεκινήστε τον πρώτο πίνακα έρευνας',
      description: 'Map your hypothesis, market signals, and problem space visually.',
      descriptionEl: 'Χαρτογραφήστε υπόθεση, σήματα αγοράς και το πρόβλημα οπτικά.',
      href: '/research',
      cta: 'Create board',
      ctaEl: 'Δημιουργία πίνακα',
      accent: 'violet',
      identitySignal: 'Evidence-first founders de-risk faster.',
      identitySignalEl: 'Οι ιδρυτές με τεκμήρια μειώνουν τον κίνδυνο γρηγορότερα.',
    };
  }

  // Builder artifact
  if (opts.docCount === 0) {
    return {
      id: 'create-artifact',
      label: 'Build your first startup artifact',
      labelEl: 'Φτιάξτε το πρώτο παραδοτέο του startup',
      description: 'Turn your research into a Business Model Canvas or pitch deck.',
      descriptionEl: 'Μετατρέψτε την έρευνα σε Business Model Canvas ή pitch deck.',
      href: '/builder',
      cta: 'Open Builder',
      ctaEl: 'Άνοιγμα Builder',
      accent: 'emerald',
      identitySignal: 'Artifacts make your thinking fundable.',
      identitySignalEl: 'Τα παραδοτέα κάνουν τη σκέψη σας χρηματοδοτήσιμη.',
    };
  }

  // Connection growth
  if (opts.connectionCount < 3) {
    return {
      id: 'grow-connections',
      label: 'Grow your network — find 3 high-match co-founders',
      labelEl: 'Αυξήστε το δίκτυο — βρείτε 3 συνιδρυτές υψηλής αντιστοίχισης',
      description: 'Strong networks unlock advisors, co-founders, and warm investor intros.',
      descriptionEl: 'Ένα ισχυρό δίκτυο ανοίγει συμβούλους, συνιδρυτές και ζεστές γνωριμίες με επενδυτές.',
      href: '/discover',
      cta: 'Discover people',
      ctaEl: 'Ανακάλυψη ανθρώπων',
      accent: 'primary',
      identitySignal: 'Most successful startups are built by teams, not solo founders.',
      identitySignalEl: 'Τα περισσότερα επιτυχημένα startup χτίζονται από ομάδες, όχι από έναν μόνο ιδρυτή.',
    };
  }

  // VRS-driven: boost lowest dimension
  if (opts.vrsLowestKey === 'research') {
    return {
      id: 'vrs-research',
      label: 'Deepen your market research',
      labelEl: 'Βαθύνετε την έρευνα αγοράς',
      description: 'Add more nodes to your research canvas — signals, competitors, or hypotheses.',
      descriptionEl: 'Προσθέστε κόμβους στον καμβά — σήματα, ανταγωνιστές ή υποθέσεις.',
      href: '/research',
      cta: 'Open Canvas',
      ctaEl: 'Άνοιγμα καμβά',
      accent: 'violet',
    };
  }

  if (opts.vrsLowestKey === 'ecosystem') {
    return {
      id: 'vrs-ecosystem',
      label: 'Join the ecosystem',
      labelEl: 'Μπείτε στο οικοσύστημα',
      description: 'Attend events, join groups, and build your presence in the startup community.',
      descriptionEl: 'Πηγαίνετε σε εκδηλώσεις, μπείτε σε ομάδες και χτίστε παρουσία στην κοινότητα.',
      href: '/events',
      cta: 'Browse events',
      ctaEl: 'Περιήγηση εκδηλώσεων',
      accent: 'amber',
    };
  }

  if (opts.vrsLowestKey === 'momentum') {
    return {
      id: 'vrs-momentum',
      label: 'Stay active — your momentum score needs a boost',
      labelEl: 'Μείνετε ενεργοί — η δυναμική σας χρειάζεται ώθηση',
      description: 'Make at least one meaningful action in the next 14 days to maintain streak.',
      descriptionEl: 'Κάντε τουλάχιστον μία ουσιαστική ενέργεια τις επόμενες 14 ημέρες για να κρατήσετε το streak.',
      href: '/discover',
      cta: 'Get active',
      ctaEl: 'Δράση τώρα',
      accent: 'amber',
    };
  }

  return null;
}

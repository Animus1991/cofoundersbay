'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface NextAction {
  id: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  /** One of: 'primary' | 'amber' | 'emerald' | 'violet' */
  accent?: 'primary' | 'amber' | 'emerald' | 'violet';
  /** Identity-reinforcing micro-copy shown after CTA */
  identitySignal?: string;
}

const STORAGE_PREFIX = 'cfb_nab_dismissed_v1_';

interface NextActionBannerProps {
  action: NextAction;
  /** If provided, banner will be suppressed after this ISO date */
  expiresAt?: string;
  className?: string;
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
    border: 'border-amber-500/30',
    bg:     'bg-amber-500/5',
    icon:   'text-amber-500',
    cta:    'text-amber-600 hover:bg-amber-500/10',
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg:     'bg-emerald-500/5',
    icon:   'text-emerald-600',
    cta:    'text-emerald-600 hover:bg-emerald-500/10',
  },
  violet: {
    border: 'border-violet-500/30',
    bg:     'bg-violet-500/5',
    icon:   'text-violet-600',
    cta:    'text-violet-600 hover:bg-violet-500/10',
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

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all',
        ac.border,
        ac.bg,
        className,
      )}
    >
      <Sparkles className={cn('h-4 w-4 shrink-0', ac.icon)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{action.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{action.description}</p>
        {action.identitySignal && (
          <p className={cn('text-xs italic mt-1', ac.icon)}>{action.identitySignal}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Link href={action.href}>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 gap-1 text-xs font-semibold px-2.5', ac.cta)}
          >
            {action.cta} <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
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
      label: `${opts.pendingRequests} connection request${opts.pendingRequests > 1 ? 's' : ''} waiting`,
      description: 'Review and accept — new connections compound your opportunities.',
      href: '/connections?tab=requests',
      cta: 'Review now',
      accent: 'amber',
      identitySignal: 'Responsive founders build stronger networks.',
    };
  }

  // Profile is prerequisite for everything
  if (!opts.hasProfile) {
    return {
      id: 'complete-profile',
      label: 'Complete your founder profile',
      description: 'Unlock accurate matches and be found by investors, co-founders, and mentors.',
      href: '/profile',
      cta: 'Complete profile',
      accent: 'primary',
      identitySignal: 'Your profile is your startup\'s first impression.',
    };
  }

  // Research canvas
  if (opts.boardCount === 0) {
    return {
      id: 'create-board',
      label: 'Start your first research board',
      description: 'Map your hypothesis, market signals, and problem space visually.',
      href: '/research',
      cta: 'Create board',
      accent: 'violet',
      identitySignal: 'Evidence-first founders de-risk faster.',
    };
  }

  // Builder artifact
  if (opts.docCount === 0) {
    return {
      id: 'create-artifact',
      label: 'Build your first startup artifact',
      description: 'Turn your research into a Business Model Canvas or pitch deck.',
      href: '/builder',
      cta: 'Open Builder',
      accent: 'emerald',
      identitySignal: 'Artifacts make your thinking fundable.',
    };
  }

  // Connection growth
  if (opts.connectionCount < 3) {
    return {
      id: 'grow-connections',
      label: 'Grow your network — find 3 high-match co-founders',
      description: 'Strong networks unlock advisors, co-founders, and warm investor intros.',
      href: '/discover',
      cta: 'Discover people',
      accent: 'primary',
      identitySignal: 'Most successful startups are built by teams, not solo founders.',
    };
  }

  // VRS-driven: boost lowest dimension
  if (opts.vrsLowestKey === 'research') {
    return {
      id: 'vrs-research',
      label: 'Deepen your market research',
      description: 'Add more nodes to your research canvas — signals, competitors, or hypotheses.',
      href: '/research',
      cta: 'Open Canvas',
      accent: 'violet',
    };
  }

  if (opts.vrsLowestKey === 'ecosystem') {
    return {
      id: 'vrs-ecosystem',
      label: 'Join the ecosystem',
      description: 'Attend events, join groups, and build your presence in the startup community.',
      href: '/events',
      cta: 'Browse events',
      accent: 'amber',
    };
  }

  if (opts.vrsLowestKey === 'momentum') {
    return {
      id: 'vrs-momentum',
      label: 'Stay active — your momentum score needs a boost',
      description: 'Make at least one meaningful action in the next 14 days to maintain streak.',
      href: '/discover',
      cta: 'Get active',
      accent: 'amber',
    };
  }

  return null;
}

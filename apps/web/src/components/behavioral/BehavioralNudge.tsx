'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X, ArrowRight, User, Layout, FileText, Users, MessageSquare,
  Zap, BookOpen, RefreshCw, UserPlus, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNextAction } from '@/hooks/useNextAction';
import type { NextAction } from '@/lib/api';

const ICON_MAP: Record<string, React.ElementType> = {
  User, Layout, FileText, Users, MessageSquare,
  Zap, BookOpen, RefreshCw, UserPlus, Award,
};

const PRIORITY_STYLES: Record<NonNullable<NextAction['priority']>, string> = {
  critical: 'border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-950/30',
  high:     'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
  medium:   'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
  low:      'border-l-4 border-l-muted bg-muted/30',
};

interface BehavioralNudgeProps {
  surface?: string;
  className?: string;
  compact?: boolean;
}

export function BehavioralNudge({ surface = 'dashboard', className, compact = false }: BehavioralNudgeProps) {
  const { action, isLoading, dismiss } = useNextAction({ surface });
  const [dismissed, setDismissed] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  // Reset dismissed state when a new action comes in
  useEffect(() => {
    if (action?.key) {
      setDismissed(false);
      setMountKey((k) => k + 1);
    }
  }, [action?.key]);

  if (isLoading || dismissed || !action) return null;

  const Icon = ICON_MAP[action.icon] ?? Zap;

  const handleDismiss = () => {
    setDismissed(true);
    dismiss('unknown'); // logId not returned by getNextAction — fire-and-forget
  };

  if (compact) {
    return (
      <div
        key={mountKey}
        className={cn(
          'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
          PRIORITY_STYLES[action.priority],
          className,
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-foreground/70" />
        <span className="flex-1 text-foreground/90 text-xs">{action.title}</span>
        <Link href={action.ctaHref}>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            {action.ctaLabel} <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground ml-1">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      key={mountKey}
      className={cn(
        'relative rounded-xl border p-4 shadow-sm transition-all',
        PRIORITY_STYLES[action.priority],
        className,
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss suggestion"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground leading-snug">{action.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
          <div className="pt-1">
            <Link href={action.ctaHref}>
              <Button size="sm" className="h-7 gap-1.5 text-xs">
                {action.ctaLabel}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

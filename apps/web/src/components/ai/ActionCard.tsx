'use client';

import { Check, Loader2, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CopilotAction } from '@/lib/copilot-types';

type ActionCardProps = {
  action: CopilotAction;
  busyId?: string | null;
  onConfirm: (action: CopilotAction) => void;
  onDismiss: (action: CopilotAction) => void;
};

export function ActionCard({ action, busyId, onConfirm, onDismiss }: ActionCardProps) {
  const busy = busyId === action.id;
  const done = action.status === 'done';
  const dismissed = action.status === 'dismissed';
  const failed = action.status === 'error';

  return (
    <div
      className={cn(
        'rounded-lg border bg-card px-3 py-2.5 shadow-sm',
        done && 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20',
        dismissed && 'opacity-60',
        failed && 'border-destructive/40',
      )}
    >
      <p className="text-sm font-medium text-foreground">{action.title}</p>
      {action.description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {done ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Done
            </span>
            {action.href && (
              <Button asChild size="sm" variant="ghost" className="h-7">
                <Link href={action.href}>Open</Link>
              </Button>
            )}
          </>
        ) : dismissed ? (
          <span className="text-xs text-muted-foreground">Dismissed</span>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1.5"
              disabled={busy}
              onClick={() => onConfirm(action)}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {action.confirmLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7"
              disabled={busy}
              onClick={() => onDismiss(action)}
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { AlertTriangle, Check, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { getActionSpec, undoAvailable } from '@/lib/action-registry';
import { STATUS } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';
import type { CopilotAction } from '@/lib/copilot-types';

type ActionCardProps = {
  action: CopilotAction;
  busyId?: string | null;
  onConfirm: (action: CopilotAction) => void;
  onDismiss: (action: CopilotAction) => void;
  /** Omitted by callers that cannot take an action back. */
  onUndo?: (action: CopilotAction) => void;
};

export function ActionCard({ action, busyId, onConfirm, onDismiss, onUndo }: ActionCardProps) {
  const busy = busyId === action.id;
  const done = action.status === 'done';
  const dismissed = action.status === 'dismissed';
  const failed = action.status === 'error';
  const undone = action.status === 'undone';

  const spec = getActionSpec(action.tool);
  const reversal = spec?.reversal;
  // Only a write is worth warning about. `navigate` changes where the user is,
  // not their data, so its "nothing to undo" line would be noise on every card.
  const showReversal = Boolean(spec?.writes && reversal);
  const irreversible = spec?.writes === true && reversal?.kind === 'none';
  const canUndo = Boolean(onUndo) && undoAvailable(action.tool, action.undoContext);

  return (
    <div
      className={cn(
        'rounded-lg border bg-card px-3 py-2.5 shadow-sm',
        done && `border-status-success-border/40 ${STATUS.success.bg}`,
        (dismissed || undone) && 'surface-inactive',
        failed && 'border-destructive/40',
      )}
    >
      <p className="text-sm font-medium text-foreground">{action.title}</p>
      {action.description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
      )}
      {action.tool === 'send_connection' && typeof action.payload.message === 'string' && (
        <p className="mt-1 text-xs text-muted-foreground">“{action.payload.message}”</p>
      )}

      {/* Stated before the user commits, not after. The registry verifies each
          of these against the API, so an intro says plainly that it cannot be
          withdrawn rather than implying it can. */}
      {showReversal && !dismissed && (
        <p
          className={cn(
            'mt-1.5 flex items-start gap-1.5 text-2xs',
            irreversible ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {irreversible && (
            <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
          )}
          <BilingualText
            en={reversal!.explanation.en}
            el={reversal!.explanation.el}
            stacked
            wrap
            // `stacked` mutes its second line by default, which would drop the
            // Greek half of an irreversible warning to ordinary body grey.
            secondaryClassName={irreversible ? 'text-destructive/80' : undefined}
          />
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {undone ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <BilingualText en="Undone" el="Αναιρέθηκε" />
          </span>
        ) : done ? (
          <>
            <span className={cn('inline-flex items-center gap-1 text-xs font-medium', STATUS.success.text)}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <BilingualText en="Done" el="Έγινε" />
            </span>
            {action.href && (
              <Button asChild size="sm" variant="ghost" className="h-7 tap-target-y">
                <Link href={action.href}>
                  <BilingualText en="Open" el="Άνοιγμα" />
                </Link>
              </Button>
            )}
            {canUndo && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 tap-target-y"
                disabled={busy}
                onClick={() => onUndo?.(action)}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <BilingualText en="Undo" el="Αναίρεση" />
              </Button>
            )}
          </>
        ) : dismissed ? (
          <span className="text-xs text-muted-foreground">
            <BilingualText en="Dismissed" el="Απορρίφθηκε" />
          </span>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1.5 tap-target-y"
              disabled={busy}
              onClick={() => onConfirm(action)}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {action.confirmLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 tap-target-y"
              disabled={busy}
              onClick={() => onDismiss(action)}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <BilingualText en="Dismiss" el="Απόρριψη" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

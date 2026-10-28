'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, Check, CloudOff, Loader2 } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { RelativeTime } from '@/components/common/RelativeTime';
import { STATUS } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type SaveStatusProps = {
  state: SaveState;
  /** When the last successful save landed — shown as "Saved · 2 min ago". */
  savedAt?: string | Date | null;
  /** What went wrong; the retry button appears when `onRetry` is given. */
  error?: string | null;
  onRetry?: () => void;
  className?: string;
};

/**
 * One persistent answer to "is my work safe?" beside an editor's title. The
 * sentence changes with the state; the colour only steps in when the user has
 * to do something (unsaved edits, failed save).
 */
export function SaveStatus({ state, savedAt, error, onRetry, className }: SaveStatusProps) {
  if (state === 'idle' && !savedAt) return null;
  const attention = state === 'error' || state === 'dirty';
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="save-status"
      data-state={state}
      className={cn(
        'inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs',
        state === 'error' ? STATUS.danger.text : state === 'dirty' ? STATUS.warning.text : 'text-muted-foreground',
        className,
      )}
    >
      {state === 'saving' ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
      ) : state === 'error' ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : state === 'dirty' ? (
        <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      {state === 'saving' && <BilingualText en="Saving…" el="Αποθήκευση…" compact />}
      {state === 'dirty' && <BilingualText en="Unsaved edits" el="Μη αποθηκευμένες αλλαγές" compact />}
      {state === 'error' && (
        <>
          <BilingualText en="Not saved" el="Δεν αποθηκεύτηκε" compact />
          {error && <span className="truncate opacity-80">· {error}</span>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              data-testid="save-status-retry"
              className={cn('font-medium underline underline-offset-2', attention && 'hover:opacity-80')}
            >
              <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
            </button>
          )}
        </>
      )}
      {(state === 'saved' || state === 'idle') && (
        <>
          <BilingualText en="Saved" el="Αποθηκεύτηκε" compact />
          {savedAt && (
            <>
              <span aria-hidden="true">·</span>
              <RelativeTime date={savedAt} />
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Tracks any save promise so a page can render <SaveStatus> without wiring
 * each mutation by hand: `await track(() => save())`.
 */
export function useSaveStatus(initialSavedAt?: string | Date | null) {
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | Date | null>(initialSavedAt ?? null);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<(() => Promise<unknown>) | null>(null);

  const track = useCallback(async <T,>(run: () => Promise<T>): Promise<T> => {
    last.current = run;
    setState('saving');
    setError(null);
    try {
      const result = await run();
      setSavedAt(new Date());
      setState('saved');
      return result;
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : null);
      throw e;
    }
  }, []);

  const markDirty = useCallback(() => setState((s) => (s === 'saving' ? s : 'dirty')), []);
  const retry = useCallback(() => {
    if (last.current) void track(last.current).catch(() => {});
  }, [track]);

  return { state, savedAt, error, track, markDirty, retry };
}

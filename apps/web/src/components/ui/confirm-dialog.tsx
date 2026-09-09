'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` styles the confirm button red and shows a warning icon. */
  intent?: 'default' | 'destructive';
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
  resolve?: (value: boolean) => void;
};

const ConfirmContext = React.createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(
  null,
);

/**
 * Promise-based replacement for `window.confirm`.
 *
 * `confirm()` is synchronous, unstyled, unthemed, blocks the main thread, is
 * suppressible by the browser and is invisible to screen-reader users who have
 * scrolled away. This renders a real, focus-trapped, themed dialog instead.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete rule?', intent: 'destructive' }))) return;
 */
export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmState>({ open: false, title: '' });

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ ...options, open: true, resolve });
      }),
    [],
  );

  const settle = React.useCallback((result: boolean) => {
    setState((prev) => {
      prev.resolve?.(result);
      return { ...prev, open: false, resolve: undefined };
    });
  }, []);

  const isDestructive = state.intent === 'destructive';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={state.open}
        // Covers Escape, overlay click and the close button — all resolve false.
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <DialogContent size="sm" role="alertdialog">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {isDestructive && (
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive-emphasis">
                  <AlertTriangle className="icon-sm" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 space-y-1.5">
                <DialogTitle>{state.title}</DialogTitle>
                {state.description && (
                  <DialogDescription>{state.description}</DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <DialogFooter>
            <Button variant="secondary" onClick={() => settle(false)}>
              {state.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              // Focus lands here on open; for destructive actions that is the
              // intended target because the dialog is only ever opened by an
              // explicit user gesture on the destructive control.
              autoFocus
              variant={isDestructive ? 'destructive' : 'default'}
              onClick={() => settle(true)}
              className={cn(isDestructive && 'min-w-[96px]')}
            >
              {state.confirmLabel ?? (isDestructive ? 'Delete' : 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

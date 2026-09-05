'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BilingualText } from '@/components/common/BilingualText';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'destructive',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel ?? <BilingualText en="Cancel" el="Άκυρο" compact />}
          </Button>
          <Button
            type="button"
            variant={variant}
            loading={loading}
            onClick={() => void onConfirm()}
            autoFocus={variant !== 'destructive'}
          >
            {confirmLabel ?? <BilingualText en="Confirm" el="Επιβεβαίωση" compact />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Imperative API ─────────────────────────────────────────────────────────
 *
 * `const confirm = useConfirm(); if (await confirm({...})) doIt();`
 *
 * Drop-in replacement for the native `window.confirm()`, which the app used
 * for every destructive action. The native dialog cannot be styled or
 * translated, gives screen-reader users an unlabelled OK/Cancel, and its
 * one-line message ("Delete this domain?") never said what would actually be
 * lost. This renders the app's ConfirmDialog with a real title, a description
 * that explains the consequence, and bilingual buttons.
 */

export interface ConfirmOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => setState({ ...options, resolve }));
  }, []);

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          open
          onOpenChange={(open) => { if (!open) close(false); }}
          title={state.title}
          description={state.description}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          variant={state.variant ?? 'destructive'}
          onConfirm={() => close(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * Returns a promise-based confirm. Falls back to `window.confirm` when used
 * outside a ConfirmProvider so a missing provider degrades, never breaks.
 */
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  return React.useMemo<ConfirmFn>(() => {
    if (ctx) return ctx;
    return async ({ title, description }) =>
      typeof window !== 'undefined' &&
      window.confirm([toText(title), toText(description)].filter(Boolean).join('\n\n'));
  }, [ctx]);
}

function toText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(toText).join('');
  if (React.isValidElement<{ en?: string; children?: React.ReactNode }>(node)) {
    return node.props.en ?? toText(node.props.children);
  }
  return '';
}

/** Ready-made bilingual copy for the common "delete X" case. */
export function deleteConfirmCopy(what: { en: string; el: string }, name?: string): ConfirmOptions {
  const quoted = name ? ` “${name}”` : '';
  return {
    title: <BilingualText en={`Delete ${what.en}${quoted}?`} el={`Διαγραφή ${what.el}${quoted};`} />,
    description: (
      <BilingualText
        en="This permanently removes it for everyone who has access. It cannot be undone."
        el="Αφαιρείται οριστικά για όλους όσοι έχουν πρόσβαση. Δεν μπορεί να αναιρεθεί."
      />
    ),
    confirmLabel: <BilingualText en="Delete" el="Διαγραφή" compact />,
    variant: 'destructive',
  };
}

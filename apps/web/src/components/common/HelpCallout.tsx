'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Contextual help block. Each page passes a unique `id` so dismissed state
 * is remembered per page in localStorage. Users can reopen via the pill button.
 */
export function HelpCallout({
  id,
  title,
  children,
  badge,
  defaultOpen = true,
  className,
}: {
  id: string;
  title: string;
  children: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  className?: string;
}) {
  const storageKey = `cfb.help.${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'closed') setOpen(false);
    if (saved === 'open') setOpen(true);
  }, [storageKey]);

  const persist = (next: boolean) => {
    setOpen(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, next ? 'open' : 'closed');
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => persist(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10',
          className,
        )}
      >
        <HelpCircle className="icon-sm" aria-hidden="true" />
        {title}
      </button>
    );
  }

  return (
    <div
      role="note"
      aria-label={title}
      className={cn(
        'rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-transparent p-4 text-sm leading-relaxed shadow-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
            <HelpCircle className="icon-sm" aria-hidden="true" />
          </span>
          <span>{title}</span>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {badge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => persist(false)}
          aria-label="Dismiss help"
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="icon-sm" />
        </button>
      </div>
      <div className="space-y-2 pl-9 text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-2 [&_a:hover]:underline [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}

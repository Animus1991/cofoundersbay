'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { cn } from '@/lib/utils';

/**
 * A long section, closed on a phone and open from 640px (docs §115). It opens
 * by itself when a link points inside it, so a jump from an index or from the
 * assistant lands on something visible. Closing hides it only with CSS: every
 * field stays mounted, so nothing typed or loaded is lost.
 */
export function PhoneFold({ title, anchor, defaultOpen = false, openWhen = false, children, className }: {
  title: { en: string; el: string };
  /** The id inside it that a link may point to. */
  anchor?: string;
  defaultOpen?: boolean;
  /** Opens it when this turns true: a form's optional fields that a draft filled are not left hidden. */
  openWhen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen || openWhen);
  // Opened when `openWhen` turns true, during render rather than in an effect.
  const [sawOpenWhen, setSawOpenWhen] = useState(openWhen);
  if (openWhen !== sawOpenWhen) {
    setSawOpenWhen(openWhen);
    if (openWhen) setOpen(true);
  }

  useEffect(() => {
    if (!anchor) return undefined;
    const check = () => { if (window.location.hash === `#${anchor}`) setOpen(true); };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [anchor]);

  return (
    <div className={cn('min-w-0', className)} data-phone-fold={open ? 'open' : 'closed'}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground sm:hidden"
      >
        <BilingualText en={title.en} el={title.el} compact wrap />
        <span data-keep-icon=""><ChevronRight className={cn('icon-sm text-muted-foreground transition-transform', open && 'rotate-90')} aria-hidden="true" /></span>
      </button>
      <div className={cn(open ? 'max-sm:mt-3' : 'max-sm:hidden')}>{children}</div>
    </div>
  );
}

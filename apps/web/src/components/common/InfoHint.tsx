'use client';

import { useId, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

/**
 * An explanation that waits to be asked for (docs §115). A paragraph at the top
 * of a page is read once and then pushes the useful part down on every visit;
 * here it is one press away, on touch as well as with a pointer, and it opens
 * in the flow rather than over the content.
 */
export function InfoHint({ title, children, className }: { title: { en: string; el: string }; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={cn('min-w-0', className)} data-info-hint="">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="tap-extend-y inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label={bilingualAria(title.en, title.el)}
      >
        <span data-keep-icon=""><Info className="icon-xs" aria-hidden="true" /></span>
        <BilingualText en={title.en} el={title.el} compact />
      </button>
      <div id={id} hidden={!open} className="mt-1 max-w-prose text-xs text-muted-foreground">{children}</div>
    </div>
  );
}

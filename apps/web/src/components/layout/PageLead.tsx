'use client';

import { useEffect, useRef, useState } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { cn } from '@/lib/utils';

/**
 * The line under a page title. On a phone it runs up to four lines, which with
 * the rest of the header pushed a page's first card past a third of the screen
 * (docs §112). It stops at two there and opens on request, so nothing is lost;
 * from `sm` it reads as it always did.
 */
export function PageLead({ en, el }: { en: string; el?: string }) {
  const lead = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    const node = lead.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setCut(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [en, el, open]);

  return (
    <>
      <p ref={lead} className={cn('page-lead mt-0.5 max-w-prose text-sm leading-snug text-muted-foreground', !open && 'max-sm:line-clamp-2')}>
        <BilingualText en={en} el={el} stacked wrap secondaryFrom="lg" />
      </p>
      {cut || open ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="tap-extend-y text-xs font-medium text-muted-foreground sm:hidden"
        >
          <BilingualText en={open ? 'Less' : 'More'} el={open ? 'Λιγότερα' : 'Περισσότερα'} compact />
        </button>
      ) : null}
    </>
  );
}

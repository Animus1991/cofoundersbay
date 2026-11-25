'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BilingualText } from '@/components/common/BilingualText';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import { NotificationsBell } from './NotificationsBell';
import { UserMenu } from './UserMenu';

/**
 * Where Create, language, notifications and account live on a desktop
 * (docs §146). The owner chose `page`: in the first block of each page (the
 * hero, an overview's band, the page header), with no top bar above it, and
 * a small floating copy once that block has scrolled away. `bar` is the top
 * bar of §131.1. The owner may come back to the side menu (the other option
 * of §146): that is a third value here and one more place that renders
 * `<GlobalTools />`, nothing else.
 */
export type GlobalToolsPlacement = 'page' | 'bar';
export const GLOBAL_TOOLS_PLACEMENT: GlobalToolsPlacement = 'page';

export const CREATE_LINKS = [
  { href: '/commitments/new', en: 'Need card', el: 'Κάρτα ανάγκης' },
  { href: '/events/create', en: 'Event', el: 'Εκδήλωση' },
  { href: '/projects/create', en: 'Project', el: 'Έργο' },
];

/* The copy in the page registers itself, so the floating copy knows when it
   is out of view. One at a time: a page has one first block. */
let inlineTools: HTMLElement | null = null;
const listeners = new Set<() => void>();
function setInlineTools(el: HTMLElement | null) {
  if (inlineTools === el) return;
  inlineTools = el;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The four tools, in one row. `inline` is the copy in the page's first block.
 * Below 2xl, Create and the account show their icon and avatar only: at 1280
 * their words took ~160px from the page title, which broke onto two lines.
 */
export function GlobalTools({ inline = false, className }: { inline?: boolean; className?: string }) {
  return (
    <div
      ref={inline ? setInlineTools : undefined}
      data-global-tools={inline ? 'inline' : 'floating'}
      className={cn('flex shrink-0 items-center justify-end gap-1', className)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5 rounded-full px-2.5 2xl:px-3.5" aria-label={bilingualAria('Create', 'Δημιουργία')} title={bilingualAria('Create', 'Δημιουργία')} data-global-create="">
            <Plus className="icon-sm" aria-hidden="true" />
            <span className="hidden 2xl:inline"><BilingualText en="Create" el="Δημιουργία" compact /></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {CREATE_LINKS.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}><BilingualText en={item.en} el={item.el} compact /></Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <LanguageSwitcher iconOnly className="h-9 w-9" />
      <NotificationsBell className="h-9 w-9" />
      <UserMenu nameFrom="2xl" />
    </div>
  );
}

/**
 * The same tools, floating at the top right of the page column once the
 * copy in the page has scrolled out of view (or on a page that has none).
 * Hidden (not just transparent) while the page's own copy is visible, so the
 * keyboard never reaches it twice. From `sm`: phones keep their own bar.
 */
export function FloatingGlobalTools() {
  const inline = useSyncExternalStore(subscribe, () => inlineTools, () => null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!inline) {
      // A page without a first block: show once it has had a moment to mount one.
      const timer = setTimeout(() => setShow(!inlineTools), 400);
      return () => clearTimeout(timer);
    }
    if (typeof IntersectionObserver === 'undefined') { setShow(false); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { threshold: 0 });
    observer.observe(inline);
    return () => observer.disconnect();
  }, [inline]);
  return (
    <div className="pointer-events-none sticky top-3 z-40 hidden h-0 sm:block" data-floating-tools={show ? 'shown' : 'hidden'}>
      <div
        className={cn(
          'absolute end-0 top-0 rounded-full border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur transition-opacity duration-150',
          show ? 'pointer-events-auto opacity-100' : 'invisible opacity-0',
        )}
      >
        <GlobalTools />
      </div>
    </div>
  );
}

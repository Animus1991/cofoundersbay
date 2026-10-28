'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { readUsage, recordVia, yourPages } from '@/lib/usage-profile';

/**
 * Global keyboard shortcuts: Ctrl/Cmd+K and `/` open the command palette,
 * `?` opens the shortcut reference, and `g` followed by a nav letter
 * (vim-style: h home, d discover, p profile, a ai, m messages, s settings)
 * navigates; `g` followed by 1–6 opens the reader's own pages, in the order
 * the homes show them (docs §107). Bare-letter bindings never fire while typing in an editable
 * target or with a modifier held. The research canvas owns its own
 * bare-letter bindings (v/n/c/g/s/?), so this hub stands down there.
 */
export function useCommandPalette() {
  // Asks first when a form on the page holds unsaved work (docs §105).
  const router = useGuardedRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const armedAt = useRef(0);

  useEffect(() => {
    const CHORD_MS = 900;
    const GO: Record<string, string> = {
      h: '/', d: '/discover', p: '/profile', a: '/ai', m: '/messages', s: '/settings',
    };
    const isEditable = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' || target.isContentEditable);

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditable(event.target)) return;
      // The canvas binds bare letters to tools; its own `?` shows its keys.
      if (pathname?.startsWith('/research/')) return;

      const key = event.key;
      if (armedAt.current && Date.now() - armedAt.current < CHORD_MS) {
        armedAt.current = 0;
        const dest = GO[key.toLowerCase()];
        if (dest && !event.shiftKey) {
          event.preventDefault();
          recordVia('chord');
          router.push(dest);
          return;
        }
        // The reader's own pages: g 1 is the first of them.
        if (/^[1-6]$/.test(key)) {
          const page = yourPages(readUsage(), Date.now())[Number(key) - 1];
          if (page) {
            event.preventDefault();
            recordVia('shortcut');
            router.push(page.key);
          }
        }
        return;
      }
      if (key === 'g' && !event.shiftKey) {
        armedAt.current = Date.now();
        return;
      }
      if (key === '/') {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (key === '?') {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, pathname]);

  return { open, setOpen, shortcutsOpen, setShortcutsOpen };
}

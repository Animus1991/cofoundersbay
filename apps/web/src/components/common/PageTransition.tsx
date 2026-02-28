'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useRef, useEffect } from 'react';

/**
 * Smooth page transitions using CSS animation only (no framer-motion).
 * Does NOT use key={pathname} — that caused React to unmount/remount the
 * entire subtree on each navigation, producing duplicate React key warnings
 * from sibling nav components rendered via CSS visibility.
 * Instead, re-triggers the animation via a DOM reflow trick.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const prevPathname = useRef<string>('');

  useEffect(() => {
    if (!ref.current || prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    const el = ref.current;
    el.style.animation = 'none';
    void el.offsetHeight; // force reflow
    el.style.animation = '';
  }, [pathname]);

  return (
    <div ref={ref} className="animate-fade-in">
      {children}
    </div>
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { bilingualAria } from '@/lib/i18n/format';

/**
 * A page's one action, kept in reach on a phone (docs §115): a bar over the
 * bottom tabs, shown only while the control it repeats is out of view, and
 * doing exactly what that control does. Wider screens never show it. The bar
 * sits where the profile form's Save bar sits.
 */
export function PhoneStickyAction({ watchId, label, children }: {
  /** The id of the element the bar stands in for; the bar hides while it is on screen. */
  watchId: string;
  label: { en: string; el: string };
  children: ReactNode;
}) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  if (inView) return null;
  return (
    <div
      role="region"
      aria-label={bilingualAria(label.en, label.el)}
      data-phone-sticky=""
      className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-border bg-card/95 p-3 backdrop-blur-md sm:hidden"
    >
      {children}
    </div>
  );
}

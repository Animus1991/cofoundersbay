'use client';

import { useEffect } from 'react';

/**
 * Scrolls to the element the URL hash names once that element exists.
 *
 * A section that mounts after the page has loaded (client-only content, a
 * card waiting on its data) misses the browser's own fragment scroll, so
 * `/settings#verification` (now `/profile#verification`) - the link the
 * commitments ladder, warm intros and "What's new" all send people to -
 * opened at the top of the page. This waits for the target, scrolls once,
 * and lands again while content above it is still moving it. It gives up after `timeoutMs`, and never moves a page the reader
 * has already scrolled.
 */
export function useScrollToHash(timeoutMs = 4000) {
  useEffect(() => {
    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    const run = () => {
      cancelAnimationFrame(frame);
      if (settle) clearTimeout(settle);
      let id = '';
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!id) return;
      const started = performance.now();
      const startY = window.scrollY;
      let landedY: number | null = null;
      const userScrolled = () => Math.abs(window.scrollY - (landedY ?? startY)) > 48;
      const tick = () => {
        if (!active) return;
        const el = document.getElementById(id);
        if (el) {
          if (landedY === null && userScrolled()) return;
          el.scrollIntoView({ block: 'start', behavior: 'instant' });
          landedY = window.scrollY;
          // Instant, not the page's smooth scroll: while a smooth scroll ran,
          // the moving scrollY read as the reader scrolling and the hook let
          // go, so cards loading above pushed the target out of view.
          // Cards above may still be loading; land again whenever they push
          // it, for as long as the window lasts. One check at 600ms was not
          // enough on /profile, where the activity, experience and evidence
          // cards above the moved cards arrive one after another (docs §99).
          const landedAt = performance.now();
          const recheck = () => {
            if (!active || userScrolled()) return;
            const top = el.getBoundingClientRect().top;
            if (Math.abs(top) > 96) {
              el.scrollIntoView({ block: 'start', behavior: 'instant' });
              landedY = window.scrollY;
            }
            if (performance.now() - landedAt < timeoutMs) settle = setTimeout(recheck, 400);
          };
          settle = setTimeout(recheck, 600);
          return;
        }
        if (performance.now() - started > timeoutMs || userScrolled()) return;
        frame = requestAnimationFrame(tick);
      };
      tick();
    };

    run();
    window.addEventListener('hashchange', run);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      if (settle) clearTimeout(settle);
      window.removeEventListener('hashchange', run);
    };
  }, [timeoutMs]);
}

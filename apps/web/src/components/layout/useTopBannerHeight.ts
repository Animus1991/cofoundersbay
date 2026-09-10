'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Publishes a fixed top banner's measured height as a CSS variable on the root
 * element, so whatever renders below it can offset by however much chrome is
 * actually stacked above.
 *
 * The app has two independent `fixed top-0` banners that live in different
 * trees — the network/API notice in the root layout, and the demo bar in
 * AppShell — so neither can know about the other. They rendered on top of each
 * other, and the shell's content column only ever cleared the demo one, which
 * meant an API outage hid the top 56px of every page behind a banner.
 *
 * Heights are measured rather than hard-coded because both banners wrap to two
 * lines on a narrow viewport.
 */
export function useTopBannerHeight<T extends HTMLElement>(
  varName: string,
  active: boolean,
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!active) {
      root.style.removeProperty(varName);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const apply = () =>
      root.style.setProperty(varName, `${Math.round(el.getBoundingClientRect().height)}px`);
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty(varName);
    };
  }, [varName, active]);

  return ref;
}

/** Total height of the fixed banner stack, for padding and sticky offsets. */
export const TOP_BANNER_STACK = 'calc(var(--banner-network, 0px) + var(--banner-demo, 0px))';

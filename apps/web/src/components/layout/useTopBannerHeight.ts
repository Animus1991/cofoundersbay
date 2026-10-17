'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Publishes a fixed top banner's measured height as a CSS variable on <html>
 * so the sticky header and content column can offset by the live stack height.
 *
 * The network banner publishes `--banner-network`. The demo session no longer
 * takes a strip: its exit control sits in a corner and leaves `--banner-demo` at 0.
 *
 * Heights are measured rather than hard-coded because the network banner wraps
 * to two lines on a narrow viewport.
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

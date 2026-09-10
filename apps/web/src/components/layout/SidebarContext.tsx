'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type SidebarCtx = {
  /** Effective state: the stored preference, forced to `false` on rail viewports. */
  expanded: boolean;
  mounted: boolean;
  /** True between 640px and 1023px, where the nav renders as an icon rail. */
  isRail: boolean;
  toggle: () => void;
  setExpanded: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarCtx>({
  expanded: true,
  mounted: false,
  isRail: false,
  toggle: () => {},
  setExpanded: () => {},
});

// Material 3 calls 600–839dp a "medium" window and 840–1199dp "expanded"; both
// want a navigation rail rather than a bottom bar or a permanent drawer. The
// Tailwind steps that bracket that range are `sm` (640px) and `lg` (1024px),
// and this query has to stay in lockstep with the `sm:`/`lg:` classes in
// SideNav, AppShell and MobileBottomNav.
const RAIL_QUERY = '(min-width: 640px) and (max-width: 1023.98px)';

const KEY = 'cfb_sidebar';

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Always start with true on both server and client to prevent hydration mismatch
  const [expandedPref, setExpandedState] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Starts `false` so the server render and the first client render agree; the
  // rail's *width* is driven by CSS (`w-[68px] lg:w-[240px]`), so correcting
  // this after mount changes the nav's contents, never the page layout.
  const [isRail, setIsRail] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(RAIL_QUERY);
    const apply = () => setIsRail(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Only read localStorage after mount to prevent SSR/CSR mismatch
  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(KEY);
      if (v !== null) setExpandedState(v === '1');
    } catch {
      // localStorage not available
    }
  }, []);

  const toggle = useCallback(() => {
    setExpandedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY, next ? '1' : '0');
      } catch {
        // localStorage not available
      }
      return next;
    });
  }, []);

  const setExpanded = useCallback((v: boolean) => {
    setExpandedState(v);
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      // localStorage not available
    }
  }, []);

  // On a rail viewport the stored preference is irrelevant — there is no room
  // for a 240px drawer — so every consumer sees the collapsed presentation
  // without the preference itself being overwritten.
  const expanded = isRail ? false : expandedPref;

  return (
    <SidebarContext.Provider value={{ expanded, mounted, isRail, toggle, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);

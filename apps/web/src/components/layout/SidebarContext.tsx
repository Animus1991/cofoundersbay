'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type SidebarCtx = {
  expanded: boolean;
  mounted: boolean;
  toggle: () => void;
  setExpanded: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarCtx>({
  expanded: true,
  mounted: false,
  toggle: () => {},
  setExpanded: () => {},
  mobileNavOpen: false,
  setMobileNavOpen: () => {},
});

const KEY = 'cfb_sidebar';

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Always start with true on both server and client to prevent hydration mismatch
  const [expanded, setExpandedState] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  return (
    <SidebarContext.Provider value={{ expanded, mounted, toggle, setExpanded, mobileNavOpen, setMobileNavOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);

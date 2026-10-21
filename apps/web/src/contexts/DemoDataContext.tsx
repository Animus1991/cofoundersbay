'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { isPreviewDemo } from '@/lib/preview-demo';

type DemoDataCtx = {
  showDemoData: boolean;
  toggleDemoData: () => void;
  setShowDemoData: (v: boolean) => void;
};

const DemoDataContext = createContext<DemoDataCtx>({
  showDemoData: false,
  toggleDemoData: () => {},
  setShowDemoData: () => {},
});

/**
 * The "Show sample data" switch, on its own key.
 *
 * It used to share `cfb_demo_data` with the demo session itself, so turning
 * samples on made the browser a demo session (every request answered by the
 * shim, the account replaced by Alex Demo), and every real account saw sample
 * founders, deals and inquiries until it found the switch, because the
 * default was on. Now:
 *
 * - in the demo, samples are on unless the visitor hid them;
 * - for a real account they are off unless the member turned them on, so a
 *   new member sees their own (empty) pages and the empty states' next steps.
 *
 * Before mount the value is `false` for everyone: the server cannot read
 * localStorage, and lists render from queries that are still loading then.
 */
const STORAGE_KEY = 'cfb_show_samples';

function readPreference(): boolean {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage not available
  }
  return isPreviewDemo() ? stored !== '0' : stored === '1';
}

/**
 * The same switch, read outside React: the assistant answers about an area
 * with what that page shows, and the Fundraising page shows its sample round
 * only while samples are on. Always false on the server.
 */
export function readShowSamples(): boolean {
  if (typeof window === 'undefined') return false;
  return readPreference();
}

function writePreference(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // localStorage not available
  }
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [showDemoData, setShowDemoDataState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setShowDemoDataState(readPreference());
    // A sign-in or a sign-out changes which default applies.
    const sync = () => setShowDemoDataState(readPreference());
    window.addEventListener('cfb:login', sync);
    window.addEventListener('cfb:logout', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cfb:login', sync);
      window.removeEventListener('cfb:logout', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleDemoData = useCallback(() => {
    setShowDemoDataState((prev) => {
      const next = !prev;
      writePreference(next);
      return next;
    });
  }, []);

  const setShowDemoData = useCallback((v: boolean) => {
    setShowDemoDataState(v);
    writePreference(v);
  }, []);

  return (
    <DemoDataContext.Provider value={{ showDemoData: mounted ? showDemoData : false, toggleDemoData, setShowDemoData }}>
      {children}
    </DemoDataContext.Provider>
  );
}

export const useDemoData = () => useContext(DemoDataContext);

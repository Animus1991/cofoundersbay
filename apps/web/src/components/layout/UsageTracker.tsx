'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordVisit } from '@/lib/usage-profile';

/** The page this tab showed last, so a move is counted across a reload or a full page load too. */
const LAST_KEY = 'cfb:usage-last';
/** Past this, the previous page is another sitting, not the step before. */
const MOVE_WINDOW_MS = 30 * 60_000;

function readLast(now: number): string | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const last = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof last.path !== 'string' || typeof last.at !== 'number' || now - last.at > MOVE_WINDOW_MS) return null;
    return last.path;
  } catch {
    return null;
  }
}

function writeLast(path: string, now: number): void {
  try {
    window.sessionStorage.setItem(LAST_KEY, JSON.stringify({ path, at: now }));
  } catch {
    // Blocked storage: moves are not counted, visits still are.
  }
}

/**
 * Counts the page the reader opens, and the move that led to it, on this
 * device only (`lib/usage-profile`, docs §107). Mounted once at the root;
 * it renders nothing and records nothing while the reader has it turned off.
 */
export function UsageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // After the page has painted, so counting never competes with it. A page
    // left within the delay was passed through, not visited.
    const handle = window.setTimeout(() => {
      const now = Date.now();
      recordVisit(pathname, readLast(now), now);
      writeLast(pathname, now);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [pathname]);

  return null;
}

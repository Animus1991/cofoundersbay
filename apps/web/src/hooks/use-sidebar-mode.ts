'use client';

import { useEffect, useState } from 'react';
import type { SidebarMode } from '@/components/layout/nav-modes';

const STORAGE_KEY = 'cfb:sidebar-mode';

export function useSidebarMode() {
  const [mode, setMode] = useState<SidebarMode>('work');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as SidebarMode | null;
      if (stored === 'work' || stored === 'explore' || stored === 'account') {
        setMode(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function updateMode(next: SidebarMode) {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return [mode, updateMode] as const;
}

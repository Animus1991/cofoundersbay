'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  EMPTY_USAGE,
  USAGE_EVENT,
  hasKeyboardPointer,
  hasUsage,
  readUsage,
  usageSuggestions,
  yourPages,
  type Shortcut,
  type Suggestion,
  type UsageStore,
} from '@/lib/usage-profile';

export type UsageProfile = {
  /** False on the server and in the first client render: nothing is shown before the store is read. */
  ready: boolean;
  store: UsageStore;
  /** "Your pages": pinned first, then the most used. */
  pages: Shortcut[];
  suggestions: Suggestion[];
  /** Enough visits to say something. */
  known: boolean;
};

/**
 * The reader's usage profile (`lib/usage-profile`), kept current: every
 * write in this tab and in others (the `storage` event) re-reads it.
 */
export function useUsageProfile(): UsageProfile {
  const [store, setStore] = useState<UsageStore>(EMPTY_USAGE);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setStore(readUsage());
      setNow(Date.now());
    };
    refresh();
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith('cfb:usage:')) refresh();
    };
    window.addEventListener(USAGE_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(USAGE_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return useMemo(() => {
    if (!ready) return { ready, store, pages: [], suggestions: [], known: false };
    return {
      ready,
      store,
      pages: yourPages(store, now),
      suggestions: usageSuggestions(store, now, { keyboard: hasKeyboardPointer() }),
      known: hasUsage(store, now),
    };
  }, [ready, store, now]);
}

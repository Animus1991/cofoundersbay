'use client';

import { useEffect, useRef } from 'react';
import { readViewSource } from '@cofounderbay/shared';
import { readStoredUser } from '@/hooks/useStoredUser';
import { recordProfileView } from '@/lib/profile-viewers-api';

/**
 * Counts one view of `userId`'s profile once it has loaded, never the owner's
 * own. The viewer is read inside the effect (not during render), so the first
 * render cannot mistake the owner for a signed-out reader. `?from=search`
 * and the other sources are passed through; anything else counts as direct.
 * `signedInOnly` keeps the members-only page from counting a reader who is
 * about to be sent to sign in.
 */
export function useRecordProfileView(userId: string | null | undefined, loaded: boolean, signedInOnly = false) {
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || !loaded || done.current === userId) return;
    const viewer = readStoredUser();
    if (viewer?.id === userId) return;
    if (signedInOnly && !viewer?.id) return;
    done.current = userId;
    const from = new URLSearchParams(window.location.search).get('from');
    void recordProfileView(userId, readViewSource(from));
  }, [userId, loaded, signedInOnly]);
}

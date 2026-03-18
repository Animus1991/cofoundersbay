'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Check if the user has an active session.
 * Uses the cfb_session cookie (non-httpOnly, set by backend on login).
 * The app exclusively uses HttpOnly cookie auth — localStorage tokens are not used.
 */
function checkSession(): boolean {
  if (typeof window === 'undefined') return false;
  return document.cookie.includes('cfb_session=');
}

/**
 * Hook to detect if user has an active session.
 * Prevents hydration mismatch by always starting with false on server.
 * Updates on login/logout events.
 */
export function useSession() {
  const [hasSession, setHasSession] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setHasSession(checkSession());
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();

    const onLogin = () => setHasSession(true);
    const onLogout = () => setHasSession(false);

    window.addEventListener('cfb:login', onLogin);
    window.addEventListener('cfb:logout', onLogout);

    // Periodic check for cookie expiry
    const interval = setInterval(refresh, 30_000);

    return () => {
      window.removeEventListener('cfb:login', onLogin);
      window.removeEventListener('cfb:logout', onLogout);
      clearInterval(interval);
    };
  }, [refresh]);

  return { hasSession, mounted, refresh };
}

/**
 * Simple hook that just returns hasSession boolean.
 * For use in components that only need the boolean value.
 */
export function useHasSession(): boolean {
  const { hasSession } = useSession();
  return hasSession;
}

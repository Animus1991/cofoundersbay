'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Check if the user has an active session.
 * Returns true if either:
 * - cfb_session cookie exists
 * - cfb_access_token in localStorage exists
 */
function checkSession(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for session cookie
  if (document.cookie.includes('cfb_session=')) return true;
  
  // Check for access token in localStorage (legacy/fallback)
  try {
    const token = localStorage.getItem('cfb_access_token');
    if (token && token.length > 10) return true;
  } catch {
    // localStorage not available
  }
  
  return false;
}

/**
 * Hook to detect if user has an active session.
 * Prevents hydration mismatch by always starting with false on server.
 * Updates on login/logout events and storage changes.
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

    // Listen for login/logout events
    const onLogin = () => setHasSession(true);
    const onLogout = () => setHasSession(false);
    
    window.addEventListener('cfb:login', onLogin);
    window.addEventListener('cfb:logout', onLogout);
    window.addEventListener('storage', refresh);

    // Periodic check for cookie expiry
    const interval = setInterval(refresh, 30_000);

    return () => {
      window.removeEventListener('cfb:login', onLogin);
      window.removeEventListener('cfb:logout', onLogout);
      window.removeEventListener('storage', refresh);
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

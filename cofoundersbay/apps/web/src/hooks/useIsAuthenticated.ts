'use client';

import { useState, useEffect } from 'react';

/**
 * Check active session via the cfb_session cookie (non-httpOnly, set by backend on login).
 * cfb_session has a 7-day TTL matching the refresh token.
 * The app uses httpOnly cookie auth — localStorage tokens are legacy and must not be used.
 */
export function hasActiveSession(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('cfb_session=');
}

/**
 * Returns whether the user has an active session.
 * Uses the cfb_session cookie (set by backend on login) — NOT localStorage tokens.
 * Reacts to cfb:login / cfb:logout events dispatched by api.ts for same-tab updates.
 */
export function useIsAuthenticated(): boolean {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(hasActiveSession());

    const onLogin  = () => setAuthenticated(true);
    const onLogout = () => setAuthenticated(false);
    const onStorage = () => setAuthenticated(hasActiveSession());

    window.addEventListener('cfb:login',  onLogin);
    window.addEventListener('cfb:logout', onLogout);
    window.addEventListener('storage',    onStorage);

    return () => {
      window.removeEventListener('cfb:login',  onLogin);
      window.removeEventListener('cfb:logout', onLogout);
      window.removeEventListener('storage',    onStorage);
    };
  }, []);

  return authenticated;
}

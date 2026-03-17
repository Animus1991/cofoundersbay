'use client';

import { useState, useEffect } from 'react';

/**
 * Returns whether the user has a valid access token stored in localStorage.
 * Always returns `false` on the server (SSR) and updates after mount to avoid
 * React hydration mismatches caused by reading localStorage during render.
 */
export function useIsAuthenticated(): boolean {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(!!localStorage.getItem('accessToken'));
  }, []);

  return authenticated;
}

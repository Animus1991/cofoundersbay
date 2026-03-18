'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMe } from '@/lib/api';

interface SessionUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

interface SessionState {
  hasSession: boolean;
  user: SessionUser | null;
  loading: boolean;
  mounted: boolean;
}

/**
 * Auth state driven by the server via /api/auth/me.
 * A 200 response means the session is valid; 401 means no session.
 * The cfb_session cookie is treated only as an optional UX hint for
 * initial render optimism — the canonical source is the /me endpoint.
 */
export function useSession(): SessionState & { refresh: () => void } {
  const [state, setState] = useState<SessionState>({
    hasSession: false,
    user: null,
    loading: true,
    mounted: false,
  });
  const fetchingRef = useRef(false);

  const fetchSession = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { user: me } = await getMe();
      setState({
        hasSession: true,
        user: {
          id: me.id,
          email: me.email,
          role: me.role,
          emailVerified: me.emailVerified ?? false,
        },
        loading: false,
        mounted: true,
      });
    } catch {
      // 401 or network error — no active session
      setState({ hasSession: false, user: null, loading: false, mounted: true });
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }));
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    fetchSession();

    const onLogin = () => fetchSession();
    const onLogout = () =>
      setState({ hasSession: false, user: null, loading: false, mounted: true });

    window.addEventListener('cfb:login', onLogin);
    window.addEventListener('cfb:logout', onLogout);

    return () => {
      window.removeEventListener('cfb:login', onLogin);
      window.removeEventListener('cfb:logout', onLogout);
    };
  }, [fetchSession]);

  return { ...state, refresh };
}

/**
 * Simple hook that just returns hasSession boolean.
 * For use in components that only need the boolean value.
 */
export function useHasSession(): boolean {
  const { hasSession } = useSession();
  return hasSession;
}

/**
 * Returns the authenticated user object, or null if not authenticated.
 */
export function useSessionUser(): SessionUser | null {
  const { user } = useSession();
  return user;
}

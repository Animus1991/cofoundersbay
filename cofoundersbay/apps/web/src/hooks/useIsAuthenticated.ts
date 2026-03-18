'use client';

/**
 * useIsAuthenticated: delegates to useSession for /api/auth/me-backed auth state.
 * The cfb_session cookie is NOT used as the source of truth — the server is.
 */
export { useHasSession as useIsAuthenticated } from './useSession';

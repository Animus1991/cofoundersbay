import { Response } from 'express';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Derive the refresh-token cookie path from the API_PREFIX env var.
 * This keeps the cookie path in sync with the NestJS global prefix so it
 * does not need to be updated when the prefix changes.
 * Example: API_PREFIX=api → path=/api/auth
 */
function refreshCookiePath(): string {
  const prefix = (process.env.API_PREFIX ?? 'api').replace(/^\/|\/$/g, '');
  return `/${prefix}/auth`;
}

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'cfb_access',
  REFRESH_TOKEN: 'cfb_refresh',
  SESSION: 'cfb_session',   // non-httpOnly: JS-readable auth presence indicator
} as const;

export interface CookieConfig {
  accessMaxAge: number;  // seconds
  refreshMaxAge: number; // seconds
  domain?: string;
}

const DEFAULT_CONFIG: CookieConfig = {
  accessMaxAge: 15 * 60,         // 15 min
  refreshMaxAge: 7 * 24 * 60 * 60, // 7 days
};

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAge * 1000, // express uses ms
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  config: Partial<CookieConfig> = {},
) {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const refreshPath = refreshCookiePath();

  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...baseCookieOptions(merged.accessMaxAge),
    ...(merged.domain ? { domain: merged.domain } : {}),
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...baseCookieOptions(merged.refreshMaxAge),
    path: refreshPath, // scoped to auth endpoints; derived from API_PREFIX
    ...(merged.domain ? { domain: merged.domain } : {}),
  });

  // Non-httpOnly session presence cookie — matches refresh token TTL (7 days)
  res.cookie(COOKIE_NAMES.SESSION, '1', {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: merged.refreshMaxAge * 1000,
    ...(merged.domain ? { domain: merged.domain } : {}),
  });
}

export function clearAuthCookies(res: Response, domain?: string) {
  const refreshPath = refreshCookiePath();
  const opts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
    ...(domain ? { domain } : {}),
  };

  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, opts);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...opts, path: refreshPath });
  res.clearCookie(COOKIE_NAMES.SESSION, { httpOnly: false, secure: IS_PROD, sameSite: 'lax', path: '/', ...(domain ? { domain } : {}) });
}

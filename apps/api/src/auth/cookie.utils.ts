import { Response } from 'express';

const IS_PROD = process.env.NODE_ENV === 'production';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'cfb_access',
  REFRESH_TOKEN: 'cfb_refresh',
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

  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...baseCookieOptions(merged.accessMaxAge),
    ...(merged.domain ? { domain: merged.domain } : {}),
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...baseCookieOptions(merged.refreshMaxAge),
    path: '/api/v1/auth', // only sent to auth endpoints
    ...(merged.domain ? { domain: merged.domain } : {}),
  });
}

export function clearAuthCookies(res: Response, domain?: string) {
  const opts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
    ...(domain ? { domain } : {}),
  };

  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, opts);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...opts, path: '/api/v1/auth' });
}

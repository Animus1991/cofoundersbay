import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { extractJwtFromCookieOrHeader } from '../auth/strategies/jwt.strategy';

const PRIVATE_PROXIES = 'loopback, linklocal, uniquelocal';

/**
 * Who a request counts against (docs §120). The default is the address, and
 * behind the web app's proxy every member has the same one, so the whole
 * platform shared one allowance per endpoint.
 *
 * A signed-in member counts as themselves. The token is verified, because the
 * guard runs before authentication and an unchecked one would let anyone mint
 * a fresh allowance per request.
 */
export function throttleTracker(secret: string) {
  const jwt = new JwtService({ secret });
  return (req: Record<string, unknown>): string => {
    const token = extractJwtFromCookieOrHeader(req as unknown as Request);
    if (token) {
      try {
        const payload = jwt.verify<{ sub?: string; type?: string }>(token);
        if (payload.type === 'access' && payload.sub) return `user:${payload.sub}`;
      } catch {
        // Expired or forged: counted by address, like anyone else.
      }
    }
    return `ip:${String(req.ip)}`;
  };
}

/** Express's `trust proxy`: a number of hops, a list of addresses, or the private ranges. */
export function trustProxySetting(value: string | undefined): number | string {
  const setting = value?.trim();
  if (!setting) return PRIVATE_PROXIES;
  return /^\d+$/.test(setting) ? Number(setting) : setting;
}

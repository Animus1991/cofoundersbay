/**
 * Where to go after signing in or signing up.
 *
 * A `redirect` parameter is accepted only as a path inside this app: a
 * leading `//` or `/\` is another host to the browser, and /login or
 * /register would loop. Sign-up goes through onboarding first, so the path
 * waits in sessionStorage and onboarding takes it once at the end - which is
 * how a public need card brings a new member back to that card's board.
 */
const KEY = 'cfb_return_to';

const APP_ORIGIN = 'https://cofounderbay.local';

const SAFE_HOST = /^[a-zA-Z0-9.-]+(?::\d+)?$/;

/** host[:port] only, first entry of a proxy list. A bad value is discarded. */
export function sanitizeHost(value: string | null | undefined): string | null {
  const first = value?.split(',')[0]?.trim();
  return first && SAFE_HOST.test(first) ? first : null;
}

/**
 * Origin for a redirect this server sends.
 *
 * The Host header is the name the request actually arrived on (the tunnel
 * sets it to the public name). `x-forwarded-host` is not read: a visitor
 * can set it, and a login redirect would then leave this site.
 */
export function publicOrigin(input: {
  host: string | null;
  forwardedProto: string | null;
  nextProtocol: string;
  nextHost: string;
}): string {
  const protoHeader = input.forwardedProto?.split(',')[0]?.trim();
  const proto =
    protoHeader === 'http' || protoHeader === 'https'
      ? protoHeader
      : input.nextProtocol.replace(':', '') || 'https';
  const host = sanitizeHost(input.host) ?? input.nextHost;
  return `${proto}://${host}`;
}

export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const path = value.trim();
  // A leading // or a backslash is another host (`new URL('/\\evil.com', origin)`
  // is https://evil.com/). Search params arrive decoded, so `/%5Cevil` is `/\evil`.
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (path.includes('\\') || path.includes('\0') || /%5c/i.test(path) || /\s/.test(path)) return null;
  if (/^\/(login|register)(\/|\?|$)/.test(path)) return null;
  try {
    const url = new URL(path, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN || url.username || url.password) return null;
  } catch {
    return null;
  }
  return path;
}

export function rememberReturnTo(value: string | null | undefined): void {
  const path = safeInternalPath(value);
  try {
    if (path) window.sessionStorage.setItem(KEY, path);
  } catch {
    // Storage blocked: onboarding ends on its usual page.
  }
}

export function takeReturnTo(fallback: string): string {
  try {
    const path = safeInternalPath(window.sessionStorage.getItem(KEY));
    window.sessionStorage.removeItem(KEY);
    return path ?? fallback;
  } catch {
    return fallback;
  }
}

/** Whether a return path is waiting, without taking it. */
export function peekReturnTo(): string | null {
  try {
    return safeInternalPath(window.sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/**
 * Whether a learning resource's link is an ordinary web address.
 *
 * A resource's `url` is shown to every member and followed by its "Start" /
 * "Open" button, and any signed-in member may add a resource. A script URL kept
 * as a link would run with the site's origin when a reader pressed the button
 * (`window.open("javascript:...")` does), so only `http:` and `https:` are
 * kept: no `javascript:`, `data:`, `file:` or `vbscript:`, no credentials in the
 * address, no spaces. The web app checks the same thing before it follows a
 * link (`linkTarget`, apps/web/src/lib/web-url.ts); this is the other half, so
 * a script URL is refused when it is written and never reaches another reader.
 */
const MAX_LENGTH = 2048;

export function isWebAddress(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_LENGTH || /\s/.test(trimmed)) return false;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (url.username || url.password) return false;
  return url.hostname.includes('.');
}

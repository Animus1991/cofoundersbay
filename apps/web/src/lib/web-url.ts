/**
 * A link a person pasted, kept only when it is an ordinary web address.
 * Anything else (a script URL, a data URL, a password in the address) is dropped
 * so a profile video cannot navigate the reader somewhere they did not choose.
 */
export function safeWebUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  let url: URL;
  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  if (!url.hostname.includes('.')) return null;
  return url.toString();
}

/** Where a stored link leads: a page of this platform, or out to the web. */
export type LinkTarget =
  | { kind: 'internal'; path: string }
  | { kind: 'external'; href: string };

/**
 * Where a link somebody stored should take the reader, or `null` when it should
 * take them nowhere.
 *
 * A path that starts with a single slash ("/investors") is a page of this
 * platform. Everything else must be an ordinary web address (`safeWebUrl`); a
 * script URL, a bare "#", a protocol-relative "//host" or a backslash trick is
 * dropped. A learning resource's `url` is typed by whoever added it and opened
 * with `window.open`, and `window.open("javascript:...")` runs the script with
 * this site's origin: the destination has to be checked before the click, not
 * trusted because it came from the API.
 */
export function linkTarget(raw: string | null | undefined): LinkTarget | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) {
    // "/page" is ours; "//host" and "/\host" are another site written to look like a path.
    return /^\/(?![/\\])/.test(trimmed) && !/[\s\\]/.test(trimmed) ? { kind: 'internal', path: trimmed } : null;
  }
  const href = safeWebUrl(trimmed);
  return href ? { kind: 'external', href } : null;
}

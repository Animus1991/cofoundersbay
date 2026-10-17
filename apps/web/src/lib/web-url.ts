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

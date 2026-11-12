/**
 * Whether a request is a prefetch rather than a visit.
 *
 * In a production build Next prefetches every `<Link>` that scrolls into view
 * (`next-router-prefetch: 1`, plus `next-router-segment-prefetch` for the
 * segment tree), and browsers send `Sec-Purpose: prefetch` for their own
 * speculative loads. A prefetch must not change state: the middleware's
 * /demo handoff used to set the demo cookies on the landing page's prefetch
 * of "Try the demo", so every visitor was signed into the demo without a
 * click, and a reload of / took them to /home.
 */
export function isPrefetchRequest(headers: Pick<Headers, 'get'>): boolean {
  if (headers.get('next-router-prefetch')) return true;
  if (headers.get('next-router-segment-prefetch')) return true;
  const purpose = [headers.get('sec-purpose'), headers.get('purpose'), headers.get('x-purpose')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return purpose.includes('prefetch');
}

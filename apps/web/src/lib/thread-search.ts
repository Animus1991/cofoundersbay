import { findTextMatches } from '@cofounderbay/shared';

/**
 * Finding words inside one conversation.
 *
 * The thread's search box filtered messages with a plain `includes`, so
 * «ορους» missed «όρους» and every other message vanished with the context
 * around the hit. These helpers match by the shared rule (`findTextMatches`:
 * accents, case and final sigma ignored; the server's message search uses
 * it too) and report where each hit sits, so the thread can mark it in
 * place and step between hits.
 */

/** Every occurrence of `query` in `text` as [start, end), in the NFC text. */
export function matchRanges(text: string, query: string): Array<[number, number]> {
  return findTextMatches(text, query);
}

/**
 * The ids of the messages that hold the query, oldest first. A message is
 * searched in every text the reader can see for it (a demo message shows a
 * Greek translation beside its English).
 */
export function threadMatches<T extends { id: string }>(
  messages: readonly T[],
  query: string,
  textsOf: (message: T) => readonly string[],
): string[] {
  if (!query.trim()) return [];
  return messages.filter((m) => textsOf(m).some((t) => findTextMatches(t, query).length > 0)).map((m) => m.id);
}

/** Splits text into plain and matched parts, for rendering with <mark>. */
export function highlightParts(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const source = String(text ?? '').normalize('NFC');
  const ranges = findTextMatches(source, query);
  if (!ranges.length) return [{ text: source, hit: false }];
  const parts: Array<{ text: string; hit: boolean }> = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) parts.push({ text: source.slice(at, start), hit: false });
    parts.push({ text: source.slice(start, end), hit: true });
    at = end;
  }
  if (at < source.length) parts.push({ text: source.slice(at), hit: false });
  return parts;
}

/** The next hit to show: `step` -1 goes to an older message, +1 to a newer one, wrapping. */
export function stepMatch(current: number, count: number, step: -1 | 1): number {
  if (count <= 0) return -1;
  if (current < 0) return step < 0 ? count - 1 : 0;
  return (current + step + count) % count;
}

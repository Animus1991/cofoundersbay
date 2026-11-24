import type { NotificationItem } from './api';

/** The types that ask the reader for a decision — they lead the inbox. */
const NEEDS_ACTION_TYPES = new Set(['connection']);

/**
 * «Χρειάζεται ενέργεια»: the unread rows that wait on the reader come out of
 * the date groups and lead the list; everything else keeps its place
 * (docs §132.3). Order inside each half is preserved.
 */
export function needsActionSplit(items: NotificationItem[]): {
  actionable: NotificationItem[];
  rest: NotificationItem[];
} {
  const actionable: NotificationItem[] = [];
  const rest: NotificationItem[] = [];
  for (const n of items) {
    if (!n.readAt && NEEDS_ACTION_TYPES.has(n.type)) actionable.push(n);
    else rest.push(n);
  }
  return { actionable, rest };
}

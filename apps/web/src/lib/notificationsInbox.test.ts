import { describe, expect, it } from 'vitest';
import { needsActionSplit } from './notifications-inbox';
import type { NotificationItem } from './api';

/* docs §132.3: «Χρειάζεται ενέργεια» — the unread rows that wait on a
   decision lead the inbox, out of the date groups. */

const n = (id: string, type: string, read: boolean): NotificationItem => ({
  id,
  type,
  title: id,
  body: null,
  link: null,
  meta: null,
  createdAt: '2026-10-20T09:00:00Z',
  readAt: read ? '2026-10-21T09:00:00Z' : null,
});

describe('needsActionSplit', () => {
  it('lifts the unread request rows ahead of the date groups', () => {
    const { actionable, rest } = needsActionSplit([
      n('old-connection', 'connection', true),
      n('unread-system', 'system', false),
      n('unread-connection', 'connection', false),
      n('unread-message', 'message', false),
    ]);
    expect(actionable.map((i) => i.id)).toEqual(['unread-connection']);
    expect(rest.map((i) => i.id)).toEqual(['old-connection', 'unread-system', 'unread-message']);
  });

  it('a read request is not actionable, and an empty inbox splits empty', () => {
    const { actionable, rest } = needsActionSplit([n('read-conn', 'connection', true)]);
    expect(actionable).toEqual([]);
    expect(rest).toHaveLength(1);
    expect(needsActionSplit([])).toEqual({ actionable: [], rest: [] });
  });
});

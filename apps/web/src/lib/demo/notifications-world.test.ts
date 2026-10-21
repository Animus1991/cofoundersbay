import { afterEach, describe, expect, it } from 'vitest';
import { demoNotifications, previewNotificationsApi, resetDemoNotifications } from './notifications-world';
import { resolvePreviewApi } from '../preview-api';

const SEED = [
  { id: 'a', type: 'connection', readAt: null as string | null },
  { id: 'b', type: 'message', readAt: null as string | null },
  { id: 'c', type: 'match', readAt: '2026-09-03T09:00:00.000Z' as string | null },
];
const NOW = '2026-10-20T10:00:00.000Z';
const api = (path: string, method = 'GET', body: Record<string, unknown> = {}) => {
  const [pathname, query] = path.split('?');
  return previewNotificationsApi(pathname, new URLSearchParams(query ?? ''), method, body, SEED, NOW) as Record<string, unknown>;
};
const unreadIds = () => demoNotifications(SEED).filter((n) => !n.readAt).map((n) => n.id);

afterEach(() => resetDemoNotifications());

describe('demo notifications keep what the visitor did', () => {
  it('lists with the API filters and counts the unread', () => {
    expect((api('/api/notifications').notifications as unknown[]).length).toBe(3);
    expect((api('/api/notifications?unread=true').notifications as { id: string }[]).map((n) => n.id)).toEqual(['a', 'b']);
    expect((api('/api/notifications?type=match').notifications as { id: string }[]).map((n) => n.id)).toEqual(['c']);
    expect(api('/api/notifications/unread-count')).toEqual({ count: 2 });
  });

  it('marks all read, answers with those ids, and the undo restores exactly them', () => {
    const marked = api('/api/notifications/mark-all-read', 'POST');
    expect(marked).toEqual({ ok: true, ids: ['a', 'b'] });
    expect(api('/api/notifications/unread-count')).toEqual({ count: 0 });
    expect(api('/api/notifications/mark-unread', 'POST', { ids: marked.ids as string[] })).toEqual({ ok: true, count: 2 });
    // The one that was read before stays read.
    expect(unreadIds()).toEqual(['a', 'b']);
  });

  it('marks only the named unread ones read while a category is chosen, and the undo restores them', () => {
    const marked = api('/api/notifications/mark-read', 'POST', { ids: ['b', 'c'] });
    // c was already read: only b changed.
    expect(marked).toEqual({ ok: true, ids: ['b'] });
    expect(unreadIds()).toEqual(['a']);
    api('/api/notifications/mark-unread', 'POST', { ids: marked.ids as string[] });
    expect(unreadIds()).toEqual(['a', 'b']);
    expect(() => api('/api/notifications/mark-read', 'POST', {})).toThrow(/ids/);
  });

  it('refuses an undo without ids', () => {
    expect(() => api('/api/notifications/mark-unread', 'POST', {})).toThrow(/ids/);
    expect(() => api('/api/notifications/mark-unread', 'POST', { ids: [1] })).toThrow(/ids/);
  });

  it('marks one read and deletes one or all', () => {
    api('/api/notifications/a/read', 'PATCH');
    expect(unreadIds()).toEqual(['b']);
    api('/api/notifications/b', 'DELETE');
    expect(demoNotifications(SEED).map((n) => n.id)).toEqual(['a', 'c']);
    api('/api/notifications', 'DELETE');
    expect(demoNotifications(SEED)).toEqual([]);
  });

  it('leaves the preferences and other paths to their own handlers', () => {
    expect(api('/api/notifications/preferences')).toBeUndefined();
    expect(previewNotificationsApi('/api/notificationsx', new URLSearchParams(), 'GET', {}, SEED, NOW)).toBeUndefined();
  });

  it('is what the demo API answers', () => {
    const before = resolvePreviewApi('/api/notifications/unread-count') as { count: number };
    expect(before.count).toBeGreaterThan(0);
    const marked = resolvePreviewApi('/api/notifications/mark-all-read', { method: 'POST' }) as { ids: string[] };
    expect(marked.ids.length).toBe(before.count);
    expect(resolvePreviewApi('/api/notifications/unread-count')).toEqual({ count: 0 });
    resolvePreviewApi('/api/notifications/mark-unread', { method: 'POST', body: JSON.stringify({ ids: marked.ids }) });
    expect(resolvePreviewApi('/api/notifications/unread-count')).toEqual({ count: before.count });
  });
});

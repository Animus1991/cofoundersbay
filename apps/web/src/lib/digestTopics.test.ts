import { beforeEach, describe, expect, it } from 'vitest';
import { DIGEST_TOPIC_COPY, DIGEST_TOPICS, readDigestTopics } from '@cofounderbay/shared';
import { previewNotificationPrefsApi, resetDemoDigest } from '@/lib/demo/notification-prefs-world';

describe('digest topics (shared rule)', () => {
  it('starts every topic on, as the digest job does', () => {
    expect(readDigestTopics([])).toEqual(Object.fromEntries(DIGEST_TOPICS.map((t) => [t, true])));
  });

  it('takes a stored row and ignores a category it does not know', () => {
    const topics = readDigestTopics([{ category: 'updates', isEnabled: false }, { category: 'jobs', isEnabled: false }]);
    expect(topics.updates).toBe(false);
    expect(topics.connections).toBe(true);
    expect('jobs' in topics).toBe(false);
  });

  it('says every topic in both languages', () => {
    for (const t of DIGEST_TOPICS) {
      const c = DIGEST_TOPIC_COPY[t];
      expect(c.en && c.el && c.detailEn && c.detailEl).toBeTruthy();
      expect(c.el).toMatch(/[Α-ω]/);
    }
  });
});

describe('demo /api/digests/preferences', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetDemoDigest();
  });

  const get = () => (previewNotificationPrefsApi('/api/digests/preferences', 'GET', {}) as { preferences: Record<string, boolean> }).preferences;

  it('answers the API shape: cadence booleans and every topic on', () => {
    const p = get();
    expect(p.daily || p.weekly || p.monthly).toBe(false);
    for (const t of DIGEST_TOPICS) expect(p[t]).toBe(true);
  });

  it('changes only the topic a body names, and agrees with the digest switch', () => {
    previewNotificationPrefsApi('/api/digests/preferences', 'POST', { updates: false });
    expect(get().updates).toBe(false);
    expect(get().messages).toBe(true);
    previewNotificationPrefsApi('/api/notifications/preferences', 'PATCH', { digestFrequency: 'weekly' });
    expect(get().weekly).toBe(true);
    expect(get().updates).toBe(false);
  });

  it('refuses two cadences at once', () => {
    expect(() => previewNotificationPrefsApi('/api/digests/preferences', 'POST', { daily: true, monthly: true })).toThrow();
  });
});

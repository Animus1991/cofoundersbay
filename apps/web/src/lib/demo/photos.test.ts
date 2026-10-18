import { describe, expect, it } from 'vitest';
import { attachDemoPhotos, demoCover } from './photos';
import { resolvePreviewApi } from '@/lib/preview-api';

describe('demo photos', () => {
  it('gives an event its cover and leaves a real URL alone', () => {
    const filled = attachDemoPhotos({ id: 'ev-demo-day', coverImageUrl: null });
    expect(filled.coverImageUrl).toBe(demoCover('ev-demo-day'));
    expect(filled.coverImageUrl).toBe('https://picsum.photos/seed/ev-demo-day/800/450');
    expect(attachDemoPhotos({ id: 'ev-demo-day', coverImageUrl: 'https://example.test/c.jpg' }).coverImageUrl).toBe('https://example.test/c.jpg');
  });

  it('gives a person no demo photo, so the product shows their initials (a random scene is not a person)', () => {
    const filled = attachDemoPhotos({
      id: 'ev-demo-day',
      coverImageUrl: null,
      host: { id: 'user-sarah', displayName: 'Dr. Sarah Kim', avatarUrl: null },
    });
    expect(filled.coverImageUrl).toContain('picsum.photos');
    expect((filled.host as { avatarUrl: string | null }).avatarUrl).toBeNull();
    expect(attachDemoPhotos({ id: 'user-elena', displayName: 'Elena', avatarUrl: null }).avatarUrl).toBeNull();
    // A person who had no photo field does not get one either.
    expect('avatarUrl' in attachDemoPhotos({ id: 'user-marcus', displayName: 'Marcus Chen' })).toBe(false);
  });

  it('keeps a real uploaded portrait', () => {
    expect(attachDemoPhotos({ id: 'user-elena', avatarUrl: 'https://example.test/a.jpg' }).avatarUrl).toBe('https://example.test/a.jpg');
  });

  it('serves demo events with covers and people without picsum portraits', () => {
    const events = resolvePreviewApi('/api/events') as { events: Array<{ coverImageUrl: string; host: { avatarUrl: string | null } }> };
    expect(events.events.length).toBeGreaterThan(0);
    expect(events.events.every((e) => e.coverImageUrl.startsWith('https://picsum.photos/'))).toBe(true);
    expect(events.events.every((e) => !String(e.host?.avatarUrl ?? '').includes('picsum.photos'))).toBe(true);

    const me = resolvePreviewApi('/api/me/profile') as { profile: { avatarUrl: string | null } };
    expect(String(me.profile?.avatarUrl ?? '')).not.toContain('picsum.photos');

    const feed = resolvePreviewApi('/api/feed/personalized') as { posts: Array<{ author: { avatarUrl: string | null } }> };
    expect(String(feed.posts[0]?.author.avatarUrl ?? '')).not.toContain('picsum.photos');
  });
});

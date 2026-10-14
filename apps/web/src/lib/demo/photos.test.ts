import { describe, expect, it } from 'vitest';
import { attachDemoPhotos, demoPortrait } from './photos';
import { resolvePreviewApi } from '@/lib/preview-api';

describe('demo photos', () => {
  it('fills an empty portrait from the person id and leaves a real URL alone', () => {
    const filled = attachDemoPhotos({ id: 'user-elena', displayName: 'Elena', avatarUrl: null });
    expect(filled.avatarUrl).toBe(demoPortrait('user-elena'));
    expect(filled.avatarUrl).toBe('https://picsum.photos/seed/elena/200/200');
    expect(attachDemoPhotos({ id: 'user-elena', avatarUrl: 'https://example.test/a.jpg' }).avatarUrl).toBe('https://example.test/a.jpg');
  });

  it('gives a cover to an event and a portrait to a person who had no photo field', () => {
    const filled = attachDemoPhotos({
      id: 'ev-demo-day',
      coverImageUrl: null,
      host: { id: 'user-sarah', displayName: 'Dr. Sarah Kim' },
    });
    expect(filled.coverImageUrl).toBe('https://picsum.photos/seed/ev-demo-day/800/450');
    expect((filled.host as unknown as { avatarUrl: string }).avatarUrl).toBe('https://picsum.photos/seed/sarah/200/200');
  });

  it('does not put the demo user id on a public author who has no id', () => {
    const filled = attachDemoPhotos({
      displayName: 'Alex Demo',
      headline: 'Founder',
      avatarUrl: null,
    });
    expect(JSON.stringify(filled)).not.toMatch(/preview-demo-user|"id"/);
    expect(filled.avatarUrl).toContain('picsum.photos');
  });

  it('serves demo events, people and programmes with photos', () => {
    const events = resolvePreviewApi('/api/events') as { events: Array<{ coverImageUrl: string; host: { avatarUrl: string } }> };
    expect(events.events.length).toBeGreaterThan(0);
    expect(events.events.every((e) => e.coverImageUrl.startsWith('https://picsum.photos/'))).toBe(true);
    expect(events.events.every((e) => e.host.avatarUrl.startsWith('https://picsum.photos/'))).toBe(true);

    const me = resolvePreviewApi('/api/me/profile') as { profile: { avatarUrl: string } };
    expect(me.profile.avatarUrl).toBe('https://picsum.photos/seed/alex/200/200');

    const feed = resolvePreviewApi('/api/feed/personalized') as { posts: Array<{ author: { avatarUrl: string } }> };
    expect(feed.posts[0]?.author.avatarUrl).toBe('https://picsum.photos/seed/elena/200/200');
  });
});

import { describe, expect, it } from 'vitest';
import {
  DEMO_ACCOUNT_PHOTO,
  attachDemoPhotos,
  demoAgentPhoto,
  demoCover,
  demoLogo,
  demoPortrait,
  photoThemeOf,
  themePhotos,
  type PhotoTheme,
} from './photos';
import { resolvePreviewApi } from '@/lib/preview-api';

const photoIdOf = (url: string | null | undefined) => /photo-([0-9a-f-]+)\?/.exec(url ?? '')?.[1] ?? null;
const isFrom = (url: string | null | undefined, theme: PhotoTheme) => themePhotos(theme).includes(photoIdOf(url) ?? '');

describe('demo photos: what a cover is about', () => {
  it.each([
    ['Βραδιά παρουσιάσεων ιδρυτών Αθήνας', 'stage'],
    ['Athens Founder Pitch Night', 'stage'],
    ['Ώρες γραφείου για χρηματοδότηση', 'meeting'],
    ['Εργαστήριο ανακάλυψης προϊόντος', 'workshop'],
    ['Καφές ιδρυτών — Θεσσαλονίκη', 'coffee'],
    ['Λειτουργίες AI χωρίς ομάδα δεδομένων', 'ai'],
    ['Shipping AI features without a data team', 'ai'],
    ['SaaS Metrics Meetup #14', 'networking'],
    ['Πρόγραμμα Κλίματος και Ενέργειας 2026', 'energy'],
    ['Επιταχυντής seed · Φθινόπωρο 2026', 'office'],
    ['Pre-Seed Fundraising', 'fundraising'],
    ['B2B Sales for Technical Founders', 'deal'],
    ['Women Founders Greece', 'women'],
    ['Athens Founders', 'athens'],
    ['Product & Design Craft', 'design'],
    ['System Design for Startups', 'cloud'],
    ['Kyma Energy', 'energy'],
    ['Brightharbor Legal', 'legal'],
  ] as const)('%s → %s', (title, theme) => {
    expect(photoThemeOf(title)).toBe(theme);
  });

  it('matches short words whole, so "said" is not about AI and "domain" not about AI either', () => {
    expect(photoThemeOf('She said the domain was taken')).toBeNull();
    expect(photoThemeOf('AI Builders EU')).toBe('ai');
  });

  it('gives an event a cover of its subject, the same on every page, and leaves a real URL alone', () => {
    const event = { id: 'ev-pitch', title: 'Athens Founder Pitch Night', startsAt: '2026-10-23T19:00:00Z', coverImageUrl: null };
    const filled = attachDemoPhotos(event);
    expect(filled.coverImageUrl).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    expect(isFrom(filled.coverImageUrl, 'stage')).toBe(true);
    expect(attachDemoPhotos(event).coverImageUrl).toBe(filled.coverImageUrl);
    expect(attachDemoPhotos({ ...event, coverImageUrl: 'https://example.test/c.jpg' }).coverImageUrl).toBe('https://example.test/c.jpg');
  });

  it('falls back on the kind of thing when the title says nothing', () => {
    expect(isFrom(attachDemoPhotos({ id: 'ev-x', title: 'Evening #3', startsAt: '2026-11-01', coverImageUrl: '' }).coverImageUrl, 'networking')).toBe(true);
    expect(isFrom(attachDemoPhotos({ id: 'g-x', name: 'The Porch', memberCount: 12, coverImageUrl: null }).coverImageUrl, 'team')).toBe(true);
    expect(isFrom(demoCover('anything-at-all'), 'office')).toBe(true);
  });

  it('gives an organisation without a logo a square picture of its sector', () => {
    const logo = attachDemoPhotos({ id: 'org-kyma', name: 'Kyma Energy', logoUrl: null }).logoUrl;
    expect(isFrom(logo, 'energy')).toBe(true);
    expect(logo).toContain('w=160&h=160');
    expect(isFrom(demoLogo('Taverna OS'), 'food')).toBe(true);
  });
});

describe('demo photos: people', () => {
  it('gives every member of the cast a face of their own', () => {
    const names = ['Elena Papadopoulos', 'Marcus Chen', 'Dr. Sarah Kim', 'Sofia Alexiou', 'Nikos Andreou', 'Yannis Petrou', 'Maria Georgiou', 'Giorgos Vlachos', 'Thanos Rigas', 'Ioanna Pappa'];
    const faces = names.map((name) => demoPortrait(name));
    expect(faces.every((url) => url?.startsWith('https://images.unsplash.com/photo-') && url.includes('crop=faces'))).toBe(true);
    expect(new Set(faces).size).toBe(names.length);
    // The title is not part of the name.
    expect(demoPortrait('Dr. Sarah Kim')).toBe(demoPortrait('Sarah Kim'));
  });

  it('puts a face to an unlisted name only when the first name says whose', () => {
    expect(demoPortrait('Georgia Lambrou')).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(demoPortrait('Georgia Lambrou')).toBe(demoPortrait('Georgia Lambrou'));
    expect(demoPortrait('Κατερίνα Ζάχου')).not.toBeNull();
    expect(demoPortrait('Chris M.')).toBeNull();
    expect(demoPortrait('Aegean Venture Lab')).toBeNull();
    expect(demoPortrait('')).toBeNull();
  });

  it('keeps the reader\'s own account neutral', () => {
    expect(demoPortrait('Alex Demo')).toBe(DEMO_ACCOUNT_PHOTO);
    expect(demoPortrait('preview-demo-user')).toBe(DEMO_ACCOUNT_PHOTO);
    expect(attachDemoPhotos({ userId: 'preview-demo-user', displayName: 'Alex', avatarUrl: null }).avatarUrl).toBe(DEMO_ACCOUNT_PHOTO);
  });

  it('fills a person\'s empty photo field, adds one when there is none, and keeps an uploaded one', () => {
    const host = attachDemoPhotos({ id: 'user-sarah', displayName: 'Dr. Sarah Kim', avatarUrl: null });
    expect(host.avatarUrl).toBe(demoPortrait('Sarah Kim'));
    expect((attachDemoPhotos({ id: 'user-marcus', displayName: 'Marcus Chen' }) as { avatarUrl?: string }).avatarUrl).toBe(demoPortrait('Marcus Chen'));
    expect(attachDemoPhotos({ id: 'user-elena', displayName: 'Elena Papadopoulos', avatarUrl: 'https://example.test/a.jpg' }).avatarUrl).toBe('https://example.test/a.jpg');
    // An organisation named like a group of people gets no face.
    expect('avatarUrl' in attachDemoPhotos({ id: 'g-athens', displayName: 'Athens Founders' })).toBe(false);
  });

  it('reads the name that goes with a prefixed field (clientAvatar → clientName)', () => {
    const inquiry = attachDemoPhotos({ id: 'inq-1', clientName: 'Tom Brown', clientAvatar: '' });
    expect(inquiry.clientAvatar).toBe(demoPortrait('Tom Brown'));
  });

  it('gives a search result for a person a portrait, not a cover', () => {
    const hit = attachDemoPhotos({ id: 'hit-elena', type: 'person', title: 'Elena Papadopoulos', imageUrl: null });
    expect(hit.imageUrl).toBe(demoPortrait('Elena Papadopoulos'));
  });

  it('shows each assistant agent with a photo of what it helps with', () => {
    expect(photoIdOf(demoAgentPhoto('pitch-coach'))).toBe(themePhotos('stage')[0]);
    expect(demoAgentPhoto('unknown-agent')).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });
});

describe('demo photos: the demo API', () => {
  it('serves events with covers of their subject and hosts with faces', () => {
    const { events } = resolvePreviewApi('/api/events') as { events: Array<{ title: string; coverImageUrl: string; host?: { avatarUrl?: string | null } }> };
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.coverImageUrl.startsWith('https://images.unsplash.com/'))).toBe(true);
    expect(events.filter((e) => e.host).every((e) => String(e.host?.avatarUrl ?? '').startsWith('https://'))).toBe(true);
  });

  it('shows the account with its neutral picture', () => {
    const me = resolvePreviewApi('/api/me/profile') as { profile?: { avatarUrl?: string | null }; avatarUrl?: string | null };
    expect(me.profile?.avatarUrl ?? me.avatarUrl).toBe(DEMO_ACCOUNT_PHOTO);
  });

  it('leaves no person with a known first name without a photo', () => {
    const paths = [
      '/api/events', '/api/feed/personalized', '/api/connections', '/api/matching/recommendations', '/api/mentorship/mentors',
      '/api/messages/conversations', '/api/notifications', '/api/search/profiles', '/api/groups', '/api/investor/deals',
      '/api/mentorship/requests/received', '/api/mentor/bookings',
    ];
    const missing: string[] = [];
    let checked = 0;
    const visit = (value: unknown, where: string) => {
      if (Array.isArray(value)) return value.forEach((item) => visit(item, where));
      if (!value || typeof value !== 'object') return;
      const obj = value as Record<string, unknown>;
      const name = typeof obj.displayName === 'string' ? obj.displayName : null;
      const photoKeys = ['avatarUrl', 'avatar', 'profilePhoto', 'photoUrl'];
      if (name && demoPortrait(name) && (obj.id || obj.userId || photoKeys.some((key) => key in obj))) {
        checked += 1;
        if (!photoKeys.some((key) => typeof obj[key] === 'string' && String(obj[key]).startsWith('https://'))) missing.push(`${where}: ${name}`);
      }
      Object.values(obj).forEach((child) => visit(child, where));
    };
    for (const path of paths) visit(resolvePreviewApi(path), path);
    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(20);
  });
});

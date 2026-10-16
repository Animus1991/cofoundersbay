/**
 * Stable photos for the demo, from the same service the studio prototype uses
 * (`https://picsum.photos/seed/…`). A seed is the person's id, so Elena is
 * always the same portrait and a real uploaded URL is never replaced.
 */

const PORTRAIT_KEYS = new Set([
  'avatarUrl',
  'logoUrl',
  'providerLogo',
  'providerAvatar',
  'profilePhoto',
  'photoUrl',
  'photoURL',
  'avatar',
]);

const COVER_KEYS = new Set(['coverImageUrl', 'imageUrl', 'heroImageUrl']);

function portraitSeed(raw: string): string {
  const id = raw.trim();
  if (id === 'preview-demo-user' || id === 'me' || id === 'you') return 'alex';
  return id.replace(/^(user-|hit-)/, '');
}

export function demoPortrait(seed: string, size = 200): string {
  return `https://picsum.photos/seed/${encodeURIComponent(portraitSeed(seed))}/${size}/${size}`;
}

export function demoCover(seed: string, width = 800, height = 450): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed.trim())}/${width}/${height}`;
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function portraitSeedOf(obj: Record<string, unknown>): string | null {
  // userId wins over a profile-row id, so Alex's portrait matches the one in the menu.
  return textOf(obj.userId) ?? textOf(obj.id) ?? textOf(obj.slug) ?? textOf(obj.displayName) ?? textOf(obj.name) ?? textOf(obj.fullName);
}

function coverSeedOf(obj: Record<string, unknown>): string | null {
  return textOf(obj.id) ?? textOf(obj.slug) ?? textOf(obj.title) ?? textOf(obj.name) ?? textOf(obj.displayName);
}

function isPerson(obj: Record<string, unknown>): boolean {
  return textOf(obj.displayName) != null && (textOf(obj.id) != null || textOf(obj.userId) != null);
}

function fill(obj: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if ((PORTRAIT_KEYS.has(key) || COVER_KEYS.has(key)) && (value === null || value === '')) {
      const seed = PORTRAIT_KEYS.has(key) ? portraitSeedOf(obj) : coverSeedOf(obj);
      next[key] = seed ? (PORTRAIT_KEYS.has(key) ? demoPortrait(seed) : demoCover(seed)) : value;
    } else {
      next[key] = walk(value);
    }
  }
  if (!('avatarUrl' in next) && isPerson(obj)) {
    const seed = textOf(obj.id) ?? textOf(obj.userId);
    if (seed) next.avatarUrl = demoPortrait(seed);
  }
  return next;
}

function walk(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(walk);
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  return fill(value as Record<string, unknown>);
}

/** Copies a demo payload and fills empty photo fields. A URL already set stays. */
export function attachDemoPhotos<T>(value: T): T {
  return walk(value) as T;
}

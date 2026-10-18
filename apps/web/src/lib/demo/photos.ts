/**
 * Stable cover photos for the demo, from the same service the studio prototype
 * uses (`https://picsum.photos/seed/…`): an event, a startup or a programme
 * gets a picture of a place, the same one every time, and a real uploaded URL
 * is never replaced.
 *
 * People and logos get no demo photo (2026-10-18, docs §56). A picsum seed is
 * a random scene, so "Marcus Chen" was a swimmer, "Elena" a desk and "Sarah" a
 * bridge at night: on a platform for finding co-founders a person's picture
 * that is not a person read as broken. They show the product's initials
 * instead, exactly as a real member without a photo does.
 */

const COVER_KEYS = new Set(['coverImageUrl', 'imageUrl', 'heroImageUrl']);

export function demoCover(seed: string, width = 800, height = 450): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed.trim())}/${width}/${height}`;
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function coverSeedOf(obj: Record<string, unknown>): string | null {
  return textOf(obj.id) ?? textOf(obj.slug) ?? textOf(obj.title) ?? textOf(obj.name) ?? textOf(obj.displayName);
}

function fill(obj: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (COVER_KEYS.has(key) && (value === null || value === '')) {
      const seed = coverSeedOf(obj);
      next[key] = seed ? demoCover(seed) : value;
    } else {
      next[key] = walk(value);
    }
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

/** Copies a demo payload and fills empty cover fields. A URL already set stays. */
export function attachDemoPhotos<T>(value: T): T {
  return walk(value) as T;
}

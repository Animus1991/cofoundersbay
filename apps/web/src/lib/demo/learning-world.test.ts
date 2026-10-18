import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AREA_READERS } from '../copilot-reads';
import { translate } from '../i18n/translate';
import { resolvePreviewApi } from '../preview-api';
import { learningDuration } from '../learning-format';
import { linkTarget } from '../web-url';
import { DemoRefusal } from './demo-refusal';
import { demoLibrary, previewLearningApi, sampleCompletions, type LibraryItem } from './learning-world';

/**
 * The learning library in the demo: one set of resources for the page and for
 * the assistant.
 *
 * `/learning` drew six sample resources of its own while `GET /api/learning`
 * (what the assistant's "what should I study" answer reads) had no demo
 * handler, so the assistant said "No learning resources yet." beside a page
 * full of them. Both now read the same six, with the real endpoint's rules.
 */

type List = { resources: LibraryItem[]; total: number; hasMore: boolean };
const list = (query = '') => resolvePreviewApi(`/api/learning${query}`) as List;
const titles = (r: List) => r.resources.map((x) => x.title);
const ids = (r: List) => r.resources.map((x) => x.id);

describe('GET /api/learning in the demo', () => {
  it('lists the six resources, featured first and then newest first', () => {
    const all = list();
    expect(ids(all)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(all.total).toBe(6);
    expect(all.hasMore).toBe(false);
    expect(all.resources.slice(0, 2).every((r) => r.isFeatured)).toBe(true);
    expect(all.resources.slice(2).every((r) => !r.isFeatured)).toBe(true);
    const times = all.resources.slice(2).map((r) => Date.parse(r.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it('carries every field the list endpoint carries, and the length in minutes', () => {
    const [first] = list().resources;
    expect(Object.keys(first).sort()).toEqual([
      'author', 'category', 'createdAt', 'description', 'difficulty', 'duration', 'id', 'imageUrl', 'isFeatured', 'tags', 'title', 'type', 'url',
    ]);
    expect(first.duration).toBe(45);
    expect(typeof first.imageUrl).toBe('string');
  });

  it('narrows by category, type, difficulty and featured, as the service does', () => {
    expect(ids(list('?category=Sales'))).toEqual(['4']);
    expect(ids(list('?type=course'))).toEqual(['2', '5']);
    expect(ids(list('?difficulty=advanced'))).toEqual(['3', '6']);
    expect(ids(list('?featured=true'))).toEqual(['1', '2']);
    expect(ids(list('?featured=false'))).toEqual(['3', '4', '5', '6']);
    expect(ids(list('?type=course&difficulty=beginner'))).toEqual(['2']);
    // A category is matched exactly, as the database matches it.
    expect(list('?category=sales').resources).toEqual([]);
  });

  it('searches title, description and author without regard to case, and not the tags', () => {
    expect(ids(list('?search=SEED'))).toEqual(['1']); // title
    expect(ids(list('?search=hate%20selling'))).toEqual(['4']); // description
    expect(ids(list('?search=zhang'))).toEqual(['6']); // author
    // "Validation" is a tag of the MVP course; its text says "validating", not "validation".
    expect(list('?search=validation').resources).toEqual([]);
    expect(ids(list('?search=validating'))).toEqual(['2']);
  });

  it('counts the narrowed set before cutting it, and says whether more lies beyond', () => {
    const first = list('?limit=4');
    expect(ids(first)).toEqual(['1', '2', '3', '4']);
    expect(first.total).toBe(6);
    expect(first.hasMore).toBe(true);
    const rest = list('?limit=4&offset=4');
    expect(ids(rest)).toEqual(['5', '6']);
    expect(rest.total).toBe(6);
    expect(rest.hasMore).toBe(false);
    expect(list('?limit=0').resources).toEqual([]);
    expect(list('?limit=0').hasMore).toBe(true);
    // A limit that is not a number is the default, not an error.
    expect(list('?limit=lots')).toMatchObject({ total: 6, hasMore: false });
    expect(list('?category=Nothing')).toEqual({ resources: [], total: 0, hasMore: false });
  });

  it('keeps one answer apart from the next: a narrowed read does not change the library', () => {
    list('?category=Sales');
    expect(list().total).toBe(6);
  });
});

describe('GET /api/learning/categories and /:id in the demo', () => {
  it('lists each category once', () => {
    expect(resolvePreviewApi('/api/learning/categories')).toEqual({
      categories: ['Fundraising', 'Product', 'Marketing', 'Sales', 'Leadership', 'Tech'],
    });
  });

  it('returns one resource with the fields only the detail carries', () => {
    const one = resolvePreviewApi('/api/learning/2') as LibraryItem & { isActive: boolean; updatedAt: string };
    expect(one.title).toBe('Building Your First MVP in 30 Days');
    expect(one.isActive).toBe(true);
    expect(typeof one.updatedAt).toBe('string');
  });

  it('refuses a resource that is not there, in the API’s shape', () => {
    expect(() => previewLearningApi('/api/learning/nope', new URLSearchParams(), 'GET', Date.now())).toThrow(DemoRefusal);
    try {
      previewLearningApi('/api/learning/nope', new URLSearchParams(), 'GET', Date.now());
    } catch (error) {
      expect((error as DemoRefusal).status).toBe(404);
      expect((error as DemoRefusal).message).toBe('Learning resource not found');
    }
  });

  it('answers only these reads; a write or another path is left to its own handler', () => {
    const now = Date.now();
    expect(previewLearningApi('/api/learning', new URLSearchParams(), 'POST', now)).toBeUndefined();
    expect(previewLearningApi('/api/learning/1', new URLSearchParams(), 'DELETE', now)).toBeUndefined();
    expect(previewLearningApi('/api/learning/1/extra', new URLSearchParams(), 'GET', now)).toBeUndefined();
    expect(previewLearningApi('/api/learningfoo', new URLSearchParams(), 'GET', now)).toBeUndefined();
    expect(previewLearningApi('/api/learning-paths', new URLSearchParams(), 'GET', now)).toBeUndefined();
    // A write still gets the generic write answer rather than an error.
    expect(() => resolvePreviewApi('/api/learning', { method: 'POST', body: JSON.stringify({ title: 'x', url: 'https://x.example' }) })).not.toThrow();
  });
});

describe('the samples themselves', () => {
  const library = demoLibrary();

  it('have unique ids, real difficulties, and a length the card can print', () => {
    expect(new Set(library.map((r) => r.id)).size).toBe(library.length);
    for (const r of library) {
      expect(['beginner', 'intermediate', 'advanced'], r.id).toContain(r.difficulty);
      expect(learningDuration(r.duration, r.type), r.id).toBeTruthy();
      expect(r.title.trim().length, r.id).toBeGreaterThan(5);
      expect(r.tags.length, r.id).toBeGreaterThan(0);
    }
  });

  it('use only the formats the library has, plus the one the page calls a guide', () => {
    const library7 = ['article', 'video', 'course', 'podcast', 'book', 'tool', 'template'];
    const odd = library.filter((r) => !library7.includes(r.type));
    // `guide` is not in the library's enum (schema.prisma); the two samples that
    // carry it are what gives the page's Guides filter something to show.
    expect([...new Set(odd.map((r) => r.type))]).toEqual(['guide']);
    expect(odd.map((r) => r.id)).toEqual(['1', '6']);
  });

  it('send "Start" and "Open" somewhere real: a page of this platform, never "#"', () => {
    for (const r of library) {
      const target = linkTarget(r.url);
      expect(target, r.id).toEqual({ kind: 'internal', path: r.url });
    }
  });

  it('carry no year that would age the demo', () => {
    for (const r of library) expect(`${r.title} ${r.description}`, r.id).not.toMatch(/\b20\d\d\b/);
  });

  it('give a completion count to each sample and to nothing else', () => {
    for (const r of library) expect(sampleCompletions(r.id), r.id).toBeGreaterThan(0);
    expect(sampleCompletions('0a3c4e52-real-uuid')).toBeUndefined();
  });
});

describe('the assistant reads what the page lists', () => {
  const en = { t: (s: string, v?: Record<string, string | number>) => translate('en', s, v), locale: 'en' };
  const el = { t: (s: string, v?: Record<string, string | number>) => translate('el', s, v), locale: 'el' };

  beforeEach(() => window.localStorage.setItem('cfb_demo_data', '1'));
  afterEach(() => window.localStorage.removeItem('cfb_demo_data'));

  it('answers with the featured resources instead of "No learning resources yet."', async () => {
    const result = await AREA_READERS.get_learning({}, en);
    expect(result.section).not.toBe('No learning resources yet.');
    expect(result.section).toContain('Learning resources:');
    // The featured two lead the page and are what the assistant offers first.
    expect(result.section).toContain('The Complete Guide to Seed Fundraising');
    expect(result.section).toContain('Building Your First MVP in 30 Days');
    expect(result.section).toContain('45 min');
    expect(result.section).toContain('Sarah Chen');
    expect(result.citations.map((c) => c.label)).toEqual(['The Complete Guide to Seed Fundraising', 'Building Your First MVP in 30 Days']);
  });

  it('names a format and a level in the reader’s language, the guide format included', async () => {
    const greek = await AREA_READERS.get_learning({}, el);
    expect(greek.section).toContain('• **The Complete Guide to Seed Fundraising** — οδηγός · μέσο επίπεδο · 45 λεπτά · Sarah Chen');
    expect(greek.section).toContain('• **Building Your First MVP in 30 Days** — μάθημα · αρχάριο επίπεδο · 270 λεπτά · Alex Kumar');
    // The sample vocabulary's extra format must not reach a Greek reader in English.
    expect(greek.section).not.toMatch(/— guide ·/);
  });
});

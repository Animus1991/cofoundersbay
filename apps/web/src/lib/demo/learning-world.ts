import type { LearningResourceItem } from '../api';
import { DemoRefusal } from './demo-refusal';
import { demoCover } from './photos';

/**
 * The learning library in the preview demo: one set of resources, read by every
 * surface.
 *
 * The /learning page drew six sample resources of its own, while the endpoint
 * every other reader calls (`GET /api/learning`, which is what the assistant's
 * "what should I study" answer reads) had no demo handler and answered the
 * generic fallback. So the page showed six resources and the assistant said
 * "No learning resources yet." The six now live here once. The page builds its
 * sample cards from them and the handler below answers from them, with the
 * real endpoints' rules (`learning.service.ts`):
 *
 * - `GET /learning` lists active resources, featured first and then newest
 *   first, narrowed by `type`, `category`, `difficulty`, `featured` and a
 *   case-insensitive `search` over title, description and author (not tags),
 *   cut by `limit` (20 unless asked) and `offset`. `total` counts the narrowed
 *   set before the cut, and `hasMore` says whether anything lies beyond it.
 * - `GET /learning/categories` is the distinct categories, `{ categories }`.
 * - `GET /learning/:id` is one resource, or a 404.
 *
 * Reads only. The library's writes (`POST`, `PATCH`, `DELETE`) are answered
 * where the demo answers every write, in preview-api.ts, without keeping
 * anything: a sample is not a record.
 *
 * Two things here are the page's sample vocabulary, not the library's.
 *
 * - `guide` is a format the page has always filtered by. The library's enum
 *   (`LearningResourceType` in schema.prisma) has no such value, so on a real
 *   account the Guides filter stays empty until the library gains one. Two
 *   samples carry it so the filter has something to show in the demo, exactly
 *   as before this module existed.
 * - The completion counts are sample figures: nothing counts completions, so
 *   no API item carries one, and the page shows them beside sample resources
 *   only (`sampleCompletions`).
 *
 * A sample has no outside page to send the reader to, so each link points to
 * the place in the platform where its topic is put to work. It used to be "#",
 * which made "Start" open this very page again in a new tab.
 */

const DAY = 86_400_000;

/** The library as the page types it: the API's item, plus the sample-only `guide` format. */
export type LibraryItem = Omit<LearningResourceItem, 'type'> & { type: LearningResourceItem['type'] | 'guide' };

type Sample = {
  id: string;
  title: string;
  description: string;
  type: LibraryItem['type'];
  category: string;
  /** Minutes, as the API stores them. */
  minutes: number;
  difficulty: LibraryItem['difficulty'];
  author: string;
  /** A page of this platform: where the topic is practised. */
  url: string;
  coverSeed: string;
  isFeatured: boolean;
  tags: string[];
  /** A sample figure; see the note above. */
  completedBy: number;
  /** How long ago it was added: an age, never a date, so a sample stays recent. */
  ageDays: number;
};

const SAMPLES: readonly Sample[] = [
  {
    id: '1',
    title: 'The Complete Guide to Seed Fundraising',
    description: 'Everything you need to know about raising your first round. From pitch deck to term sheets.',
    type: 'guide', category: 'Fundraising', minutes: 45, difficulty: 'intermediate',
    author: 'Sarah Chen', url: '/investors', coverSeed: 'course-seed',
    isFeatured: true, tags: ['Pitch Deck', 'Term Sheets', 'VC'], completedBy: 1247, ageDays: 10,
  },
  {
    id: '2',
    title: 'Building Your First MVP in 30 Days',
    description: 'Step-by-step video course on validating ideas and shipping fast with no-code tools.',
    type: 'course', category: 'Product', minutes: 270, difficulty: 'beginner',
    author: 'Alex Kumar', url: '/builder', coverSeed: 'course-mvp',
    isFeatured: true, tags: ['MVP', 'No-Code', 'Validation'], completedBy: 892, ageDays: 14,
  },
  {
    id: '3',
    // The year it used to carry would have aged the demo; the playbook does not need one.
    title: 'Growth Marketing Playbook',
    description: 'Latest tactics and case studies from successful B2B SaaS companies achieving product-market fit.',
    type: 'article', category: 'Marketing', minutes: 20, difficulty: 'advanced',
    author: 'Maria Santos', url: '/marketplace', coverSeed: 'course-growth',
    isFeatured: false, tags: ['Growth', 'B2B', 'SaaS'], completedBy: 567, ageDays: 21,
  },
  {
    id: '4',
    title: 'Sales for Technical Founders',
    description: 'How to sell when you hate selling. Frameworks and scripts that actually work.',
    type: 'video', category: 'Sales', minutes: 90, difficulty: 'beginner',
    author: 'James Wilson', url: '/mentoring', coverSeed: 'course-sales',
    isFeatured: false, tags: ['Sales', 'Founders', 'B2B'], completedBy: 734, ageDays: 28,
  },
  {
    id: '5',
    title: 'Building High-Performance Teams',
    description: 'Leadership principles for scaling from 5 to 50 people without losing culture.',
    type: 'course', category: 'Leadership', minutes: 180, difficulty: 'intermediate',
    author: 'David Park', url: '/jobs', coverSeed: 'course-teams',
    isFeatured: false, tags: ['Leadership', 'Culture', 'Hiring'], completedBy: 423, ageDays: 35,
  },
  {
    id: '6',
    title: 'System Design for Startups',
    description: 'Architecture patterns that scale without over-engineering. Real-world examples.',
    type: 'guide', category: 'Tech', minutes: 35, difficulty: 'advanced',
    author: 'Lisa Zhang', url: '/expert-reviews', coverSeed: 'course-systems',
    isFeatured: false, tags: ['Architecture', 'Scaling', 'Backend'], completedBy: 645, ageDays: 42,
  },
];

/** A sample as the library's list endpoint returns it. */
function itemOf(sample: Sample, now: number): LibraryItem {
  return {
    id: sample.id,
    title: sample.title,
    description: sample.description,
    type: sample.type,
    category: sample.category,
    url: sample.url,
    author: sample.author,
    duration: sample.minutes,
    difficulty: sample.difficulty,
    tags: [...sample.tags],
    imageUrl: demoCover(sample.coverSeed, 800, 450, [sample.title, sample.category]),
    isFeatured: sample.isFeatured,
    createdAt: new Date(now - sample.ageDays * DAY).toISOString(),
  };
}

/** The library's order: featured first, then newest first. */
const inLibraryOrder = (a: Sample, b: Sample) => Number(b.isFeatured) - Number(a.isFeatured) || a.ageDays - b.ageDays;

/** Every sample resource, in the library's order, as the list endpoint returns them. */
export function demoLibrary(now: number = Date.now()): LibraryItem[] {
  return [...SAMPLES].sort(inLibraryOrder).map((sample) => itemOf(sample, now));
}

/**
 * The sample completion count for a resource id, when it is one of the
 * samples. Real resources have none, because nothing counts completions.
 */
export function sampleCompletions(id: string): number | undefined {
  return SAMPLES.find((sample) => sample.id === id)?.completedBy;
}

const intOr = (raw: string | null, fallback: number) => {
  const n = raw == null ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/**
 * Answers the three learning reads for the demo, or `undefined` for any other
 * path or method.
 */
export function previewLearningApi(pathname: string, query: URLSearchParams, method: string, now: number): unknown {
  if (method !== 'GET') return undefined;
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] !== 'api' || parts[1] !== 'learning') return undefined;
  const rest = parts.slice(2);

  if (rest.length === 0) {
    const type = query.get('type');
    const category = query.get('category');
    const difficulty = query.get('difficulty');
    const search = query.get('search')?.toLowerCase();
    const featured = query.get('featured');
    const matching = [...SAMPLES]
      .sort(inLibraryOrder)
      .filter((s) => (!type || s.type === type) && (!category || s.category === category) && (!difficulty || s.difficulty === difficulty))
      .filter((s) => featured !== 'true' && featured !== 'false' ? true : s.isFeatured === (featured === 'true'))
      .filter((s) => !search || [s.title, s.description, s.author].some((field) => field.toLowerCase().includes(search)));
    const limit = intOr(query.get('limit'), 20);
    const offset = intOr(query.get('offset'), 0);
    const page = matching.slice(offset, offset + limit);
    return {
      resources: page.map((s) => itemOf(s, now)),
      total: matching.length,
      hasMore: offset + page.length < matching.length,
    };
  }

  if (rest.length === 1 && rest[0] === 'categories') {
    // `distinct` has no order of its own; the library's order is as good as any and keeps the chips where they were.
    return { categories: [...new Set([...SAMPLES].sort(inLibraryOrder).map((s) => s.category))] };
  }

  if (rest.length === 1) {
    const sample = SAMPLES.find((s) => s.id === rest[0]);
    if (!sample) throw new DemoRefusal(404, 'Learning resource not found');
    return { ...itemOf(sample, now), isActive: true, updatedAt: new Date(now - sample.ageDays * DAY).toISOString() };
  }

  return undefined;
}

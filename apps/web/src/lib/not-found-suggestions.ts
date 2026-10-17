import { getPageMeta, PAGE_REGISTRY, type PageMeta } from '@/lib/page-registry';

export type NotFoundSuggestion = {
  path: string;
  title: string;
  titleEl?: string;
};

/** Static pages only. Dynamic patterns are not a place to send someone. */
function staticPages(): PageMeta[] {
  return PAGE_REGISTRY.filter((page) => !page.path.includes('['));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array<number>(b.length + 1);
  const next = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    next[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = next[j]!;
  }
  return prev[b.length]!;
}

/**
 * Pages a mistyped address is probably aiming at.
 * A random path returns nothing, so the 404 keeps its shape.
 * A near miss (one to three edits, tighter for a very short path) returns
 * up to three real pages, closest first.
 */
export function suggestPages(pathname: string): NotFoundSuggestion[] {
  const path = (pathname.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  if (path === '/') return [];
  const limit = path.length < 6 ? 1 : 3;
  const ranked = staticPages()
    .map((page) => ({ page, distance: levenshtein(path, page.path) }))
    .filter((row) => row.distance > 0 && row.distance <= limit)
    .sort((a, b) => a.distance - b.distance || a.page.path.length - b.page.path.length)
    .slice(0, 3);

  return ranked.map(({ page }) => {
    const meta = getPageMeta(page.path) ?? page;
    return { path: page.path, title: meta.title, titleEl: meta.titleEl };
  });
}

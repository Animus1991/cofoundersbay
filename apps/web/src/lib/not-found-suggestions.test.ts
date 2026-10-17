import { describe, expect, it } from 'vitest';
import { suggestPages } from './not-found-suggestions';

describe('suggestPages', () => {
  it('names the page a one-letter miss is aiming at', () => {
    const hits = suggestPages('/matchess');
    expect(hits[0]?.path).toBe('/matches');
    expect(hits[0]?.titleEl).toBeTruthy();
  });

  it('names a missed opportunities path', () => {
    expect(suggestPages('/opportunites').some((hit) => hit.path === '/opportunities')).toBe(true);
  });

  it('returns nothing for a path that is not close to a page', () => {
    expect(suggestPages('/zzzz-not-a-page')).toEqual([]);
  });

  it('ignores a query string and a trailing slash', () => {
    expect(suggestPages('/mentor/sesions/?from=email')[0]?.path).toBe('/mentor/sessions');
  });
});

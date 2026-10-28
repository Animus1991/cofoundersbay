import { describe, expect, it } from 'vitest';
import { publishedMatchReasons, selectPublishedMatches } from './matching.service';

describe('selectPublishedMatches', () => {
  it('keeps the engine number and lets the learning score break a tie only', () => {
    const ranked = selectPublishedMatches([
      { userId: 'low', listScore: 24, score: 0.9 },
      { userId: 'tie-plain', listScore: 40, score: 0.3 },
      { userId: 'tie-open', listScore: 40, score: 0.38 },
      { userId: 'best', listScore: 70, score: 0.2 },
    ]);
    expect(ranked.map((row) => row.userId)).toEqual(['best', 'tie-open', 'tie-plain']);
  });
});

describe('publishedMatchReasons', () => {
  it('publishes the engine reasons and an Open to line the viewer may see', () => {
    expect(publishedMatchReasons({
      listReasons: ['Cofounder match', 'Complementary skills'],
      reasons: ['Complementary roles', 'Open to a co-founder'],
    })).toEqual(['Cofounder match', 'Complementary skills', 'Open to a co-founder']);
  });
});

import { describe, expect, it } from 'vitest';
import { isListableCandidate, publishedMatchReasons, selectPublishedMatches } from './matching.service';

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

describe('isListableCandidate', () => {
  it('offers members with a profile and a name of two letters or more', () => {
    expect(isListableCandidate({ profile: { displayName: 'Elena Papadopoulos' } })).toBe(true);
    expect(isListableCandidate({ profile: { displayName: 'Δώρα' } })).toBe(true);
    expect(isListableCandidate({ profile: { displayName: 'Jo' } })).toBe(true);
  });

  it('leaves out a test sign-up named with one letter, and a member with no profile', () => {
    expect(isListableCandidate({ profile: { displayName: 'r' } })).toBe(false);
    expect(isListableCandidate({ profile: { displayName: ' e. ' } })).toBe(false);
    expect(isListableCandidate({ profile: { displayName: '12' } })).toBe(false);
    expect(isListableCandidate({ profile: null })).toBe(false);
    expect(isListableCandidate({})).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { resolvePreviewApi } from '../preview-api';
import { explainMatch, viewerFacts } from '../match-explain';

type Vs = {
  overall: { score: number; confidence: number };
  breakdown: Array<{ key: string; score: number }>;
  sharedStrengths: Array<{ kind: string; label: string }>;
  frictionPoints: Array<{ key: string; values?: { mine: string; theirs: string } }>;
};
const vs = (userId: string) => resolvePreviewApi(`/api/recommendations/vs/${userId}`) as Vs;

describe('the demo comparison is computed from the two sample profiles', () => {
  it('shows the card’s score and the axes the profiles give data for', () => {
    const elena = vs('user-elena');
    // The engine's number for the pair, as the card shows it (docs §106).
    // It was written by hand as 92.
    expect(elena.overall.score).toBe(70);
    expect(elena.breakdown.map((a) => a.key)).toEqual(['role', 'skills', 'industry', 'location']);
    // Both in Athens: the place fits, and there is nothing about time zones.
    expect(elena.breakdown.find((a) => a.key === 'location')?.score).toBe(100);
    expect(elena.frictionPoints.map((f) => f.key)).toEqual(['stage']);
    expect(elena.frictionPoints[0].values).toEqual({ mine: 'idea', theirs: 'traction' });
    expect(elena.sharedStrengths).toEqual([
      { kind: 'skill', icon: 'terminal', label: 'Product' },
      { kind: 'skill', icon: 'terminal', label: 'Growth' },
    ]);
  });

  it('raises the distance for a member in another country, and leaves out axes it cannot compute', () => {
    const sarah = vs('user-sarah');
    expect(sarah.breakdown.map((a) => a.key)).toEqual(['role', 'skills', 'location']);
    expect(sarah.frictionPoints[0]).toMatchObject({ key: 'location', values: { mine: 'Athens, Greece', theirs: 'London, UK' } });
    expect(sarah.sharedStrengths).toEqual([]);
  });

  it('scores every sample with the matching engine, one number wherever it is shown', () => {
    type Scored = { userId: string; matchScore?: number; matchReasons?: string[] };
    const { suggestions } = resolvePreviewApi('/api/recommendations?limit=50') as { suggestions: Scored[] };
    // Best first, as the API orders recommendations. The hand-written
    // 92, 88, 81 and 76 put Elena first with fewer shared points than Marcus.
    expect(suggestions.map((s) => [s.userId, s.matchScore])).toEqual([
      ['user-marcus', 75],
      ['user-elena', 70],
      ['user-sarah', 50],
      ['user-nikos', 45],
    ]);
    const { hits } = resolvePreviewApi('/api/search/profiles?limit=50') as { hits: Scored[] };
    for (const s of suggestions) {
      expect(vs(s.userId).overall.score).toBe(s.matchScore);
      expect(hits.find((h) => h.userId === s.userId)?.matchScore).toBe(s.matchScore);
    }
    const reasons = (userId: string) => suggestions.find((s) => s.userId === userId)?.matchReasons;
    // A technical co-founder adds what the visitor lacks: it counts now.
    expect(reasons('user-marcus')).toEqual(['Cofounder match', 'Complementary skills', 'Similar stage', 'Same commitment', 'Active recently']);
    // The full role points a mentor or an investor earns are named.
    expect(reasons('user-sarah')?.[0]).toBe('Mentor match');
    expect(reasons('user-nikos')?.[0]).toBe('Investor match');
  });

  it('refuses a member the demo does not have, instead of answering with Elena', () => {
    expect(() => vs('user-nobody')).toThrow('Profile not found');
  });

  it('gives each sample match reasons that are true of the two profiles', () => {
    const me = viewerFacts((resolvePreviewApi('/api/me/profile') as { profile: Parameters<typeof viewerFacts>[0] }).profile);
    const { suggestions } = resolvePreviewApi('/api/recommendations?limit=50') as { suggestions: Array<Parameters<typeof explainMatch>[0] & { userId: string }> };
    const greek = (userId: string) => explainMatch(suggestions.find((s) => s.userId === userId)!, me, { nowMs: Date.now(), termEl: (t) => t }).map((r) => r.el);
    expect(greek('user-elena').slice(0, 2)).toEqual(['Ταιριάζει με την αναζήτησή σας: συνιδρυτής', 'Συμπληρώνει τις δεξιότητές σας: Fundraising']);
    expect(greek('user-elena')).toContain('Ίδια πόλη: Αθήνα');
    // Marcus shares no skill with the visitor; the sample used to say he did.
    expect(greek('user-marcus').some((t) => t.startsWith('Κοινές δεξιότητες'))).toBe(false);
    expect(greek('user-marcus')).toContain('Κοντινά στάδια: Ιδέα και MVP');
    expect(greek('user-nikos')[0]).toBe('Επενδύει σε προ-seed: ταιριάζει στο στάδιό σας, «Ιδέα»');
    expect(greek('user-sarah')[0]).toBe('Ταιριάζει με την αναζήτησή σας: μέντορας');
  });
});

import { describe, expect, it } from 'vitest';
import { followUpsFor } from './copilot-followups';
import { planCopilotTools } from './copilot-planner';

const person = (label: string) => ({ type: 'person' as const, id: 'x', label, href: '/profiles/x' });

describe('follow-up questions', () => {
  it('after a list of people, asks about the first one by name', () => {
    expect(followUpsFor(['get_recommendations'], [person('Marcus Chen')]).map((f) => f.en)).toEqual([
      'Why do I match with Marcus Chen?',
      'Who could introduce me to Marcus Chen?',
    ]);
    expect(followUpsFor(['get_match_detail'], [person('Elena Papadopoulos')]).map((f) => f.en)).toEqual(['Who could introduce me to Elena Papadopoulos?']);
    // Recommendations cite people as matches.
    expect(followUpsFor(['get_recommendations'], [{ ...person('Dr. Sarah Kim'), type: 'match' }])[0].en).toBe('Why do I match with Dr. Sarah Kim?');
  });

  it('offers nothing it cannot answer, and at most two', () => {
    expect(followUpsFor([], [])).toEqual([]);
    expect(followUpsFor(['get_recommendations'], [])).toEqual([]);
    expect(followUpsFor(['get_commitments', 'get_intros', 'get_milestones'], []).length).toBe(2);
  });

  it('plans the intended read for every phrasing, with the demo world\'s names', () => {
    const cases: Array<[string[], string, string]> = [
      [['get_recommendations'], 'Marcus Chen', 'get_match_detail'],
      [['search_people'], 'Elena Papadopoulos', 'get_match_detail'],
      [['get_match_detail'], 'Nikos Andreou', 'get_intros'],
    ];
    for (const [tools, name, tool] of cases) {
      const [first] = followUpsFor(tools, [person(name)]);
      const planned = planCopilotTools(first.en);
      const hit = planned.find((t) => t.name === tool);
      expect(hit, `${first.en} → ${JSON.stringify(planned)}`).toBeTruthy();
      expect(String(hit?.args?.name ?? ''), first.en).toContain(name.split(' ')[0]);
    }
    for (const tools of [['get_profile_viewers'], ['get_commitments'], ['get_intros'], ['get_scout']]) {
      const f = followUpsFor(tools, []);
      expect(f.length, tools[0]).toBeGreaterThan(0);
      expect(planCopilotTools(f[0].en).length, f[0].en).toBeGreaterThan(0);
    }
  });
});

import type { CopilotCitation } from '@/lib/copilot-types';

/**
 * What to ask next, after the assistant has answered.
 *
 * Starters existed only in the empty state, so after the first answer the
 * reader had to know what else to ask. These follow the read that just ran,
 * and name the first person it cited, so "Show my best matches" leads to
 * "Why do I match with Marcus Chen?" and to who could introduce them. Every
 * phrasing is one the rule planner answers with the intended read
 * (`copilotFollowups.test.ts`). English is sent; the Greek is shown.
 */
export type FollowUp = { en: string; el: string };

const AFTER_PEOPLE = new Set(['search_people', 'get_recommendations', 'get_shortlist', 'get_scout', 'get_profile_viewers']);

const PLAIN: Record<string, FollowUp[]> = {
  get_profile_viewers: [{ en: 'What evidence backs my skills?', el: 'Ποια τεκμήρια στηρίζουν τις δεξιότητές μου;' }],
  get_commitments: [{ en: 'Show my warm introductions', el: 'Δείξε μου τις γνωριμίες μου' }],
  get_intros: [{ en: 'Where do my commitments stand and what is waiting on me?', el: 'Τι γίνεται με τις δεσμεύσεις μου;' }],
  get_milestones: [{ en: 'What should I do next?', el: 'Τι να κάνω μετά;' }],
  get_scout: [{ en: 'Show my best matches', el: 'Δείξε τις καλύτερες αντιστοιχίσεις' }],
  get_match_detail: [],
};

/** Up to two next questions for the reads that just ran. */
export function followUpsFor(usedTools: readonly string[] | undefined, citations: readonly CopilotCitation[] | undefined): FollowUp[] {
  const tools = usedTools ?? [];
  // Recommendations cite people as matches; both name a person.
  const person = (citations ?? []).find((c) => (c.type === 'person' || c.type === 'match') && c.label?.trim())?.label?.trim();
  const out: FollowUp[] = [];
  if (person && tools.includes('get_match_detail')) {
    out.push({ en: `Who could introduce me to ${person}?`, el: `Ποιος μπορεί να με συστήσει σε ${person};` });
  } else if (person && tools.some((t) => AFTER_PEOPLE.has(t))) {
    out.push({ en: `Why do I match with ${person}?`, el: `Γιατί ταιριάζω με ${person};` });
    out.push({ en: `Who could introduce me to ${person}?`, el: `Ποιος μπορεί να με συστήσει σε ${person};` });
  }
  for (const tool of tools) for (const f of PLAIN[tool] ?? []) if (!out.some((o) => o.en === f.en)) out.push(f);
  return out.slice(0, 2);
}

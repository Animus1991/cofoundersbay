/**
 * Running matching across a whole cohort (docs §102).
 *
 * The cohort page listed the matches suggested between its members, but
 * nothing ever wrote one: its "Generate Matches" button had become a link to
 * the reader's own Matches page. A run scores the cohort's pairs with the
 * matching engine and keeps the ones worth an introduction. The rules here -
 * which pairs, how many members, what is kept, the words - are shared by the
 * API and the demo.
 */

/** A run scores every pair once; past this a cohort is a directory, not a programme. */
export const COHORT_MATCH_MAX_MEMBERS = 200;
/** Scores are 0-100; a new pair is kept from this score up. A pair already suggested is always rescored. */
export const COHORT_MATCH_MIN_SCORE = 40;

export type CohortMatchRole = 'founder' | 'mentor' | 'investor';
export type CohortMatchMember = { userId: string; role: CohortMatchRole };
export type CohortPairKind = 'founders' | 'founder_mentor' | 'founder_investor';
/** `source` is the founder whose side the score is read from; for two founders, both sides are scored and averaged. */
export type CohortMatchPair = { source: string; target: string; kind: CohortPairKind };

/**
 * The pairs a run scores: founders with each other (each pair once), and
 * every founder with every mentor and every investor of the cohort. Mentors
 * with mentors, investors with investors and mentors with investors are not
 * the introductions a programme makes. A member listed twice counts once.
 */
export function cohortMatchPairs(members: readonly CohortMatchMember[]): CohortMatchPair[] {
  const seen = new Set<string>();
  const unique = members.filter((m) => (seen.has(m.userId) ? false : (seen.add(m.userId), true)));
  const founders = unique.filter((m) => m.role === 'founder').map((m) => m.userId).sort();
  const others = unique.filter((m) => m.role !== 'founder');
  const pairs: CohortMatchPair[] = [];
  for (let i = 0; i < founders.length; i += 1) {
    for (let j = i + 1; j < founders.length; j += 1) pairs.push({ source: founders[i], target: founders[j], kind: 'founders' });
  }
  for (const f of founders) {
    for (const o of others) pairs.push({ source: f, target: o.userId, kind: o.role === 'mentor' ? 'founder_mentor' : 'founder_investor' });
  }
  return pairs;
}

/** Engine scores are 0-1; the cohort stores and shows 0-100. */
export function toCohortScore(engineScore: number): number {
  return Math.max(0, Math.min(100, Math.round(engineScore * 100)));
}

export type CohortRunResult = {
  /** Pairs scored. */
  scored: number;
  /** New suggestions written. */
  created: number;
  /** Suggestions already there, rescored (their status is kept). */
  updated: number;
  /** New pairs under `COHORT_MATCH_MIN_SCORE`, not written. */
  belowThreshold: number;
  ranAt: string;
};

export const COHORT_MATCH_PROBLEM_COPY = {
  too_many_members: {
    en: `A run scores every pair once, so it takes cohorts of up to ${COHORT_MATCH_MAX_MEMBERS} people.`,
    el: `Μια εκτέλεση βαθμολογεί κάθε ζεύγος μία φορά, οπότε δέχεται κύκλους έως ${COHORT_MATCH_MAX_MEMBERS} ατόμων.`,
  },
  no_founders: {
    en: 'There is no founder in this cohort yet: matches are introductions for founders.',
    el: 'Δεν υπάρχει ακόμη ιδρυτής σε αυτόν τον κύκλο: οι αντιστοιχίσεις είναι συστάσεις για ιδρυτές.',
  },
} as const;
export type CohortMatchProblem = keyof typeof COHORT_MATCH_PROBLEM_COPY;

/** One sentence about a run, in both languages. */
export function cohortRunSummary(r: Pick<CohortRunResult, 'scored' | 'created' | 'updated'>): { en: string; el: string } {
  const kept = r.created + r.updated;
  return {
    en: `${r.scored} ${r.scored === 1 ? 'pair' : 'pairs'} scored; ${kept} ${kept === 1 ? 'suggestion' : 'suggestions'} (${r.created} new).`,
    el: `${r.scored} ${r.scored === 1 ? 'ζεύγος βαθμολογήθηκε' : 'ζεύγη βαθμολογήθηκαν'}· ${kept} ${kept === 1 ? 'πρόταση' : 'προτάσεις'} (${r.created} ${r.created === 1 ? 'νέα' : 'νέες'}).`,
  };
}

/**
 * The engine's reasons are written in English (`MatchingService`); this is
 * their Greek, and the demo's. A reason not listed is shown as written.
 */
export const MATCH_REASON_COPY: Record<string, { en: string; el: string }> = {
  'Complementary roles': { en: 'Complementary roles', el: 'Συμπληρωματικοί ρόλοι' },
  'Matching skills & expertise': { en: 'Matching skills & expertise', el: 'Δεξιότητες και εμπειρία που ταιριάζουν' },
  'Aligned goals & vision': { en: 'Aligned goals & vision', el: 'Κοινοί στόχοι και όραμα' },
  'Same region or open to remote': { en: 'Same region or open to remote', el: 'Ίδια περιοχή ή ανοιχτοί σε εξ αποστάσεως' },
  'Related industry or stage': { en: 'Related industry or stage', el: 'Συγγενής κλάδος ή στάδιο' },
  'Highly active on platform': { en: 'Highly active on platform', el: 'Πολύ ενεργοί στην πλατφόρμα' },
  'Same industry': { en: 'Same industry', el: 'Ίδιος κλάδος' },
  'Same stage': { en: 'Same stage', el: 'Ίδιο στάδιο' },
  'Same city': { en: 'Same city', el: 'Ίδια πόλη' },
  'Mentor expertise fits': { en: 'Mentor expertise fits', el: 'Η εξειδίκευση του μέντορα ταιριάζει' },
  'Invests in this industry': { en: 'Invests in this industry', el: 'Επενδύει σε αυτόν τον κλάδο' },
  'Sell to the same operations teams': { en: 'Sell to the same operations teams', el: 'Πουλούν στις ίδιες ομάδες λειτουργιών' },
  'Both hiring a first salesperson': { en: 'Both hiring a first salesperson', el: 'Προσλαμβάνουν και οι δύο τον πρώτο πωλητή' },
};

export function matchReasonCopy(text: string): { en: string; el: string } {
  return MATCH_REASON_COPY[text] ?? { en: text, el: text };
}

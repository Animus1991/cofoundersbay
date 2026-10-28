/**
 * How two members' skills fit together as a team.
 *
 * The engines scored skills by overlap alone: the share of skills both list
 * (Jaccard). For a co-founder platform that ranked a twin above a partner. A
 * founder with Product and Growth scored 0 against a technical co-founder
 * with TypeScript and AI, the person the platform exists to introduce, and
 * two members who listed no skills at all scored a full overlap (Jaccard of
 * two empty sets is 1). The owner decided on 2026-10-28 that this be fixed
 * (docs §106).
 *
 * The fit has two parts:
 * - common ground, 40%: skills both list. One shared skill counts half, two
 *   or more fully;
 * - what the other adds, 60%: a whole family the reader has none of
 *   (technical, business, design) counts fully; otherwise each new skill
 *   counts a third, up to three.
 *
 * With no skills on either side there is nothing to say: `null`, not a score.
 * Pure.
 */

export type SkillFamily = 'technical' | 'business' | 'design' | 'other';

/**
 * How the team skills fit is weighed (docs §106): common ground and what the
 * other adds, and how many skills make each one full. Exported so the page
 * that explains the score reads the engine's own numbers (docs §110).
 */
export const TEAM_SKILLS_FIT = {
  commonWeight: 0.4,
  addsWeight: 0.6,
  /** Shared skills for full common ground. */
  sharedForFull: 2,
  /** Added skills for full "adds", when none of them is a new family. */
  addedForFull: 3,
} as const;

const FAMILY_WORDS: Array<[SkillFamily, RegExp]> = [
  [
    'technical',
    /(engineer|develop|software|programm|coding|devops|back-?end|front-?end|full-?stack|mobile|data|machine learning|(^|\W)ml($|\W)|(^|\W)ai($|\W)|typescript|javascript|python|(^|\W)java($|\W)|react|next\.?js|node|cloud|security|infrastructure|hardware|embedded|blockchain|technical|(^|\W)cto($|\W))/i,
  ],
  ['design', /(design|(^|\W)ux($|\W)|(^|\W)ui($|\W)|brand|visual|figma)/i],
  [
    'business',
    /(product|growth|marketing|sales|business|financ|fundrais|invest|legal|strategy|operations|go-to-market|(^|\W)gtm($|\W)|partnership|community|customer|mentor|leadership|network|recruit|hiring|(^|\W)(ceo|coo|cfo|hr)($|\W))/i,
  ],
];

/**
 * The family a skill belongs to: the catalogue's category when it has one
 * (`Skill.category`: technical, business, design), otherwise read from the
 * name. A skill no word matches is "other" and never counts as a new family.
 */
export function skillFamily(name: string, category?: string | null): SkillFamily {
  const c = (category ?? '').trim().toLowerCase();
  if (c === 'technical' || c === 'business' || c === 'design') return c;
  for (const [family, words] of FAMILY_WORDS) if (words.test(name)) return family;
  return 'other';
}

export type SkillSide = {
  names: readonly string[];
  /** The catalogue category of each name, in the same order, where known. */
  categories?: readonly (string | null | undefined)[];
};

export type TeamSkillsFit = {
  /** 0..1. */
  fit: number;
  /** Skills both list. */
  shared: number;
  /** Skills the other lists and the reader does not. */
  added: number;
  /** The other brings a family the reader has none of. */
  newFamily: boolean;
};

function side(s: SkillSide): Map<string, SkillFamily> {
  const out = new Map<string, SkillFamily>();
  s.names.forEach((name, i) => {
    const key = (name ?? '').trim().toLowerCase();
    if (key && !out.has(key)) out.set(key, skillFamily(name, s.categories?.[i]));
  });
  return out;
}

export function teamSkillsFit(mine: SkillSide, theirs: SkillSide): TeamSkillsFit | null {
  const a = side(mine);
  const b = side(theirs);
  if (a.size === 0 || b.size === 0) return null;
  const shared = [...b.keys()].filter((k) => a.has(k)).length;
  const added = b.size - shared;
  const myFamilies = new Set([...a.values()].filter((f) => f !== 'other'));
  const newFamily = [...b.entries()].some(([k, f]) => !a.has(k) && f !== 'other' && !myFamilies.has(f));
  const common = Math.min(1, shared / TEAM_SKILLS_FIT.sharedForFull);
  const adds = newFamily ? 1 : Math.min(1, added / TEAM_SKILLS_FIT.addedForFull);
  const fit = Math.round((TEAM_SKILLS_FIT.commonWeight * common + TEAM_SKILLS_FIT.addsWeight * adds) * 1000) / 1000;
  return { fit, shared, added, newFamily };
}

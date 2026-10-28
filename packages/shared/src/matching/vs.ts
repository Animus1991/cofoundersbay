/**
 * The parts of a two-person comparison (`GET /api/recommendations/vs/:id`)
 * that read only the two profiles: how well skills, places and stages fit,
 * what the two share, and what is worth discussing.
 *
 * They lived as private methods of the API's matching service, so the demo
 * answered the same endpoint with numbers of its own (a fixed 82 for
 * "industry", 85 for "activity", "Different time zones" for two people in
 * Athens). Here, the API and the demo compute with the same rules. Pure.
 */

import { teamSkillsFit } from './skills';

/**
 * Skills fit for the comparison's "Skills" axis, 0..1: the team fit both
 * engines use (`teamSkillsFit`: common ground 40%, what the other adds 60%).
 * It counted shared skills and five word pairs, so someone who completed the
 * reader's skills (TypeScript beside Product) scored 0% (docs §106). With no
 * skills on either side the axis stays at its neutral 0.4.
 */
export function skillsFit(input: {
  userKeys: string[];
  candidateKeys: string[];
  userNames: string[];
  candidateNames: string[];
  userCategories?: (string | null | undefined)[];
  candidateCategories?: (string | null | undefined)[];
}): number {
  if (!input.userKeys.length || !input.candidateKeys.length) return 0.4;
  const fit = teamSkillsFit(
    { names: input.userNames, categories: input.userCategories },
    { names: input.candidateNames, categories: input.candidateCategories },
  );
  return fit ? fit.fit : 0.4;
}

/** Place fit, 0..1: the same place 1, the same country 0.7, elsewhere 0.3; 0.5 when either is missing. */
export function locationFit(userLocation?: string | null, candidateLocation?: string | null): number {
  if (!userLocation || !candidateLocation) return 0.5;
  if (userLocation.toLowerCase() === candidateLocation.toLowerCase()) return 1.0;
  const uParts = userLocation.toLowerCase().split(',');
  const cParts = candidateLocation.toLowerCase().split(',');
  if (uParts.at(-1)?.trim() === cParts.at(-1)?.trim()) return 0.7;
  return 0.3;
}

/** A company stage as a number, idea 0 to scaling 3; an unknown stage counts as MVP. */
export function stageNumber(stage: string): number {
  return ({ idea: 0, mvp: 1, traction: 2, scaling: 3 } as Record<string, number>)[stage] ?? 1;
}

/** Industry and stage fit, 0..1, from the two role payloads; 0.5 when either is missing. */
export function industryFit(userPayload: unknown, candidatePayload: unknown): number {
  const uP = userPayload as { industry?: unknown; stage?: unknown } | null | undefined;
  const cP = candidatePayload as { industry?: unknown; stage?: unknown } | null | undefined;
  if (!uP || !cP) return 0.5;
  let score = 0.5;
  if (uP.industry && cP.industry && uP.industry === cP.industry) score += 0.3;
  if (uP.stage && cP.stage) {
    const stageDiff = Math.abs(stageNumber(String(uP.stage)) - stageNumber(String(cP.stage)));
    score += Math.max(0, 0.2 - stageDiff * 0.07);
  }
  return Math.min(1, score);
}

export type MatchStrength = { kind: 'skill' | 'theme'; icon: string; label: string };

/**
 * What two people share, as the compatibility views list it: skills first,
 * then themes both profiles write about. `kind` says which, so a page can
 * leave out the skills a reason already names and translate the rest.
 */
export function matchStrengths(sharedSkills: string[], sharedKeywords: string[]): MatchStrength[] {
  const skills = sharedSkills.slice(0, 4).map((name) => ({ kind: 'skill' as const, icon: 'terminal', label: name }));
  const themes = sharedKeywords.slice(0, 4 - skills.length).map((kw) => ({
    kind: 'theme' as const,
    icon: 'lightbulb',
    label: kw.charAt(0).toUpperCase() + kw.slice(1),
  }));
  return [...skills, ...themes];
}

export type MatchFriction = {
  /** What differs: pages say it in the reader's language from this and `values`. */
  key: 'location' | 'stage' | 'tech_overlap' | 'commitment';
  icon: string;
  title: string;
  description: string;
  /** The two sides' own values, the reader's first. */
  values?: { mine: string; theirs: string };
};

const TECH_WORDS = ['technical', 'engineering', 'developer', 'software'];

/**
 * The points worth discussing before working together. The English title and
 * description stay for readers that print them; `key` and `values` let a
 * page say the same in Greek, with the two places, stages or commitments.
 */
export function matchFrictions(input: {
  sourceLocation?: string | null;
  targetLocation?: string | null;
  locationScore: number;
  sourcePayload?: unknown;
  targetPayload?: unknown;
  sourceSkills: string[];
  targetSkills: string[];
}): MatchFriction[] {
  const out: MatchFriction[] = [];
  const { sourceLocation: sourceLoc, targetLocation: targetLoc } = input;
  if (sourceLoc && targetLoc && sourceLoc !== targetLoc && input.locationScore < 0.6) {
    out.push({
      key: 'location',
      icon: 'schedule',
      title: 'Location Difference',
      description: `${sourceLoc} vs ${targetLoc}. Remote coordination may require structured async communication.`,
      values: { mine: sourceLoc, theirs: targetLoc },
    });
  }
  const sP = (input.sourcePayload ?? null) as { stage?: unknown; commitment?: unknown } | null;
  const tP = (input.targetPayload ?? null) as { stage?: unknown; commitment?: unknown } | null;
  if (typeof sP?.stage === 'string' && typeof tP?.stage === 'string' && sP.stage && tP.stage && sP.stage !== tP.stage) {
    out.push({
      key: 'stage',
      icon: 'trending_up',
      title: 'Stage Expectation Gap',
      description: `One party is at ${sP.stage} stage, the other at ${tP.stage}. Align on milestone priorities early.`,
      values: { mine: sP.stage, theirs: tP.stage },
    });
  }
  const technical = (names: string[]) => names.some((n) => TECH_WORDS.some((t) => n.toLowerCase().includes(t)));
  if (technical(input.sourceSkills) && technical(input.targetSkills)) {
    out.push({
      key: 'tech_overlap',
      icon: 'warning_amber',
      title: 'Technical Role Overlap',
      description: 'Both profiles are primarily technical. Consider how business, sales, and growth responsibilities will be covered.',
    });
  }
  if (typeof sP?.commitment === 'string' && typeof tP?.commitment === 'string' && sP.commitment && tP.commitment && sP.commitment !== tP.commitment) {
    out.push({
      key: 'commitment',
      icon: 'hourglass_empty',
      title: 'Commitment Difference',
      description: `Availability mismatch (${sP.commitment} vs ${tP.commitment}). Establish shared expectations on hours and milestones.`,
      values: { mine: sP.commitment, theirs: tP.commitment },
    });
  }
  return out;
}

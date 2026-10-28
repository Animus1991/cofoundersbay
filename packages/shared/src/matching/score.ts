/**
 * Rule-based matching score (0–100) for two profiles.
 * Used for cofounder/founder suggestions. Pure function, no I/O.
 */

import type { ProfileSnapshot, MatchScoreResult, MatchScoreBreakdown, UserRole } from './types';
import { skillFamily, teamSkillsFit } from './skills';

const MAX_SCORE = 100;
const WEIGHTS = {
  roleComplementarity: 25,
  skillsOverlap: 25,
  stageAlignment: 20,
  commitmentAlignment: 15,
  locationProximity: 5,
  recencyBonus: 10,
} as const;

/** Normalize string for comparison. */
function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().trim();
}

/** Complementary roles for cofounder/team matching (founder ↔ founder gets full; founder ↔ mentor/investor gets full). */
function roleComplementarityScore(viewerRole: UserRole, candidateRole: UserRole): number {
  if (viewerRole === 'founder' && candidateRole === 'founder') return WEIGHTS.roleComplementarity; // cofounder match
  if (viewerRole === 'founder' && (candidateRole === 'mentor' || candidateRole === 'investor')) return WEIGHTS.roleComplementarity;
  if ((viewerRole === 'mentor' || viewerRole === 'investor') && candidateRole === 'founder') return WEIGHTS.roleComplementarity;
  if (viewerRole === 'org' && (candidateRole === 'founder' || candidateRole === 'mentor')) return WEIGHTS.roleComplementarity;
  return Math.floor(WEIGHTS.roleComplementarity * 0.5); // same role or other: partial
}

/**
 * Whether a founder candidate fills one of the roles the reader is looking
 * for (`rolesSought`, profile edit's "Looking for": Co-founder, CTO,
 * Designer, Marketing, Sales, Operations, Other).
 *
 * The old table knew "cto", "coo", "business_partner" and looked for a skill
 * literally called "technical": "Co-founder", the first option, matched
 * nobody, so a founder looking for a co-founder lost 40% of the role points
 * against every other founder (docs §106). The words are read as profile
 * edit writes them; a team role is filled by a skill of its family.
 */
function rolesSoughtMatch(
  viewerPayload: Record<string, unknown> | null,
  candidateRole: UserRole,
  candidateSkillNames: string[],
  candidateSkillCategories?: readonly (string | null | undefined)[],
): boolean {
  const raw = viewerPayload?.rolesSought;
  const sought = Array.isArray(raw) ? raw.filter((r): r is string => typeof r === 'string' && r.trim() !== '') : [];
  if (!sought.length) return true;
  const families = new Set(candidateSkillNames.map((n, i) => skillFamily(n, candidateSkillCategories?.[i])));
  const skills = new Set(candidateSkillNames.map(norm));
  const role = norm(candidateRole);
  for (const r of sought) {
    const key = norm(r).replace(/[\s_]+/g, '-');
    if (key === 'other') return true;
    if ((key === 'co-founder' || key === 'cofounder' || key === 'founder' || key === 'business-partner') && role === 'founder') return true;
    if ((key === 'cto' || key === 'technical' || key === 'engineer' || key === 'developer') && families.has('technical')) return true;
    if ((key === 'designer' || key === 'design') && families.has('design')) return true;
    if ((key === 'marketing' || key === 'sales' || key === 'operations' || key === 'coo' || key === 'ceo') && (families.has('business') || skills.has(key))) return true;
    if ((key === 'mentor' || key === 'advisor') && role === 'mentor') return true;
    if ((key === 'investor' || key === 'angel') && role === 'investor') return true;
    if (key === role || skills.has(key)) return true;
  }
  return false;
}

/**
 * Compute match score (0–100) between viewer and candidate profile snapshots.
 * Deterministic and side-effect free.
 */
export function computeMatchScore(viewer: ProfileSnapshot, candidate: ProfileSnapshot): MatchScoreResult {
  const reasons: string[] = [];
  let roleComplementarity = roleComplementarityScore(viewer.role, candidate.role);
  if (viewer.role === 'founder' && candidate.role === 'founder' && !rolesSoughtMatch(viewer.rolePayload, candidate.role, candidate.skillNames, candidate.skillCategories)) {
    roleComplementarity = Math.floor(roleComplementarity * 0.6);
  } else if (viewer.role === 'founder' && candidate.role === 'founder') {
    reasons.push('Cofounder match');
  } else if (roleComplementarity === WEIGHTS.roleComplementarity) {
    // The other full role points, named: they counted without a reason, so
    // a mentor's card said nothing about the role that scored it (§106).
    const named = candidate.role === 'mentor' ? 'Mentor match' : candidate.role === 'investor' ? 'Investor match' : candidate.role === 'founder' ? 'Founder match' : null;
    if (named) reasons.push(named);
  }

  // How the two sets of skills fit as a team (./skills): common ground and
  // what the other adds. No skills on either side: nothing to score (two
  // empty lists used to count as a full overlap, 25 of 25).
  const skills = teamSkillsFit(
    { names: viewer.skillNames, categories: viewer.skillCategories },
    { names: candidate.skillNames, categories: candidate.skillCategories },
  );
  const skillsOverlap = skills ? Math.round(skills.fit * WEIGHTS.skillsOverlap) : 0;
  if (skills && skills.shared > 0) reasons.push('Skills overlap');
  if (skills && skills.added > 0) reasons.push('Complementary skills');

  const viewerStage = (viewer.rolePayload?.stage as string) ?? '';
  const candidateStage = (candidate.rolePayload?.stage as string) ?? '';
  let stageAlignment = 0;
  if (viewerStage && candidateStage) {
    const vs = norm(viewerStage);
    const cs = norm(candidateStage);
    if (vs === cs) {
      stageAlignment = WEIGHTS.stageAlignment;
      reasons.push('Same stage');
    } else {
      const stages = ['idea', 'mvp', 'traction', 'scaling', 'pre_seed', 'seed', 'growth'];
      const vi = stages.indexOf(vs);
      const ci = stages.indexOf(cs);
      if (vi >= 0 && ci >= 0 && Math.abs(vi - ci) <= 1) {
        stageAlignment = Math.floor(WEIGHTS.stageAlignment * 0.5);
        reasons.push('Similar stage');
      }
    }
  }

  const viewerCommitment = norm((viewer.rolePayload?.commitment as string) ?? '');
  const candidateCommitment = norm((candidate.rolePayload?.commitment as string) ?? '');
  let commitmentAlignment = 0;
  if (viewerCommitment && candidateCommitment) {
    if (viewerCommitment === candidateCommitment) {
      commitmentAlignment = WEIGHTS.commitmentAlignment;
      reasons.push('Same commitment');
    } else if (
      (viewerCommitment.includes('full') && candidateCommitment.includes('full')) ||
      (viewerCommitment.includes('part') && candidateCommitment.includes('part'))
    ) {
      commitmentAlignment = Math.floor(WEIGHTS.commitmentAlignment * 0.7);
      reasons.push('Compatible commitment');
    }
  }

  const viewerLoc = norm(viewer.location);
  const candidateLoc = norm(candidate.location ?? '');
  let locationProximity = 0;
  if (viewerLoc && candidateLoc) {
    if (viewerLoc === candidateLoc || viewerLoc.includes(candidateLoc) || candidateLoc.includes(viewerLoc)) {
      locationProximity = WEIGHTS.locationProximity;
      reasons.push('Same or nearby location');
    }
  }

  const now = Date.now();
  const candidateDaysSinceUpdate = (now - candidate.updatedAtMs) / 86400000;
  let recencyBonus = 0;
  if (candidateDaysSinceUpdate <= 7) {
    recencyBonus = WEIGHTS.recencyBonus;
    reasons.push('Active recently');
  } else if (candidateDaysSinceUpdate <= 30) {
    recencyBonus = Math.floor(WEIGHTS.recencyBonus * 0.5);
  }

  const total =
    roleComplementarity +
    skillsOverlap +
    stageAlignment +
    commitmentAlignment +
    locationProximity +
    recencyBonus;
  const score = Math.min(MAX_SCORE, total);

  const breakdown: MatchScoreBreakdown = {
    roleComplementarity,
    skillsOverlap,
    stageAlignment,
    commitmentAlignment,
    locationProximity,
    recencyBonus,
    reasons: reasons.length ? reasons : ['Profile match'],
  };

  return { score, breakdown };
}

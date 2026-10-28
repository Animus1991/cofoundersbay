import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { OPEN_TO_COPY, candidateRoleFor, compareCompatAnswers, computeMatchScore, industryFit, locationFit, matchFrictions, matchStrengths, openToBoost, openToShownTo, roleFit, seekerWants, skillsFit, isHiddenFromSearch, type ProfileSnapshot } from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { OpenToService } from '../open-to/open-to.service';

export interface MatchingCriteria {
  userId: string;
  role?: 'founder' | 'mentor' | 'investor' | 'org';
  skills?: string[];
  location?: string;
  remote?: boolean;
  industry?: string;
  stage?: string;
  commitment?: string;
  maxDistance?: number;
  modelVersion?: string;
}

/** A member's outcome for one person, as feedback found it and restore puts it back. */
export interface MatchOutcomeSnapshot {
  feedback: string;
  connectionStarted: boolean;
  conversationStarted: boolean;
}

export interface ScoreBreakdown {
  role: number;
  skills: number;
  location: number;
  industry: number;
  semantic: number;
  behavioral: number;
  outcomePrior: number;
  total: number;
}

export interface MatchExplanation {
  dimension: string;
  label: string;
  weight: number;
  score: number;
}

export interface MatchScore {
  userId: string;
  /**
   * This engine's learning total, 0..1 (feedback, behaviour, Open to).
   * It breaks a tie between two people with the same published score.
   * It is not the number a page shows.
   */
  score: number;
  confidence: number;
  reasons: string[];
  explanation: MatchExplanation[];
  breakdown: ScoreBreakdown;
  profile: any;
  /**
   * The pair's score as every page shows it, 0..100: the rule-based score
   * of /matches (`computeMatchScore`), and its reasons. One number for a
   * pair wherever it is read: the card, the dialog, the detail page, the
   * comparison, the weekly email and a cohort run (owner, 2026-10-28;
   * docs §106).
   */
  listScore: number;
  listReasons: string[];
}

export interface MatchingResult {
  matches: MatchScore[];
  total: number;
  criteria: MatchingCriteria;
  generatedAt: Date;
}

/**
 * The list a member sees: the engine's 0–100 number, at least 25, best first.
 * The learning score only breaks a tie, so an "Open to" lift still orders two
 * people with the same list score and never replaces that number.
 */
export function selectPublishedMatches<T extends { listScore: number; score: number }>(matches: T[], limit = 20): T[] {
  return matches
    .filter((m) => m.listScore >= 25)
    .sort((a, b) => b.listScore - a.listScore || b.score - a.score)
    .slice(0, limit);
}

/** Reasons beside that number, plus an "Open to" line when this viewer may see it. */
export function publishedMatchReasons(match: { listReasons?: string[]; reasons?: string[] }): string[] {
  const base = match.listReasons ?? [];
  const openTo = (match.reasons ?? []).filter((reason) => /^open to /i.test(reason) && !base.includes(reason));
  return [...base, ...openTo];
}

// ── Default model weights (Stage 1: hybrid rule + semantic) ──────────────────
const DEFAULT_WEIGHTS = {
  role: 0.35,
  skills: 0.22,
  location: 0.12,
  industry: 0.11,
  semantic: 0.10,
  behavioral: 0.06,
  outcomePrior: 0.04,
};

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @Optional() @Inject(OpenToService) private readonly openTo?: Pick<OpenToService, 'activeSignals' | 'isVerified'>,
  ) {}

  // ── Public: generate matches ───────────────────────────────────────────────

  async generateMatches(criteria: MatchingCriteria): Promise<MatchingResult> {
    const cacheKey = `matches:v2:${criteria.userId}:${criteria.role ?? 'any'}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: criteria.userId },
        include: { profile: { include: { skills: { include: { skill: true } } } } },
      });
      if (!user) throw new Error('User not found');

      const weights = await this.getActiveWeights(criteria.modelVersion);
      const [potentialMatches, userVector, outcomeMap, behavioralMap] = await Promise.all([
        this.getPotentialMatches(criteria),
        this.getOrBuildFeatureVector(user),
        this.getOutcomePriorMap(criteria.userId),
        this.getBehavioralMap(criteria.userId),
      ]);

      const scoredMatches = await Promise.all(
        potentialMatches.map(candidate =>
          this.calculateMatchScore(user, userVector, candidate, criteria, weights, outcomeMap, behavioralMap)
        )
      );

      await this.applyOpenTo(user, scoredMatches);

      const validMatches = selectPublishedMatches(scoredMatches);

      // Log inferences in background
      this.logInferences(criteria.userId, validMatches, criteria.modelVersion ?? '1.0').catch(() => {});

      return { matches: validMatches, total: validMatches.length, criteria, generatedAt: new Date() };
    }, { ttl: 3600 });
  }

  /**
   * One person scored against named others with the engine's own score
   * (`calculateMatchScore`), for a cohort run (docs §102). Nothing is cached
   * or logged as an inference, and "Open to" signals are not applied: they
   * are shown to the people a member chose, and the reader here is the
   * programme.
   */
  async scorePairs(sourceUserId: string, targetUserIds: readonly string[]): Promise<MatchScore[]> {
    if (!targetUserIds.length) return [];
    const include = { profile: { include: { skills: { include: { skill: true } } } } } as const;
    const [user, candidates, weights, outcomeMap, behavioralMap] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: sourceUserId }, include }),
      this.prisma.user.findMany({ where: { id: { in: [...targetUserIds] }, moderationStatus: 'active' }, include }),
      this.getActiveWeights(),
      this.getOutcomePriorMap(sourceUserId),
      this.getBehavioralMap(sourceUserId),
    ]);
    if (!user) return [];
    const userVector = await this.getOrBuildFeatureVector(user);
    const criteria: MatchingCriteria = { userId: sourceUserId, remote: true };
    const scored = await Promise.all(candidates.map((c) => this.calculateMatchScore(user, userVector, c, criteria, weights, outcomeMap, behavioralMap)));
    // A cohort's suggestion shows the pair's one number (docs §106).
    return scored.map((m) => ({ ...m, score: m.listScore / 100, reasons: m.listReasons }));
  }

  async getRecommendations(userId: string, limit = 10): Promise<MatchScore[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { skills: { include: { skill: true } } } } },
    });
    if (!user) throw new Error('User not found');

    const criteria: MatchingCriteria = {
      userId,
      role: this.getComplementaryRole(user.role) as MatchingCriteria['role'],
      location: user.profile?.location ?? undefined,
      remote: true,
    };
    const result = await this.generateMatches(criteria);
    return result.matches.slice(0, limit);
  }

  // ── Feedback ───────────────────────────────────────────────────────────────

  /**
   * Records one member's feedback on one person, and answers with what it
   * replaced: the outcome as it was (`previous`, null when there was none)
   * and the behavioural signal it wrote (`signalId`). With those,
   * `restoreFeedback` takes the feedback back exactly - the Undo of "Pass",
   * which used to bring the card back on screen while the server kept the
   * pass and ranked the person lower from then on.
   */
  async recordFeedback(params: {
    sourceUserId: string;
    targetUserId: string;
    feedback: string;
    connectionStarted?: boolean;
    conversationStarted?: boolean;
  }): Promise<{ previous: MatchOutcomeSnapshot | null; signalId: string }> {
    const where = { sourceUserId_targetUserId: { sourceUserId: params.sourceUserId, targetUserId: params.targetUserId } };
    const before = await this.prisma.matchOutcome.findUnique({
      where,
      select: { feedback: true, connectionStarted: true, conversationStarted: true },
    });
    await this.prisma.matchOutcome.upsert({
      where,
      create: {
        sourceUserId: params.sourceUserId,
        targetUserId: params.targetUserId,
        feedback: params.feedback as any,
        connectionStarted: params.connectionStarted ?? false,
        conversationStarted: params.conversationStarted ?? false,
      },
      update: {
        feedback: params.feedback as any,
        connectionStarted: params.connectionStarted ?? false,
        conversationStarted: params.conversationStarted ?? false,
      },
    });

    // Record behavioral signal
    const signalId = await this.recordBehavioralSignal(params.sourceUserId, 'match_feedback', params.targetUserId, 'user',
      params.feedback === 'accepted' ? 2.0 : params.feedback === 'declined' ? -1.0 : 0.5);

    // Invalidate cache
    await this.cache.invalidateByTag(`matches:v2:${params.sourceUserId}`);
    return {
      previous: before
        ? { feedback: String(before.feedback), connectionStarted: before.connectionStarted, conversationStarted: before.conversationStarted }
        : null,
      signalId,
    };
  }

  /**
   * Takes one feedback back: the outcome returns to what `recordFeedback`
   * answered it was (removed when there was none), and the signal that
   * feedback wrote is deleted - only the member's own, and only a feedback
   * signal, whatever id is sent.
   */
  async restoreFeedback(params: {
    sourceUserId: string;
    targetUserId: string;
    previous?: MatchOutcomeSnapshot | null;
    signalId?: string;
  }): Promise<{ restored: boolean }> {
    const where = { sourceUserId_targetUserId: { sourceUserId: params.sourceUserId, targetUserId: params.targetUserId } };
    if (params.previous) {
      await this.prisma.matchOutcome.upsert({
        where,
        create: {
          sourceUserId: params.sourceUserId,
          targetUserId: params.targetUserId,
          feedback: params.previous.feedback as any,
          connectionStarted: params.previous.connectionStarted,
          conversationStarted: params.previous.conversationStarted,
        },
        update: {
          feedback: params.previous.feedback as any,
          connectionStarted: params.previous.connectionStarted,
          conversationStarted: params.previous.conversationStarted,
        },
      });
    } else {
      await this.prisma.matchOutcome.deleteMany({
        where: { sourceUserId: params.sourceUserId, targetUserId: params.targetUserId },
      });
    }
    if (params.signalId) {
      await this.prisma.userBehaviorSignal.deleteMany({
        where: { id: params.signalId, userId: params.sourceUserId, signalType: 'match_feedback', targetId: params.targetUserId },
      });
    }
    await this.cache.invalidateByTag(`matches:v2:${params.sourceUserId}`);
    await this.cache.del(`fv:${params.sourceUserId}`);
    return { restored: true };
  }

  async recordBehavioralSignal(
    userId: string,
    signalType: string,
    targetId?: string,
    targetType?: string,
    value = 1.0,
  ): Promise<string> {
    const signal = await this.prisma.userBehaviorSignal.create({
      data: { userId, signalType, targetId, targetType, value },
      select: { id: true },
    });
    // Invalidate feature vector cache so it rebuilds with new signals
    await this.cache.del(`fv:${userId}`);
    return signal?.id ?? '';
  }

  // ── Legacy: backward-compatible feedback method ────────────────────────────

  async updateMatchingFeedback(userId: string, matchUserId: string, feedback: 'positive' | 'negative'): Promise<void> {
    await this.recordFeedback({
      sourceUserId: userId,
      targetUserId: matchUserId,
      feedback: feedback === 'positive' ? 'accepted' : 'declined',
    });
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getMatchingStats(userId: string): Promise<any> {
    // Use targeted count queries instead of loading ALL connection rows
    const [
      sentPending,
      sentTotal,
      sentAccepted,
      receivedPending,
      receivedTotal,
      receivedAccepted,
      outcomes,
      signals,
    ] = await Promise.all([
      this.prisma.connectionRequest.count({ where: { requesterId: userId, status: 'pending' } }),
      this.prisma.connectionRequest.count({ where: { requesterId: userId } }),
      this.prisma.connectionRequest.count({ where: { requesterId: userId, status: 'accepted' } }),
      this.prisma.connectionRequest.count({ where: { receiverId: userId, status: 'pending' } }),
      this.prisma.connectionRequest.count({ where: { receiverId: userId } }),
      this.prisma.connectionRequest.count({ where: { receiverId: userId, status: 'accepted' } }),
      this.prisma.matchOutcome.findMany({ where: { sourceUserId: userId }, select: { feedback: true } }),
      this.prisma.userBehaviorSignal.count({ where: { userId } }),
    ]);

    const totalConnections = sentAccepted + receivedAccepted;
    const positiveOutcomes = outcomes.filter(o => ['accepted', 'connection_started'].includes(o.feedback)).length;

    return {
      sentRequests: sentPending,
      receivedRequests: receivedPending,
      totalConnections,
      acceptanceRate: sentTotal > 0 ? (sentAccepted / sentTotal) * 100 : 0,
      responseRate: receivedTotal > 0 ? (receivedAccepted / receivedTotal) * 100 : 0,
      matchOutcomes: outcomes.length,
      positiveOutcomeRate: outcomes.length > 0 ? (positiveOutcomes / outcomes.length) * 100 : 0,
      behavioralSignals: signals,
    };
  }

  async getAdminStats(): Promise<any> {
    const [totalMatches, activeModel, experiments] = await Promise.all([
      this.prisma.matchInferenceLog.count(),
      this.prisma.matchModelVersion.findFirst({ where: { isActive: true } }),
      this.prisma.matchExperiment.findMany({ where: { status: 'running' } }),
    ]);

    const outcomes = await this.prisma.matchOutcome.groupBy({
      by: ['feedback'],
      _count: true,
    });

    return { totalMatches, activeModel, runningExperiments: experiments.length, outcomes };
  }

  // ── Detailed VS breakdown (Match Detail Page) ──────────────────────────────

  async getDetailedVs(sourceUserId: string, targetUserId: string): Promise<any> {
    const include = { profile: { include: { skills: { include: { skill: true } } } } };
    const [source, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: sourceUserId }, include }),
      this.prisma.user.findUnique({ where: { id: targetUserId }, include }),
    ]);
    if (!source || !target) throw new Error('User not found');

    const [sourceVec, targetVec, weights, outcomeMap, behavioralMap] = await Promise.all([
      this.getOrBuildFeatureVector(source),
      this.getOrBuildFeatureVector(target),
      this.getActiveWeights(),
      this.getOutcomePriorMap(sourceUserId),
      this.getBehavioralMap(sourceUserId),
    ]);

    // Not `remote: true`: that answers 0.85 for every pair, so the location
    // axis was the same for Athens–Athens and Athens–Berlin and the
    // "different places" point below could never be raised.
    const matchScore = await this.calculateMatchScore(
      source, sourceVec, target, { userId: sourceUserId, remote: false },
      weights, outcomeMap, behavioralMap,
    );

    // ── Shared strengths: overlapping skills + keyword themes ────────────────
    const sourceSkillNames = (source.profile?.skills ?? []).map((s: any) => s.skill?.name ?? '');
    const targetSkillNames = (target.profile?.skills ?? []).map((s: any) => s.skill?.name ?? '');
    const sharedSkills = sourceSkillNames.filter((n: string) => targetSkillNames.includes(n));

    const sourceKws = new Set<string>([
      ...((sourceVec.bioKeywords as string[]) ?? []),
      ...((sourceVec.goalKeywords as string[]) ?? []),
    ]);
    const targetKws = new Set<string>([
      ...((targetVec.bioKeywords as string[]) ?? []),
      ...((targetVec.goalKeywords as string[]) ?? []),
    ]);
    const sharedKeywords = [...sourceKws].filter(k => targetKws.has(k)).slice(0, 6);

    const sharedStrengths = matchStrengths(sharedSkills, sharedKeywords);

    // ── Compatibility badges ─────────────────────────────────────────────────
    const badges: string[] = [];
    if (matchScore.breakdown.semantic > 0.65) badges.push('High Vision Alignment');
    if (matchScore.breakdown.role > 0.8) badges.push('Strong Role Complement');
    if (matchScore.breakdown.skills > 0.7) badges.push('Execution Match');
    if (matchScore.breakdown.location > 0.8) badges.push('Same Ecosystem');
    if (matchScore.breakdown.industry > 0.75) badges.push('Industry Fit');
    if (matchScore.breakdown.behavioral > 0.7) badges.push('Highly Active');
    if (badges.length === 0) badges.push('Potential Match');

    // ── Friction points ──────────────────────────────────────────────────────
    const frictionPoints = matchFrictions({
      sourceLocation: source.profile?.location,
      targetLocation: target.profile?.location,
      locationScore: matchScore.breakdown.location,
      sourcePayload: source.profile?.rolePayload,
      targetPayload: target.profile?.rolePayload,
      sourceSkills: sourceSkillNames,
      targetSkills: targetSkillNames,
    });

    // ── How you would work together ─────────────────────────────────────────
    // Asked, not guessed: the five-axis chart that stood here read a risk
    // field nothing wrote (every member scored 30), a commitment spelling
    // profile edit never saves, and keyword counts. The compatibility
    // questions answer it; only the per-question agreement leaves the server.
    const prefs = await this.prisma.userPreference.findMany({
      where: { userId: { in: [sourceUserId, targetUserId] } },
      select: { userId: true, workStyle: true, showInMatching: true },
    });
    const compatOf = (id: string) => (prefs.find((p) => p.userId === id)?.workStyle as { compat?: unknown } | null)?.compat;
    const targetListed = prefs.find((p) => p.userId === targetUserId)?.showInMatching !== false;
    const compatibility = targetListed ? compareCompatAnswers(compatOf(sourceUserId), compatOf(targetUserId)) : compareCompatAnswers(null, null);

    return {
      // The pair's one number: the score /matches shows. The axes below
      // stay as the analysis of it (docs §106).
      overall: { score: matchScore.listScore, confidence: Math.round(matchScore.confidence * 100) },
      breakdown: [
        { key: 'role', label: 'Role Complementarity', score: Math.round(matchScore.breakdown.role * 100), color: '#4ADE80' },
        { key: 'skills', label: 'Skills & Expertise', score: Math.round(matchScore.breakdown.skills * 100), color: '#22D3EE' },
        { key: 'semantic', label: 'Vision & Goals', score: Math.round(matchScore.breakdown.semantic * 100), color: '#F472B6' },
        { key: 'industry', label: 'Industry Alignment', score: Math.round(matchScore.breakdown.industry * 100), color: '#FB923C' },
        { key: 'location', label: 'Location Fit', score: Math.round(matchScore.breakdown.location * 100), color: '#A78BFA' },
        { key: 'behavioral', label: 'Platform Activity', score: Math.round(matchScore.breakdown.behavioral * 100), color: '#34D399' },
      ],
      badges: badges.slice(0, 3),
      sharedStrengths,
      frictionPoints: frictionPoints.slice(0, 3),
      compatibility,
      reasons: matchScore.listReasons,
      sourceProfile: {
        id: source.id,
        role: source.role,
        displayName: source.profile?.displayName ?? source.email.split('@')[0],
        headline: source.profile?.headline,
        avatarUrl: source.profile?.avatarUrl,
        location: source.profile?.location,
      },
      targetProfile: {
        id: target.id,
        role: target.role,
        displayName: target.profile?.displayName ?? target.email.split('@')[0],
        headline: target.profile?.headline,
        avatarUrl: target.profile?.avatarUrl,
        location: target.profile?.location,
      },
    };
  }

  // ── Core scoring ───────────────────────────────────────────────────────────

  private async calculateMatchScore(
    user: any,
    userVector: any,
    candidate: any,
    criteria: MatchingCriteria,
    weights: typeof DEFAULT_WEIGHTS,
    outcomeMap: Map<string, number>,
    behavioralMap: Map<string, number>,
  ): Promise<MatchScore> {
    const reasons: string[] = [];

    // Layer 1: Structured features
    const roleScore = this.calculateRoleCompatibility(user, candidate.role);
    const skillsScore = this.calculateSkillsCompatibility(
      user.profile?.skills ?? [], candidate.profile?.skills ?? []
    );
    const locationScore = this.calculateLocationCompatibility(
      user.profile?.location, candidate.profile?.location, criteria.remote
    );
    const industryScore = this.calculateIndustryCompatibility(user.profile, candidate.profile);

    // Layer 2: Semantic (bio/goal keyword overlap)
    const candidateVector = await this.getOrBuildFeatureVector(candidate);
    const semanticScore = this.calculateSemanticScore(userVector, candidateVector);

    // Layer 3: Behavioral signal (how active / responsive this candidate is)
    const behavioralScore = behavioralMap.get(candidate.id) ?? 0.5;

    // Layer 4: Outcome prior (past feedback for this specific pair)
    const outcomePrior = outcomeMap.get(candidate.id) ?? 0.5;

    // Build breakdown
    const breakdown: ScoreBreakdown = {
      role: roleScore,
      skills: skillsScore,
      location: locationScore,
      industry: industryScore,
      semantic: semanticScore,
      behavioral: behavioralScore,
      outcomePrior,
      total: 0,
    };

    // Weighted total
    breakdown.total = Math.min(1,
      roleScore * weights.role +
      skillsScore * weights.skills +
      locationScore * weights.location +
      industryScore * weights.industry +
      semanticScore * weights.semantic +
      behavioralScore * weights.behavioral +
      outcomePrior * weights.outcomePrior
    );

    // Build human-readable reasons
    if (roleScore > 0.7) reasons.push('Complementary roles');
    if (skillsScore > 0.5) reasons.push('Matching skills & expertise');
    if (semanticScore > 0.5) reasons.push('Aligned goals & vision');
    if (locationScore > 0.7) reasons.push('Same region or open to remote');
    if (industryScore > 0.6) reasons.push('Related industry or stage');
    if (behavioralScore > 0.7) reasons.push('Highly active on platform');

    // Build safe explanation for UI
    const explanation: MatchExplanation[] = [
      { dimension: 'role', label: 'Role fit', weight: weights.role, score: roleScore },
      { dimension: 'skills', label: 'Skills & expertise', weight: weights.skills, score: skillsScore },
      { dimension: 'semantic', label: 'Goals & vision', weight: weights.semantic, score: semanticScore },
      { dimension: 'location', label: 'Location', weight: weights.location, score: locationScore },
      { dimension: 'industry', label: 'Industry & stage', weight: weights.industry, score: industryScore },
    ].filter(e => e.score > 0.3); // Only show meaningful dimensions

    const confidence = this.computeConfidence(breakdown, userVector, candidateVector);
    const list = computeMatchScore(profileSnapshotOf(user), profileSnapshotOf(candidate));

    return {
      userId: candidate.id,
      score: breakdown.total,
      confidence,
      reasons,
      explanation,
      breakdown,
      profile: candidate.profile,
      listScore: list.score,
      listReasons: list.breakdown.reasons,
    };
  }

  /**
   * "Open to" signals lift candidates who said they would do what this person
   * is looking for — by at most `OPEN_TO_BOOST`, so a signal orders people who
   * already fit and never rescues a poor fit. The reason is named only when
   * the signal's own visibility lets this viewer see it; a "matching only"
   * signal moves the ranking and says nothing.
   */
  private async applyOpenTo(user: any, matches: MatchScore[]): Promise<void> {
    if (!this.openTo || !matches.length) return;
    try {
      const signals = await this.openTo.activeSignals(matches.map((m) => m.userId));
      if (!signals.size) return;
      const profile = await this.prisma.matchProfile.findUnique({ where: { userId: user.id }, select: { lookingForRoles: true } }).catch(() => null);
      // Profile edit saves "Looking for" as rolePayload.rolesSought; nothing
      // writes lookingForRoles, so both are read.
      const wants = seekerWants([...(profile?.lookingForRoles ?? []), ...lookingForOf(user)], user.role);
      let verified: boolean | null = null;
      for (const match of matches) {
        const signal = signals.get(match.userId);
        const lift = openToBoost(signal, wants);
        if (!signal || !lift) continue;
        match.score = Math.min(1, match.score + lift);
        if (signal.visibility === 'verified' && verified === null) verified = await this.openTo.isVerified(user.id);
        const shown = openToShownTo(signal, { isOwner: false, verified: verified === true }).filter((k) => wants.includes(k));
        for (const kind of shown) match.reasons.push(`Open to ${OPEN_TO_COPY[kind].en.toLowerCase()}`);
      }
    } catch (err) {
      this.logger.warn(`Open-to signals skipped: ${String(err)}`);
    }
  }

  // ── Semantic scoring (TF-IDF style keyword overlap) ────────────────────────

  private calculateSemanticScore(userVec: any, candidateVec: any): number {
    if (!userVec || !candidateVec) return 0.5;

    const userKws = new Set<string>([
      ...((userVec.bioKeywords as string[]) ?? []),
      ...((userVec.goalKeywords as string[]) ?? []),
      ...((userVec.expertiseKeywords as string[]) ?? []),
    ]);
    const candidateKws = new Set<string>([
      ...((candidateVec.bioKeywords as string[]) ?? []),
      ...((candidateVec.goalKeywords as string[]) ?? []),
      ...((candidateVec.expertiseKeywords as string[]) ?? []),
    ]);

    if (userKws.size === 0 || candidateKws.size === 0) return 0.4;

    // Jaccard similarity on keyword sets
    const intersection = new Set([...userKws].filter(k => candidateKws.has(k)));
    const union = new Set([...userKws, ...candidateKws]);
    const jaccard = intersection.size / union.size;

    // Boost: check for thematic complementarity (tech vs business, etc.)
    const complementaryBoost = this.computeKeywordComplementarity(userKws, candidateKws);

    return Math.min(1, jaccard * 0.6 + complementaryBoost * 0.4);
  }

  private computeKeywordComplementarity(kws1: Set<string>, kws2: Set<string>): number {
    const techTerms = ['engineer', 'developer', 'technical', 'software', 'code', 'data', 'ai', 'ml', 'backend', 'frontend'];
    const bizTerms = ['sales', 'marketing', 'business', 'growth', 'revenue', 'strategy', 'operations', 'finance', 'cfo', 'cmo'];
    const designTerms = ['design', 'ux', 'ui', 'product', 'brand', 'creative', 'visual'];

    const hasTech = (kws: Set<string>) => techTerms.some(t => [...kws].some(k => k.includes(t)));
    const hasBiz = (kws: Set<string>) => bizTerms.some(t => [...kws].some(k => k.includes(t)));
    const hasDesign = (kws: Set<string>) => designTerms.some(t => [...kws].some(k => k.includes(t)));

    let score = 0;
    if ((hasTech(kws1) && hasBiz(kws2)) || (hasBiz(kws1) && hasTech(kws2))) score += 0.6;
    if ((hasTech(kws1) && hasDesign(kws2)) || (hasDesign(kws1) && hasTech(kws2))) score += 0.4;
    if ((hasBiz(kws1) && hasDesign(kws2)) || (hasDesign(kws1) && hasBiz(kws2))) score += 0.3;

    return Math.min(1, score);
  }

  // ── Feature vector ─────────────────────────────────────────────────────────

  private async getOrBuildFeatureVector(user: any): Promise<any> {
    const cached = await this.cache.get(`fv:${user.id}`);
    if (cached) return cached;

    // Extract keywords from profile text
    const profileText = [
      user.profile?.bio ?? '',
      user.profile?.headline ?? '',
      (user.profile?.rolePayload as any)?.goals ?? '',
      (user.profile?.rolePayload as any)?.expertise ?? '',
    ].join(' ').toLowerCase();

    const keywords = this.extractKeywords(profileText);
    const goalText = ((user.profile?.rolePayload as any)?.goals ?? '').toLowerCase();
    const goalKeywords = this.extractKeywords(goalText);
    const expertiseText = ((user.profile?.rolePayload as any)?.expertise ?? '').toLowerCase();
    const expertiseKeywords = this.extractKeywords(expertiseText);

    // Behavioral aggregates from DB
    const [signals, outcomes] = await Promise.all([
      this.prisma.userBehaviorSignal.findMany({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
        select: { signalType: true, value: true },
      }),
      this.prisma.matchOutcome.findMany({
        where: { sourceUserId: user.id },
        select: { feedback: true },
      }),
    ]);

    const activityScore = Math.min(1, signals.length / 50);
    const positiveOutcomes = outcomes.filter(o => o.feedback === 'accepted').length;
    const acceptanceRate = outcomes.length > 0 ? positiveOutcomes / outcomes.length : null;

    // Profile completeness
    const p = user.profile;
    const fields = [p?.bio, p?.headline, p?.location, p?.avatarUrl, p?.skills?.length > 0];
    const profileQualityScore = fields.filter(Boolean).length / fields.length;

    const vector = {
      bioKeywords: keywords.slice(0, 30),
      goalKeywords: goalKeywords.slice(0, 20),
      expertiseKeywords: expertiseKeywords.slice(0, 20),
      activityScore,
      acceptanceRate,
      profileQualityScore,
    };

    // Persist to DB async (upsert)
    this.prisma.matchFeatureVector.upsert({
      where: { userId: user.id },
      create: { userId: user.id, features: { role: user.role }, ...vector },
      update: { features: { role: user.role }, ...vector },
    }).catch(() => {});

    await this.cache.set(`fv:${user.id}`, vector, 3600);
    return vector;
  }

  private extractKeywords(text: string): string[] {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
      'my', 'your', 'our', 'their', 'its', 'this', 'that', 'these', 'those', 'i', 'we',
      'you', 'he', 'she', 'it', 'they', 'what', 'which', 'who', 'how', 'when', 'where',
    ]);
    return text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i) // unique
      .slice(0, 50);
  }

  // ── Outcome prior map ──────────────────────────────────────────────────────

  private async getOutcomePriorMap(userId: string): Promise<Map<string, number>> {
    const outcomes = await this.prisma.matchOutcome.findMany({
      where: { sourceUserId: userId },
      select: { targetUserId: true, feedback: true },
    });
    const map = new Map<string, number>();
    for (const o of outcomes) {
      const score = o.feedback === 'accepted' ? 0.9
        : o.feedback === 'declined' ? 0.1
        : o.feedback === 'not_relevant' ? 0.05
        : 0.5;
      map.set(o.targetUserId, score);
    }
    return map;
  }

  // ── Behavioral map ─────────────────────────────────────────────────────────

  private async getBehavioralMap(userId: string): Promise<Map<string, number>> {
    // Get recent positive behavioral signals about other users
    const signals = await this.prisma.userBehaviorSignal.findMany({
      where: {
        userId,
        signalType: { in: ['profile_view', 'match_click', 'message_sent'] },
        targetType: 'user',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
      },
      select: { targetId: true, signalType: true, value: true },
    });

    const map = new Map<string, number>();
    for (const s of signals) {
      if (!s.targetId) continue;
      const current = map.get(s.targetId) ?? 0.5;
      map.set(s.targetId, Math.min(1, current + s.value * 0.1));
    }
    return map;
  }

  // ── Confidence calculation ─────────────────────────────────────────────────

  private computeConfidence(breakdown: ScoreBreakdown, userVec: any, candidateVec: any): number {
    let confidence = 0.5;
    if (userVec?.profileQualityScore > 0.6) confidence += 0.15;
    if (candidateVec?.profileQualityScore > 0.6) confidence += 0.15;
    if (userVec?.bioKeywords?.length > 5) confidence += 0.1;
    if (candidateVec?.bioKeywords?.length > 5) confidence += 0.1;
    return Math.min(0.95, confidence);
  }

  // ── Model weights ──────────────────────────────────────────────────────────

  private async getActiveWeights(modelVersion?: string): Promise<typeof DEFAULT_WEIGHTS> {
    try {
      const model = modelVersion
        ? await this.prisma.matchModelVersion.findUnique({ where: { version: modelVersion } })
        : await this.prisma.matchModelVersion.findFirst({ where: { isActive: true } });
      if (model?.weights) return model.weights as typeof DEFAULT_WEIGHTS;
    } catch {
      // Model lookup is best-effort; invalid or missing weights fall back to defaults.
    }
    return DEFAULT_WEIGHTS;
  }

  // ── Inference logging ──────────────────────────────────────────────────────

  private async logInferences(sourceUserId: string, matches: MatchScore[], modelVersion: string): Promise<void> {
    for (const match of matches.slice(0, 10)) {
      await this.prisma.matchInferenceLog.upsert({
        where: {
          sourceUserId_targetUserId_modelVersion: {
            sourceUserId, targetUserId: match.userId, modelVersion,
          },
        },
        create: {
          sourceUserId, targetUserId: match.userId,
          roleScore: match.breakdown.role,
          skillScore: match.breakdown.skills,
          locationScore: match.breakdown.location,
          industryScore: match.breakdown.industry,
          semanticScore: match.breakdown.semantic,
          behavioralScore: match.breakdown.behavioral,
          outcomePriorScore: match.breakdown.outcomePrior,
          finalScore: match.breakdown.total,
          modelVersion,
          explanation: match.explanation as any,
          confidence: match.confidence,
          shownAt: new Date(),
        },
        update: { finalScore: match.breakdown.total, shownAt: new Date() },
      }).catch(() => {});
    }
  }

  // ── Candidate pool ─────────────────────────────────────────────────────────

  private async getPotentialMatches(criteria: MatchingCriteria): Promise<any[]> {
    const where: any = {
      id: { not: criteria.userId },
      moderationStatus: 'active',
      emailVerified: true,
    };
    if (criteria.role) where.role = criteria.role;
    if (criteria.location && !criteria.remote) {
      where.profile = { location: criteria.location };
    }
    const users = await this.prisma.user.findMany({
      where,
      include: { profile: { include: { skills: { include: { skill: true } } } } },
      take: 100,
    });
    // "Appear in search: off" keeps a member out of recommendations too.
    return users.filter((u) => !isHiddenFromSearch(u.profile?.visibilityRules));
  }

  // ── Structured scoring helpers ─────────────────────────────────────────────

  /** Role fit, a founder's by what they are looking for (`roleFit` in shared open-to). */
  private calculateRoleCompatibility(user: any, candidateRole: string): number {
    return roleFit(user?.role, candidateRole, seekerWants(lookingForOf(user), user?.role));
  }

  private calculateSkillsCompatibility(userSkills: any[], candidateSkills: any[]): number {
    return skillsFit({
      userKeys: userSkills.map((s) => s.skillId),
      candidateKeys: candidateSkills.map((s) => s.skillId),
      userNames: userSkills.map((s) => (s.skill?.name ?? '').toLowerCase()),
      candidateNames: candidateSkills.map((s) => (s.skill?.name ?? '').toLowerCase()),
      // The catalogue's family (technical, business, design) decides whether
      // the other brings what the reader lacks.
      userCategories: userSkills.map((s) => s.skill?.category ?? null),
      candidateCategories: candidateSkills.map((s) => s.skill?.category ?? null),
    });
  }

  private calculateLocationCompatibility(uLoc?: string, cLoc?: string, remote = false): number {
    if (remote) return 0.85;
    return locationFit(uLoc, cLoc);
  }

  private calculateIndustryCompatibility(uProfile: any, cProfile: any): number {
    return industryFit(uProfile?.rolePayload, cProfile?.rolePayload);
  }

  /** The role recommendations are drawn from; a founder's pool is everyone (see `candidateRoleFor`). */
  private getComplementaryRole(role: string): string | undefined {
    return candidateRoleFor(role);
  }
}

/** What a member said they are looking for on their profile ("Looking for", `rolePayload.rolesSought`). */
function lookingForOf(user: any): string[] {
  const sought = user?.profile?.rolePayload?.rolesSought;
  return Array.isArray(sought) ? sought.filter((x: unknown): x is string => typeof x === 'string') : [];
}

/**
 * A user record (with profile and skills) as the rule-based score reads it,
 * so this engine can answer with the number /matches shows for the pair.
 */
function profileSnapshotOf(user: any): ProfileSnapshot {
  const profile = user?.profile ?? {};
  const skills: any[] = Array.isArray(profile.skills) ? profile.skills : [];
  const updatedAt = profile.updatedAt ? new Date(profile.updatedAt).getTime() : 0;
  return {
    userId: String(user?.id ?? ''),
    profileId: String(profile.id ?? user?.id ?? ''),
    role: user?.role,
    displayName: profile.displayName ?? '',
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    timezone: profile.timezone ?? null,
    skillNames: skills.map((s) => s.skill?.name ?? '').filter(Boolean),
    skillCategories: skills.filter((s) => s.skill?.name).map((s) => s.skill?.category ?? null),
    rolePayload: (profile.rolePayload as Record<string, unknown> | null) ?? null,
    updatedAtMs: Number.isFinite(updatedAt) ? updatedAt : 0,
  };
}

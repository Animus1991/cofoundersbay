import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

export interface MatchingCriteria {
  userId: string;
  role?: 'founder' | 'mentor' | 'investor' | 'org';
  skills?: string[];
  location?: string;
  remote?: boolean;
  industry?: string;
  stage?: string;
  commitment?: string;
  maxDistance?: number; // km
}

export interface MatchScore {
  userId: string;
  score: number;
  reasons: string[];
  profile: any;
}

export interface MatchingResult {
  matches: MatchScore[];
  total: number;
  criteria: MatchingCriteria;
  generatedAt: Date;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Generate smart matches for a user based on their profile and preferences
   */
  async generateMatches(criteria: MatchingCriteria): Promise<MatchingResult> {
    const cacheKey = `matches:${criteria.userId}:${JSON.stringify(criteria)}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: criteria.userId },
        include: { profile: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get potential matches based on role and criteria
      const potentialMatches = await this.getPotentialMatches(criteria);
      
      // Calculate scores for each match
      const scoredMatches = await Promise.all(
        potentialMatches.map(async (candidate) => 
          this.calculateMatchScore(user, candidate, criteria)
        )
      );

      // Sort by score and filter out low matches
      const validMatches = scoredMatches
        .filter(match => match.score > 0.3) // Minimum 30% compatibility
        .sort((a, b) => b.score - a.score)
        .slice(0, 20); // Top 20 matches

      return {
        matches: validMatches,
        total: validMatches.length,
        criteria,
        generatedAt: new Date(),
      };
    }, { ttl: 3600 }); // Cache for 1 hour
  }

  /**
   * Get recommendations for users to connect with
   */
  async getRecommendations(userId: string, limit: number = 10): Promise<MatchScore[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { skills: true } } },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const criteria: MatchingCriteria = {
      userId,
      role: this.getComplementaryRole(user.role as 'founder' | 'mentor' | 'investor' | 'org') as MatchingCriteria['role'],
      skills: (user.profile as any)?.skills?.map((s: any) => s.skillId) || [],
      location: user.profile?.location || undefined,
      remote: true, // Default to open to remote
    };

    const result = await this.generateMatches(criteria);
    return result.matches.slice(0, limit);
  }

  /**
   * Calculate compatibility score between two users
   */
  private async calculateMatchScore(
    user: any,
    candidate: any,
    criteria: MatchingCriteria
  ): Promise<MatchScore> {
    const score: { [key: string]: number } = {};
    const reasons: string[] = [];

    // Role compatibility (40% weight)
    const roleScore = this.calculateRoleCompatibility(user.role, candidate.role);
    score.role = roleScore * 0.4;
    if (roleScore > 0.7) {
      reasons.push('Complementary roles');
    }

    // Skills compatibility (25% weight)
    const skillsScore = await this.calculateSkillsCompatibility(
      user.profile?.skills || [],
      candidate.profile?.skills || []
    );
    score.skills = skillsScore * 0.25;
    if (skillsScore > 0.5) {
      reasons.push('Shared skills and expertise');
    }

    // Location compatibility (20% weight)
    const locationScore = this.calculateLocationCompatibility(
      user.profile?.location,
      candidate.profile?.location,
      criteria.remote
    );
    score.location = locationScore * 0.2;
    if (locationScore > 0.6) {
      reasons.push('Compatible location preferences');
    }

    // Industry/stage compatibility (15% weight)
    const industryScore = this.calculateIndustryCompatibility(
      user.profile,
      candidate.profile
    );
    score.industry = industryScore * 0.15;
    if (industryScore > 0.5) {
      reasons.push('Similar industry or stage');
    }

    const totalScore = Object.values(score).reduce((sum, val) => sum + val, 0);

    return {
      userId: candidate.id,
      score: totalScore,
      reasons,
      profile: candidate.profile,
    };
  }

  /**
   * Get potential matches based on basic criteria
   */
  private async getPotentialMatches(criteria: MatchingCriteria): Promise<any[]> {
    const where: any = {
      id: { not: criteria.userId },
      moderationStatus: 'active',
      emailVerified: true,
    };

    // Filter by role if specified
    if (criteria.role) {
      where.role = criteria.role;
    }

    // Filter by location if specified and not remote
    if (criteria.location && !criteria.remote) {
      where.profile = {
        location: criteria.location,
      };
    }

    return this.prisma.user.findMany({
      where,
      include: {
        profile: {
          include: {
            skills: true,
          },
        },
      },
      take: 100, // Limit for performance
    });
  }

  /**
   * Calculate role compatibility score
   */
  private calculateRoleCompatibility(userRole: string, candidateRole: string): number {
    const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
      founder: {
        founder: 0.3, // Similar founders can collaborate
        mentor: 0.9, // Founders need mentors
        investor: 0.8, // Founders need investors
        org: 0.7, // Founders may need org support
      },
      mentor: {
        founder: 0.9, // Mentors help founders
        mentor: 0.4, // Mentors can collaborate
        investor: 0.6, // Mentors and investors can connect
        org: 0.8, // Mentors often work with orgs
      },
      investor: {
        founder: 0.8, // Investors invest in founders
        mentor: 0.6, // Investors value mentor insights
        investor: 0.5, // Investors can co-invest
        org: 0.9, // Investors work with orgs
      },
      org: {
        founder: 0.7, // Orgs support founders
        mentor: 0.8, // Orgs work with mentors
        investor: 0.9, // Orgs need investors
        org: 0.6, // Orgs can collaborate
      },
    };

    return compatibilityMatrix[userRole]?.[candidateRole] || 0.5;
  }

  /**
   * Calculate skills compatibility score
   */
  private async calculateSkillsCompatibility(
    userSkills: any[],
    candidateSkills: any[]
  ): Promise<number> {
    if (!userSkills.length || !candidateSkills.length) {
      return 0.5; // Neutral score if no skills data
    }

    const userSkillIds = new Set(userSkills.map((s: any) => s.skillId));
    const candidateSkillIds = new Set(candidateSkills.map((s: any) => s.skillId));

    // Calculate intersection
    const intersection = new Set(
      [...userSkillIds].filter(skillId => candidateSkillIds.has(skillId))
    );

    const union = new Set([...userSkillIds, ...candidateSkillIds]);
    
    // Jaccard similarity
    const similarity = intersection.size / union.size;

    // Boost score for complementary skills (not identical but related)
    const complementaryScore = this.calculateComplementarySkills(userSkills, candidateSkills);

    return Math.min(1, similarity * 0.7 + complementaryScore * 0.3);
  }

  /**
   * Calculate complementary skills score
   */
  private calculateComplementarySkills(userSkills: any[], candidateSkills: any[]): number {
    // This would integrate with a skills taxonomy to find complementary skills
    // For now, return a simple heuristic
    const userSkillNames = userSkills.map((s: any) => (s.skill?.name || '').toLowerCase());
    const candidateSkillNames = candidateSkills.map((s: any) => (s.skill?.name || '').toLowerCase());

    // Define complementary skill pairs
    const complementaryPairs = [
      ['technical', 'business'],
      ['marketing', 'product'],
      ['design', 'development'],
      ['sales', 'engineering'],
      ['finance', 'operations'],
    ];

    let complementaryCount = 0;
    for (const [skill1, skill2] of complementaryPairs) {
      const hasSkill1 = userSkillNames.some((name: string) => name.includes(skill1));
      const hasSkill2 = candidateSkillNames.some((name: string) => name.includes(skill2));
      const hasSkill1Candidate = candidateSkillNames.some((name: string) => name.includes(skill1));
      const hasSkill2User = userSkillNames.some((name: string) => name.includes(skill2));

      if ((hasSkill1 && hasSkill2) || (hasSkill1Candidate && hasSkill2User)) {
        complementaryCount++;
      }
    }

    return Math.min(1, complementaryCount / complementaryPairs.length);
  }

  /**
   * Calculate location compatibility score
   */
  private calculateLocationCompatibility(
    userLocation?: string,
    candidateLocation?: string,
    remote: boolean = false
  ): number {
    if (remote) {
      return 0.9; // High score for remote compatibility
    }

    if (!userLocation || !candidateLocation) {
      return 0.5; // Neutral score if location data missing
    }

    // Simple location matching - in real implementation, use geolocation API
    if (userLocation.toLowerCase() === candidateLocation.toLowerCase()) {
      return 1.0;
    }

    // Check if same country/region (simplified)
    const userParts = userLocation.toLowerCase().split(',');
    const candidateParts = candidateLocation.toLowerCase().split(',');

    if (userParts[userParts.length - 1] === candidateParts[candidateParts.length - 1]) {
      return 0.7;
    }

    return 0.3;
  }

  /**
   * Calculate industry/stage compatibility
   */
  private calculateIndustryCompatibility(userProfile: any, candidateProfile: any): number {
    const userPayload = userProfile?.rolePayload as any;
    const candidatePayload = candidateProfile?.rolePayload as any;

    if (!userPayload || !candidatePayload) {
      return 0.5;
    }

    let score = 0.5;

    // Industry matching
    if (userPayload.industry && candidatePayload.industry) {
      if (userPayload.industry === candidatePayload.industry) {
        score += 0.3;
      }
    }

    // Stage compatibility
    if (userPayload.stage && candidatePayload.stage) {
      const stageCompatibility = this.getStageCompatibility(userPayload.stage, candidatePayload.stage);
      score += stageCompatibility * 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Get stage compatibility score
   */
  private getStageCompatibility(stage1: string, stage2: string): number {
    const stageOrder = ['idea', 'mvp', 'traction', 'scaling'];
    const stageMap: { [key: string]: number } = {
      idea: 0,
      mvp: 1,
      traction: 2,
      scaling: 3,
    };

    const stage1Level = stageMap[stage1] ?? 0;
    const stage2Level = stageMap[stage2] ?? 0;

    // Closer stages are more compatible
    const diff = Math.abs(stage1Level - stage2Level);
    return Math.max(0, 1 - diff * 0.3);
  }

  /**
   * Get complementary role for matching
   */
  private getComplementaryRole(userRole: string): 'founder' | 'mentor' | 'investor' | 'org' | undefined {
    const complementaryRoles: { [key: string]: string[] } = {
      founder: ['mentor', 'investor'],
      mentor: ['founder', 'org'],
      investor: ['founder', 'org'],
      org: ['mentor', 'investor'],
    };

    return complementaryRoles[userRole]?.[0] as 'founder' | 'mentor' | 'investor' | 'org' | undefined;
  }

  /**
   * Update matching algorithm based on user feedback
   */
  async updateMatchingFeedback(userId: string, matchUserId: string, feedback: 'positive' | 'negative'): Promise<void> {
    const cacheKey = `feedback:${userId}:${matchUserId}`;
    
    // Store feedback for learning algorithm
    await this.cache.set(cacheKey, {
      feedback,
      timestamp: new Date(),
    }, 30 * 24 * 60 * 60); // 30 days

    // Invalidate user's matches cache
    await this.cache.invalidateByTag(`user:${userId}:matches`);
    
    this.logger.log(`Recorded matching feedback: ${userId} -> ${matchUserId} (${feedback})`);
  }

  /**
   * Get user's matching statistics
   */
  async getMatchingStats(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        connectionsSent: true,
        connectionsReceived: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const sentRequests = user.connectionsSent.filter(c => c.status === 'pending');
    const receivedRequests = user.connectionsReceived.filter(c => c.status === 'pending');
    const acceptedConnections = [
      ...user.connectionsSent.filter(c => c.status === 'accepted'),
      ...user.connectionsReceived.filter(c => c.status === 'accepted'),
    ];

    return {
      sentRequests: sentRequests.length,
      receivedRequests: receivedRequests.length,
      totalConnections: acceptedConnections.length,
      acceptanceRate: sentRequests.length > 0 
        ? (acceptedConnections.filter(c => c.requesterId === userId).length / sentRequests.length) * 100
        : 0,
      responseRate: receivedRequests.length > 0
        ? (acceptedConnections.filter(c => c.receiverId === userId).length / receivedRequests.length) * 100
        : 0,
    };
  }
}

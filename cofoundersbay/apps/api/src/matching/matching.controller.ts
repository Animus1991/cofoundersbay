import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MatchingService } from './matching.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get()
  async getRecommendations(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('role') role?: string,
  ) {
    const matches = await this.matching.getRecommendations(
      user.id,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      suggestions: matches.map((m) => ({
        ...m,
        score: Math.round(m.score * 100),
      })),
    };
  }

  @Get('weekly-digest')
  async getWeeklyDigest(@CurrentUser() user: { id: string }) {
    const matches = await this.matching.getRecommendations(user.id, 5);
    const stats = await this.matching.getMatchingStats(user.id);
    return {
      recommendations: matches.map((m) => ({
        userId: m.userId,
        score: Math.round(m.score * 100),
        reasons: m.reasons,
        profile: m.profile,
      })),
      stats,
      generatedAt: new Date().toISOString(),
    };
  }

  @Get('score/:targetUserId')
  async getMatchScore(
    @CurrentUser() user: { id: string },
    @Param('targetUserId') targetUserId: string,
  ) {
    const result = await this.matching.generateMatches({
      userId: user.id,
      remote: true,
    });
    const match = result.matches.find((m) => m.userId === targetUserId);
    const score = match ? Math.round(match.score * 100) : 0;
    const reasons = match?.reasons ?? [];
    return { userId: targetUserId, score, reasons };
  }

  @Get('stats')
  async getStats(@CurrentUser() user: { id: string }) {
    return this.matching.getMatchingStats(user.id);
  }

  @Post('feedback')
  async submitFeedback(
    @CurrentUser() user: { id: string },
    @Body() body: { targetUserId: string; feedback: 'positive' | 'negative' },
  ) {
    await this.matching.updateMatchingFeedback(
      user.id,
      body.targetUserId,
      body.feedback,
    );
    return { ok: true };
  }
}

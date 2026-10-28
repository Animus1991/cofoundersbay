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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MatchingService, publishedMatchReasons } from './matching.service';
import { RestoreMatchFeedbackDto } from './dto/restore-feedback.dto';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get()
  async getRecommendations(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('role') _role?: string,
  ) {
    const matches = await this.matching.getRecommendations(
      user.id,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      suggestions: matches.map((m) => ({
        userId: m.userId,
        score: m.listScore,
        confidence: Math.round(m.confidence * 100),
        reasons: publishedMatchReasons(m),
        explanation: m.explanation,
        profile: m.profile,
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
        score: m.listScore,
        confidence: Math.round(m.confidence * 100),
        reasons: publishedMatchReasons(m),
        explanation: m.explanation,
        profile: m.profile,
      })),
      stats,
      generatedAt: new Date().toISOString(),
    };
  }

  @Get('vs/:targetUserId')
  async getDetailedVs(
    @CurrentUser() user: { id: string },
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.matching.getDetailedVs(user.id, targetUserId);
  }

  @Get('score/:targetUserId')
  async getMatchScore(
    @CurrentUser() user: { id: string },
    @Param('targetUserId') targetUserId: string,
  ) {
    const result = await this.matching.generateMatches({ userId: user.id, remote: true });
    const match = result.matches.find((m) => m.userId === targetUserId);
    return {
      userId: targetUserId,
      score: match ? match.listScore : 0,
      confidence: match ? Math.round(match.confidence * 100) : 0,
      reasons: match ? publishedMatchReasons(match) : [],
      explanation: match?.explanation ?? [],
    };
  }

  @Get('stats')
  async getStats(@CurrentUser() user: { id: string }) {
    return this.matching.getMatchingStats(user.id);
  }

  @Post('feedback')
  async submitFeedback(
    @CurrentUser() user: { id: string },
    @Body() body: {
      targetUserId: string;
      feedback: string;
      connectionStarted?: boolean;
      conversationStarted?: boolean;
    },
  ) {
    // `previous` and `signalId` are what an Undo sends back to /feedback/restore.
    const { previous, signalId } = await this.matching.recordFeedback({
      sourceUserId: user.id,
      targetUserId: body.targetUserId,
      feedback: body.feedback,
      connectionStarted: body.connectionStarted,
      conversationStarted: body.conversationStarted,
    });
    return { ok: true, previous, signalId };
  }

  /** The exact opposite of one `feedback` call, for the member's own outcome only. */
  @Post('feedback/restore')
  async restoreFeedback(
    @CurrentUser() user: { id: string },
    @Body() body: RestoreMatchFeedbackDto,
  ) {
    await this.matching.restoreFeedback({
      sourceUserId: user.id,
      targetUserId: body.targetUserId,
      previous: body.previous ?? null,
      signalId: body.signalId,
    });
    return { ok: true };
  }

  @Post('signal')
  async recordSignal(
    @CurrentUser() user: { id: string },
    @Body() body: { signalType: string; targetId?: string; targetType?: string; value?: number },
  ) {
    await this.matching.recordBehavioralSignal(
      user.id, body.signalType, body.targetId, body.targetType, body.value,
    );
    return { ok: true };
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getAdminStats() {
    return this.matching.getAdminStats();
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('metrics')
  async getMetrics(
    @CurrentUser() user: { id: string },
    @Query('period') period?: string,
  ) {
    return this.analytics.getUserMetrics(user.id, period || '7d');
  }

  @Get('profile-views')
  async getProfileViews(
    @CurrentUser() user: { id: string },
    @Query('period') period?: string,
  ) {
    return this.analytics.getProfileViews(user.id, period || '7d');
  }

  @Get('engagement')
  async getEngagement(
    @CurrentUser() user: { id: string },
    @Query('period') period?: string,
  ) {
    return this.analytics.getEngagementData(user.id, period || '7d');
  }

  @Get('top-content')
  async getTopContent(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    return this.analytics.getTopContent(user.id, parseInt(limit || '10', 10));
  }

  @Get('achievements')
  async getAchievements(@CurrentUser() user: { id: string }) {
    return this.analytics.getUserAchievements(user.id);
  }

  @Get('weekly-summary')
  async getWeeklySummary(@CurrentUser() user: { id: string }) {
    return this.analytics.getWeeklySummary(user.id);
  }

  @Get('growth-trends')
  async getGrowthTrends(
    @CurrentUser() user: { id: string },
    @Query('period') period?: string,
  ) {
    return this.analytics.getGrowthTrends(user.id, period || '30d');
  }
}

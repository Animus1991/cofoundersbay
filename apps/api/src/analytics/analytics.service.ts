import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserMetrics {
  profileViews: number;
  profileViewsChange: number;
  newConnections: number;
  newConnectionsChange: number;
  messagesSent: number;
  messagesSentChange: number;
  engagementRate: number;
  engagementRateChange: number;
  searchAppearances: number;
  searchAppearancesChange: number;
  activityScore: number;
  activityScoreChange: number;
}

export interface ProfileView {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export interface EngagementData {
  connections: number;
  messages: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface TopContent {
  id: string;
  type: 'post' | 'comment' | 'profile';
  title: string;
  views: number;
  engagement: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface WeeklySummary {
  mostActiveDay: string;
  peakHour: string;
  avgResponseTime: string;
  totalInteractions: number;
}

export interface AnalyticsOverview {
  metrics: UserMetrics;
  profileViews: ProfileView[];
  engagement: EngagementData;
  topContent: TopContent[];
  weeklySummary: WeeklySummary;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(
    userId: string,
    period: string,
    topContentLimit = 5,
  ): Promise<AnalyticsOverview> {
    const [metrics, profileViews, engagement, topContent, weeklySummary] =
      await Promise.all([
        this.getUserMetrics(userId, period),
        this.getProfileViews(userId, period),
        this.getEngagementData(userId, period),
        this.getTopContent(userId, topContentLimit),
        this.getWeeklySummary(userId),
      ]);

    return {
      metrics,
      profileViews,
      engagement,
      topContent,
      weeklySummary,
    };
  }

  async getUserMetrics(userId: string, period: string): Promise<UserMetrics> {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Profile Views
    const profileViews = await this.getProfileViewsCount(userId, startDate);
    const previousProfileViews = await this.getProfileViewsCount(
      userId,
      previousStartDate,
      startDate,
    );
    const profileViewsChange = this.calculateChange(
      profileViews,
      previousProfileViews,
    );

    // New Connections (placeholder - would need Connection model)
    const newConnections = 34;
    const previousNewConnections = 31;
    const newConnectionsChange = this.calculateChange(
      newConnections,
      previousNewConnections,
    );

    // Messages Sent
    const messagesSent = await this.prisma.message.count({
      where: {
        senderId: userId,
        createdAt: { gte: startDate },
      },
    });
    const previousMessagesSent = await this.prisma.message.count({
      where: {
        senderId: userId,
        createdAt: { gte: previousStartDate, lt: startDate },
      },
    });
    const messagesSentChange = this.calculateChange(
      messagesSent,
      previousMessagesSent,
    );

    // Engagement Rate (placeholder - would need activity tracking)
    const engagementRate = 24.8;
    const engagementRateChange = 0;

    // Search Appearances (placeholder - would need search tracking)
    const searchAppearances = 892;
    const searchAppearancesChange = 15.7;

    // Activity Score (calculated from various metrics)
    const activityScore = this.calculateActivityScore(
      profileViews,
      newConnections,
      messagesSent,
    );
    const previousActivityScore = this.calculateActivityScore(
      previousProfileViews,
      previousNewConnections,
      previousMessagesSent,
    );
    const activityScoreChange = this.calculateChange(
      activityScore,
      previousActivityScore,
    );

    return {
      profileViews,
      profileViewsChange,
      newConnections,
      newConnectionsChange,
      messagesSent,
      messagesSentChange,
      engagementRate,
      engagementRateChange,
      searchAppearances,
      searchAppearancesChange,
      activityScore,
      activityScoreChange,
    };
  }

  async getProfileViews(userId: string, period: string): Promise<ProfileView[]> {
    const days = this.parsePeriod(period);
    const views: ProfileView[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // This would need a ProfileView tracking table in production
      // For now, returning demo data structure
      views.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 30,
        uniqueVisitors: Math.floor(Math.random() * 40) + 25,
      });
    }

    return views;
  }

  async getEngagementData(
    userId: string,
    period: string,
  ): Promise<EngagementData> {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Connections would need Connection model in production
    const connections = 34;

    const messages = await this.prisma.message.count({
      where: {
        senderId: userId,
        createdAt: { gte: startDate },
      },
    });

    // Likes, comments, shares would need activity/post tracking tables
    const likes = Math.floor(Math.random() * 200) + 100;
    const comments = Math.floor(Math.random() * 50) + 20;
    const shares = Math.floor(Math.random() * 30) + 15;

    return {
      connections,
      messages,
      likes,
      comments,
      shares,
    };
  }

  async getTopContent(userId: string, limit: number): Promise<TopContent[]> {
    // This would need a content tracking system in production
    // Returning demo data structure
    return [
      {
        id: '1',
        type: 'post',
        title: 'Recent activity post',
        views: Math.floor(Math.random() * 1000) + 500,
        engagement: Math.floor(Math.random() * 100) + 50,
        date: new Date().toISOString().split('T')[0],
      },
    ];
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    // Connection count would need Connection model in production
    const connectionCount = 34;

    const achievements: Achievement[] = [
      {
        id: 'early-adopter',
        title: 'Early Adopter',
        description: 'Joined in the first month',
        icon: 'award',
        unlocked: true,
        unlockedAt: profile?.createdAt,
      },
      {
        id: 'networker',
        title: 'Networker',
        description: 'Connected with 50+ members',
        icon: 'users',
        unlocked: connectionCount >= 50,
        unlockedAt: connectionCount >= 50 ? new Date() : undefined,
      },
      {
        id: 'active-contributor',
        title: 'Active Contributor',
        description: 'Posted 100+ times',
        icon: 'message-circle',
        unlocked: false,
      },
      {
        id: 'influencer',
        title: 'Influencer',
        description: '1000+ profile views',
        icon: 'eye',
        unlocked: false,
      },
    ];

    return achievements;
  }

  async getWeeklySummary(userId: string): Promise<WeeklySummary> {
    // This would need detailed activity tracking in production
    return {
      mostActiveDay: 'Monday',
      peakHour: '2:00 PM - 3:00 PM',
      avgResponseTime: '2.3 hours',
      totalInteractions: 156,
    };
  }

  async getGrowthTrends(userId: string, period: string) {
    const days = this.parsePeriod(period);
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        connections: Math.floor(Math.random() * 5),
        profileViews: Math.floor(Math.random() * 50) + 20,
        engagement: Math.floor(Math.random() * 30) + 10,
      });
    }

    return trends;
  }

  private async getProfileViewsCount(
    userId: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<number> {
    // This would query a ProfileView tracking table in production
    // For now, returning a placeholder
    return Math.floor(Math.random() * 1000) + 500;
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private calculateActivityScore(
    views: number,
    connections: number,
    messages: number,
  ): number {
    // Weighted activity score calculation
    const viewsScore = Math.min((views / 1000) * 30, 30);
    const connectionsScore = Math.min((connections / 50) * 40, 40);
    const messagesScore = Math.min((messages / 100) * 30, 30);

    return Math.round(viewsScore + connectionsScore + messagesScore);
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) return 7;

    const [, num, unit] = match;
    const value = parseInt(num, 10);

    switch (unit) {
      case 'd':
        return value;
      case 'w':
        return value * 7;
      case 'm':
        return value * 30;
      case 'y':
        return value * 365;
      default:
        return 7;
    }
  }
}

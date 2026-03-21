import { Injectable } from '@nestjs/common';
import { CacheService } from '../common/cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

export type DashboardStats = {
  activeProfiles: number;
  matchesThisWeek: number;
  trendPercent: number;
  chartData: { label: string; value: number }[];
};

export type ActivityItem = {
  id: string;
  type: 'connection' | 'event';
  title: string;
  author?: string;
  timeAgo: string;
  href: string;
  createdAt: string;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getStats(): Promise<DashboardStats> {
    return this.cache.getOrSet('dashboard:stats', async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const [
        profileCount,
        matchesThisWeek,
        matchesLastWeek,
        chartData,
      ] = await Promise.all([
        this.prisma.profile.count(),
        this.prisma.connectionRequest.count({
          where: {
            status: 'accepted',
            respondedAt: { gte: weekAgo },
          },
        }),
        this.prisma.connectionRequest.count({
          where: {
            status: 'accepted',
            respondedAt: {
              gte: twoWeeksAgo,
              lt: weekAgo,
            },
          },
        }),
        this.getChartData(),
      ]);

      const trendPercent =
        matchesLastWeek > 0
          ? Math.round(((matchesThisWeek - matchesLastWeek) / matchesLastWeek) * 100)
          : matchesThisWeek > 0 ? 100 : 0;

      return {
        activeProfiles: profileCount,
        matchesThisWeek,
        trendPercent,
        chartData,
      };
    }, { ttl: 60, tags: ['dashboard'] });
  }

  private async getChartData(): Promise<{ label: string; value: number }[]> {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const offset = 6 - index;
      const d = new Date(now);
      d.setDate(d.getDate() - offset);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return { label: d.toLocaleDateString('en-GB', { weekday: 'short' }), start: d, end: next };
    });

    const counts = await Promise.all(days.map((day) => (
      this.prisma.connectionRequest.count({
        where: {
          status: 'accepted',
          respondedAt: {
            gte: day.start,
            lt: day.end,
          },
        },
      })
    )));

    return days.map((day, index) => ({
      label: day.label,
      value: counts[index] ?? 0,
    }));
  }

  async getUserSummary(userId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      pendingReceived,
      totalConnections,
      unreadMessages,
      unreadNotifications,
      upcomingEvents,
      myMilestones,
    ] = await Promise.all([
      this.prisma.connectionRequest.count({
        where: { receiverId: userId, status: 'pending' },
      }),
      this.prisma.connectionRequest.count({
        where: {
          status: 'accepted',
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
      }),
      // Count unread messages in conversations where user is a participant
      this.prisma.message.count({
        where: {
          readAt: null,
          senderId: { not: userId },
          conversation: { participants: { some: { userId } } },
        },
      }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
      this.prisma.event.count({
        where: {
          startAt: { gte: now },
          OR: [
            { creatorId: userId },
            { rsvps: { some: { userId } } },
          ],
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.prisma as any).milestone.count({
        where: {
          OR: [{ ownerId: userId }, { collaboratorId: userId }],
          status: { notIn: ['completed', 'cancelled'] },
        },
      }).catch(() => 0),
    ]);

    const newConnectionsThisWeek = await this.prisma.connectionRequest.count({
      where: {
        status: 'accepted',
        respondedAt: { gte: weekAgo },
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
    });

    return {
      pendingReceived,
      totalConnections,
      newConnectionsThisWeek,
      unreadMessages,
      unreadNotifications,
      upcomingEvents,
      activeMilestones: myMilestones,
    };
  }

  async getActivity(limit = 10): Promise<ActivityItem[]> {
    return this.cache.getOrSet(`dashboard:activity:${limit}`, async () => {
      const now = new Date();
      const [connections, events] = await Promise.all([
        this.prisma.connectionRequest.findMany({
          where: { status: 'accepted' },
          orderBy: { respondedAt: 'desc' },
          take: limit,
          include: {
            requester: {
              select: {
                profile: { select: { displayName: true } },
              },
            },
            receiver: {
              select: {
                profile: { select: { displayName: true } },
              },
            },
          },
        }),
        this.prisma.event.findMany({
          where: { startAt: { gte: now } },
          orderBy: { startAt: 'asc' },
          take: Math.floor(limit / 2),
          include: {
            creator: {
              select: {
                profile: { select: { displayName: true } },
              },
            },
          },
        }),
      ]);

      const items: ActivityItem[] = [];

      for (const c of connections) {
        if (!c.respondedAt) continue;
        const requesterName = c.requester.profile?.displayName ?? 'Someone';
        const receiverName = c.receiver.profile?.displayName ?? 'Someone';
        items.push({
          id: `conn-${c.id}`,
          type: 'connection',
          title: `${requesterName} and ${receiverName} connected`,
          timeAgo: formatTimeAgo(c.respondedAt),
          href: '/discover',
          createdAt: c.respondedAt.toISOString(),
        });
      }

      for (const e of events) {
        items.push({
          id: `evt-${e.id}`,
          type: 'event',
          title: e.title,
          author: e.creator.profile?.displayName ?? undefined,
          timeAgo: formatTimeAgo(e.createdAt),
          href: '/events',
          createdAt: e.createdAt.toISOString(),
        });
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items.slice(0, limit);
    }, { ttl: 30, tags: ['dashboard'] });
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

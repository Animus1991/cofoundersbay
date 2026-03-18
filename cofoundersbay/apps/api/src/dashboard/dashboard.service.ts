import { Injectable } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      profileCount,
      matchesThisWeek,
      matchesLastWeek,
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
    ]);

    const trendPercent =
      matchesLastWeek > 0
        ? Math.round(((matchesThisWeek - matchesLastWeek) / matchesLastWeek) * 100)
        : matchesThisWeek > 0 ? 100 : 0;

    const chartData = await this.getChartData();

    return {
      activeProfiles: profileCount,
      matchesThisWeek,
      trendPercent,
      chartData,
    };
  }

  private async getChartData(): Promise<{ label: string; value: number }[]> {
    const days: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = await this.prisma.connectionRequest.count({
        where: {
          status: 'accepted',
          respondedAt: {
            gte: d,
            lt: next,
          },
        },
      });
      days.push({
        label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        value: count,
      });
    }
    return days;
  }

  async getActivity(limit = 10): Promise<ActivityItem[]> {
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

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';

export type GraphMeResponse = {
  me: {
    id: string;
    displayName: string;
    headline: string | null;
    role: string;
    location: string | null;
    avatarUrl: string | null;
  };
  unreadMessages: number;
  pendingIntros: number;
  unreadNotifications: number;
  readiness: { overall: number; lowestLabel?: string; lowestHref?: string } | null;
  nextAction: { id: string; label: string; href: string } | null;
};

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardService,
  ) {}

  async getMe(userId: string): Promise<GraphMeResponse> {
    const [user, pendingIntros, unreadNotifications, participants] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          profile: {
            select: {
              displayName: true,
              headline: true,
              location: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.connectionRequest.count({
        where: { receiverId: userId, status: 'pending' },
      }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
      this.prisma.conversationParticipant.findMany({
        where: { userId, isArchived: false },
        select: { conversationId: true, lastReadAt: true },
        take: 40,
      }),
    ]);

    let unreadMessages = 0;
    if (participants.length > 0) {
      const conversationIds = participants.map((p) => p.conversationId);
      const lastReadByConv = new Map(participants.map((p) => [p.conversationId, p.lastReadAt]));
      const recent = await this.prisma.message.findMany({
        where: {
          conversationId: { in: conversationIds },
          senderId: { not: userId },
        },
        select: { conversationId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 400,
      });
      unreadMessages = recent.filter((m) => {
        const lastRead = lastReadByConv.get(m.conversationId);
        return !lastRead || m.createdAt > lastRead;
      }).length;
    }

    let readiness: GraphMeResponse['readiness'] = null;
    try {
      const vrs = await this.dashboard.computeVentureReadiness(userId);
      readiness = {
        overall: vrs.overall,
        lowestLabel: vrs.lowestDimension?.label,
        lowestHref: vrs.lowestDimension?.href,
      };
    } catch (err) {
      this.logger.debug(`Readiness unavailable for graph: ${String(err)}`);
    }

    const nextAction =
      pendingIntros > 0
        ? { id: 'review-intros', label: 'Review pending intros', href: '/connections' }
        : unreadMessages > 0
          ? { id: 'read-messages', label: 'Catch up on unread messages', href: '/messages' }
          : unreadNotifications > 0
            ? { id: 'read-notifications', label: 'Open notifications', href: '/notifications' }
            : { id: 'review-matches', label: 'Review your matches', href: '/matches' };

    return {
      me: {
        id: user?.id ?? userId,
        displayName: user?.profile?.displayName ?? 'You',
        headline: user?.profile?.headline ?? null,
        role: String(user?.role ?? 'founder'),
        location: user?.profile?.location ?? null,
        avatarUrl: user?.profile?.avatarUrl ?? null,
      },
      unreadMessages,
      pendingIntros,
      unreadNotifications,
      readiness,
      nextAction,
    };
  }
}

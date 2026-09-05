import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { RolesService } from '../roles/roles.service';
import { ConnectionsService } from '../connections/connections.service';
import { MessagingService } from '../messaging/messaging.service';
import { DashboardService } from '../dashboard/dashboard.service';

/**
 * Thin read-only aggregation over existing domain services — the "single
 * source of truth" summary described in docs/AI_PLATFORM_UPGRADE_PLAN.md §4.
 * No new business logic: every field here is produced by a service method
 * that already backs an existing REST endpoint (roles/dashboard-context,
 * me/profile, connections, messages/conversations, dashboard/venture-readiness,
 * notifications/unread-count). This exists so a single call — the `get_graph`
 * tool in §5.1 — can answer "what does this user see right now" instead of
 * requiring N separate round-trips, and so the AI, the dashboards, and the
 * sidebar badges all read the same computation rather than three slightly
 * different ones.
 */
@Injectable()
export class GraphService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly rolesService: RolesService,
    private readonly connectionsService: ConnectionsService,
    private readonly messagingService: MessagingService,
    private readonly dashboardService: DashboardService,
  ) {}

  async getMyGraph(userId: string) {
    const [profile, dashboardContext, pendingConnectionsResult, conversations, readiness, unreadNotifications] =
      await Promise.all([
        this.profileService.getOwnProfile(userId),
        this.rolesService.getUserDashboardContext(userId),
        this.connectionsService.listConnections(userId, 'received', 50),
        this.messagingService.listConversations(userId),
        this.dashboardService.computeVentureReadiness(userId).catch(() => null),
        this.prisma.notification.count({ where: { userId, readAt: null } }),
      ]);

    const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

    return {
      me: {
        id: userId,
        displayName: profile?.displayName ?? null,
        headline: profile?.headline ?? null,
        avatarUrl: (profile as { avatarUrl?: string | null } | null)?.avatarUrl ?? null,
        primaryRole: dashboardContext.primaryRole,
        organizations: dashboardContext.organizations,
        tenants: dashboardContext.tenants,
      },
      unreadMessages,
      pendingConnections: pendingConnectionsResult.connections.length,
      unreadNotifications,
      readiness,
    };
  }
}

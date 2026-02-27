import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConnectionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function profileSelect() {
  return {
    id: true,
    displayName: true,
    avatarUrl: true,
    headline: true,
    user: { select: { role: true } },
  } as const;
}

function mapConnection(c: {
  id: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  requester: { id: string; displayName: string; avatarUrl: string | null; headline: string | null; user: { role: string } };
  receiver: { id: string; displayName: string; avatarUrl: string | null; headline: string | null; user: { role: string } };
}) {
  return {
    id: c.id,
    requesterId: c.requesterId,
    receiverId: c.receiverId,
    status: c.status,
    message: c.message,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    requester: {
      id: c.requester.id,
      displayName: c.requester.displayName,
      avatarUrl: c.requester.avatarUrl,
      role: c.requester.user.role,
      headline: c.requester.headline,
    },
    receiver: {
      id: c.receiver.id,
      displayName: c.receiver.displayName,
      avatarUrl: c.receiver.avatarUrl,
      role: c.receiver.user.role,
      headline: c.receiver.headline,
    },
  };
}

const profileInclude = {
  profile: {
    select: profileSelect(),
  },
};

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendRequest(requesterId: string, receiverId: string, message?: string) {
    if (requesterId === receiverId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    const existing = await this.prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') throw new ConflictException('Already connected');
      if (existing.status === 'pending') throw new ConflictException('Connection request already sent');
      if (existing.status === 'blocked') throw new ForbiddenException('Cannot connect with this user');
      // declined — allow re-request by deleting old record
      await this.prisma.connectionRequest.delete({ where: { id: existing.id } });
    }

    const connection = await this.prisma.connectionRequest.create({
      data: { requesterId, receiverId, message: message?.trim() || null },
      include: {
        requester: { select: { ...profileInclude.profile.select } },
        receiver: { select: { ...profileInclude.profile.select } },
      },
    });

    // Notify receiver
    await this.notifications.createNotification({
      userId: receiverId,
      type: 'connection_request',
      title: `${connection.requester.displayName} wants to connect`,
      body: message?.trim() || 'Sent you a connection request',
      link: '/connections',
    }).catch(() => {});

    return { connection: mapConnection(connection) };
  }

  async listConnections(userId: string, type: 'sent' | 'received' | 'accepted' = 'received', limit = 50) {
    const where =
      type === 'sent'
        ? { requesterId: userId, status: 'pending' as ConnectionStatus }
        : type === 'received'
          ? { receiverId: userId, status: 'pending' as ConnectionStatus }
          : {
              OR: [{ requesterId: userId }, { receiverId: userId }],
              status: 'accepted' as ConnectionStatus,
            };

    const connections = await this.prisma.connectionRequest.findMany({
      where,
      include: {
        requester: { select: { ...profileInclude.profile.select } },
        receiver: { select: { ...profileInclude.profile.select } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return { connections: connections.map(mapConnection) };
  }

  async respondToRequest(connectionId: string, userId: string, status: 'accepted' | 'declined') {
    const connection = await this.prisma.connectionRequest.findUnique({
      where: { id: connectionId },
      include: {
        requester: { select: { ...profileInclude.profile.select } },
        receiver: { select: { ...profileInclude.profile.select } },
      },
    });

    if (!connection) throw new NotFoundException('Connection request not found');
    if (connection.receiverId !== userId) throw new ForbiddenException('Not authorized');
    if (connection.status !== 'pending') throw new ConflictException('Request already responded to');

    const updated = await this.prisma.connectionRequest.update({
      where: { id: connectionId },
      data: { status, respondedAt: new Date() },
      include: {
        requester: { select: { ...profileInclude.profile.select } },
        receiver: { select: { ...profileInclude.profile.select } },
      },
    });

    if (status === 'accepted') {
      await this.notifications.createNotification({
        userId: connection.requesterId,
        type: 'connection_accepted',
        title: `${connection.receiver.displayName} accepted your connection`,
        body: 'You are now connected',
        link: `/profiles/${connection.receiverId}`,
      }).catch(() => {});
    }

    return { connection: mapConnection(updated) };
  }

  async getConnectionStatus(viewerId: string, targetUserId: string) {
    const connection = await this.prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { requesterId: viewerId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: viewerId },
        ],
        status: { not: 'blocked' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!connection) {
      return { status: null, connectionId: null, direction: null };
    }

    return {
      status: connection.status,
      connectionId: connection.id,
      direction: connection.requesterId === viewerId ? 'sent' : 'received',
    };
  }
}

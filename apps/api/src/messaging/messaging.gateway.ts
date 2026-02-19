import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from './messaging.service';
import { PresenceService } from './presence.service';

type AuthedSocket = Socket & { data: { user?: { id: string; email: string; role: string } } };

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  tempId: z.string().min(1).max(100).optional(),
  attachmentUploadIds: z.array(z.string().uuid()).max(5).optional(),
});

const joinSchema = z.object({
  conversationId: z.string().uuid(),
});

function allowedOrigins(): string[] {
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const origins = corsOriginEnv
    ? corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3002'];
  return origins;
}

@WebSocketGateway({
  cors: {
    origin: allowedOrigins(),
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
    private readonly presence: PresenceService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    const token =
      (typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : null) ||
      (typeof client.handshake.headers.authorization === 'string' && client.handshake.headers.authorization.startsWith('Bearer ')
        ? client.handshake.headers.authorization.slice(7)
        : null);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<{ sub: string; type?: string }>(token);
      if (!payload?.sub || payload.type !== 'access') {
        client.disconnect(true);
        return;
      }

      const user = await this.auth.validateUser(payload.sub);
      if (!user) {
        client.disconnect(true);
        return;
      }

      client.data.user = user;
      this.presence.setOnline(user.id);
      void this.prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});

      const convoIds = await this.messaging.getConversationIdsForUser(user.id);
      await Promise.all(convoIds.map((id) => client.join(id)));
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    const userId = client.data.user?.id;
    if (!userId) return;
    this.presence.setOffline(userId);
    void this.prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }

  @SubscribeMessage('conversation:join')
  async handleJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    const input = joinSchema.parse(body);
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: input.conversationId, userId } },
      select: { conversationId: true },
    });
    if (!participant) return;

    await client.join(input.conversationId);
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async handleSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: unknown,
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    const input = sendSchema.parse(body);
    const message = await this.messaging.sendMessage(
      userId,
      input.conversationId,
      input.body,
      input.attachmentUploadIds,
    );

    // Ack to sender (so the UI can reconcile optimistic messages)
    client.emit('message:ack', { tempId: input.tempId ?? null, message });

    // Broadcast to other participants (exclude sender)
    client.to(input.conversationId).emit('message:new', { message });

    return { ok: true };
  }
}


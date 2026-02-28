import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../mailer/email-queue.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
    private readonly config: ConfigService,
  ) {}

  private webBaseUrl(): string {
    return this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000';
  }

  async getUserInvites(userId: string, options: { limit?: number; status?: string }) {
    const where: any = { inviterId: userId };
    
    if (options.status && options.status !== 'all') {
      where.status = options.status;
    }

    const invites = await this.prisma.invite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        acceptedAt: true,
        expiresAt: true,
      },
    });

    return {
      invites: invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        sentAt: inv.createdAt.toISOString(),
        acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
        expiresAt: inv.expiresAt ? inv.expiresAt.toISOString() : null,
      })),
    };
  }

  async getInviteStats(userId: string) {
    const [totalInvites, acceptedInvites, pendingInvites] = await Promise.all([
      this.prisma.invite.count({ where: { inviterId: userId } }),
      this.prisma.invite.count({ where: { inviterId: userId, status: 'accepted' } }),
      this.prisma.invite.count({ where: { inviterId: userId, status: 'pending' } }),
    ]);

    const rewards = acceptedInvites * 10;

    return {
      totalInvites,
      acceptedInvites,
      pendingInvites,
      rewards,
      conversionRate: totalInvites > 0 ? Math.round((acceptedInvites / totalInvites) * 100) : 0,
    };
  }

  async createInvite(userId: string, email: string, message?: string) {
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        inviterId: userId,
        email,
        status: { in: ['pending', 'accepted'] },
      },
    });

    if (existingInvite) {
      throw new Error('Invite already sent to this email');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invite = await this.prisma.invite.create({
      data: {
        inviterId: userId,
        email,
        status: 'pending',
        expiresAt,
        message: message || null,
      },
    });

    const inviter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });

    const inviteUrl = `${this.webBaseUrl()}/register?ref=${userId}&invite=${invite.id}`;

    await this.emailQueue.enqueueSendEmail({
      to: email,
      subject: `${inviter?.displayName || 'Someone'} invited you to join CoFounderBay`,
      text: `You've been invited to join CoFounderBay!\n\nSign up here: ${inviteUrl}`,
      html: `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6">
          <h2 style="margin: 0 0 12px 0; font-size: 18px;">You're Invited to CoFounderBay!</h2>
          <p style="margin: 0 0 16px 0; color: #333">
            ${inviter?.displayName || 'Someone'} has invited you to join CoFounderBay, 
            the premier platform for startup founders, mentors, and investors.
          </p>
          ${message ? `<p style="margin: 0 0 16px 0; color: #555; font-style: italic;">"${message}"</p>` : ''}
          <p style="margin: 0">
            <a href="${inviteUrl}" style="display: inline-block; padding: 10px 14px; background: #111827; color: #fff; text-decoration: none; border-radius: 10px;">
              Accept Invitation
            </a>
          </p>
          <p style="margin: 16px 0 0 0; font-size: 12px; color: #999;">
            This invitation expires in 30 days.
          </p>
        </div>
      `.trim(),
    });

    return {
      invite: {
        id: invite.id,
        email: invite.email,
        status: invite.status,
        sentAt: invite.createdAt.toISOString(),
      },
    };
  }

  async cancelInvite(userId: string, inviteId: string) {
    await this.prisma.invite.updateMany({
      where: {
        id: inviteId,
        inviterId: userId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });

    return { ok: true };
  }

  async acceptInvite(inviteId: string, acceptedUserId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.status !== 'pending') {
      throw new Error('Invalid or expired invite');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: { id: inviteId },
        data: { status: 'expired' },
      });
      throw new Error('Invite has expired');
    }

    await this.prisma.invite.update({
      where: { id: inviteId },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedUserId,
      },
    });

    return { ok: true };
  }
}

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
    // TODO: Implement when Invite model is added to Prisma schema
    // Placeholder implementation
    return {
      invites: [],
    };
  }

  async getInviteStats(userId: string) {
    // TODO: Implement when Invite model is added to Prisma schema
    return {
      totalInvites: 0,
      acceptedInvites: 0,
      pendingInvites: 0,
      rewards: 0,
      conversionRate: 0,
    };
  }

  async createInvite(userId: string, email: string, message?: string) {
    // TODO: Implement when Invite model is added to Prisma schema
    const inviteId = `invite-${Date.now()}`;
    const inviteUrl = `${this.webBaseUrl()}/register?ref=${userId}&invite=${inviteId}`;

    await this.emailQueue.enqueueSendEmail({
      to: email,
      subject: `You've been invited to join CoFounderBay`,
      text: `You've been invited to join CoFounderBay!\n\nSign up here: ${inviteUrl}`,
      html: `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6">
          <h2 style="margin: 0 0 12px 0; font-size: 18px;">You're Invited to CoFounderBay!</h2>
          <p style="margin: 0 0 16px 0; color: #333">
            You've been invited to join CoFounderBay, 
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
        id: inviteId,
        email,
        status: 'pending',
        sentAt: new Date().toISOString(),
      },
    };
  }

  async cancelInvite(userId: string, inviteId: string) {
    // TODO: Implement when Invite model is added to Prisma schema
    return { ok: true };
  }

  async acceptInvite(inviteId: string, acceptedUserId: string) {
    // TODO: Implement when Invite model is added to Prisma schema
    return { ok: true };
  }
}

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailQueueService } from '../mailer/email-queue.service';
import { PrismaService } from '../prisma/prisma.service';

export type DigestType = 'daily' | 'weekly' | 'monthly';
export type DigestContentType = 'connections' | 'messages' | 'opportunities' | 'events' | 'updates';

interface DigestContent {
  type: DigestContentType;
  count: number;
  items: Array<{
    id: string;
    title: string;
    description?: string;
    url?: string;
    createdAt: Date;
  }>;
}

interface DigestData {
  userId: string;
  email: string;
  type: DigestType;
  frequency: DigestType;
  content: Record<DigestContentType, DigestContent | undefined>;
  preferences: {
    connections: boolean;
    messages: boolean;
    opportunities: boolean;
    events: boolean;
    updates: boolean;
  };
}

function digestPeriodStart(type: DigestType, now: Date): Date {
  const start = new Date(now);
  if (type === 'daily') start.setUTCDate(start.getUTCDate() - 1);
  if (type === 'weekly') start.setUTCDate(start.getUTCDate() - 7);
  if (type === 'monthly') start.setUTCMonth(start.getUTCMonth() - 1);
  return start;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

@Injectable()
export class EmailDigestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailDigestService.name);
  private digestJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly config: ConfigService,
    private readonly emailQueue: EmailQueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Email Digest Service initialized');
  }

  onModuleDestroy() {
    // Clear all scheduled jobs
    this.digestJobs.forEach((job) => clearTimeout(job));
    this.digestJobs.clear();
  }

  // Note: Cron jobs should be set up using a proper scheduler like @nestjs/schedule
  // For now, these methods can be called manually or via external scheduler
  
  async sendDailyDigests() {
    this.logger.log('Starting daily digest generation');
    await this.generateDigests('daily');
  }

  async sendWeeklyDigests() {
    this.logger.log('Starting weekly digest generation');
    await this.generateDigests('weekly');
  }

  async sendMonthlyDigests() {
    this.logger.log('Starting monthly digest generation');
    await this.generateDigests('monthly');
  }

  async generateDigests(type: DigestType) {
    const now = new Date();
    const periodStart = digestPeriodStart(type, now);
    const preferences = await this.prisma.activityDigestPreference.findMany({
      where: {
        frequency: type,
        user: { email: { not: { equals: '' } }, emailVerified: true, moderationStatus: 'active' },
      },
      select: { id: true, userId: true, lastSentAt: true, user: { select: { email: true } } },
      orderBy: { userId: 'asc' },
    });
    const summary = { eligible: preferences.length, sent: 0, empty: 0, skipped: 0, failed: 0 };
    this.logger.log(`Generating ${type} digests for ${preferences.length} opted-in users`);

    for (const preference of preferences) {
      if (preference.lastSentAt && preference.lastSentAt >= periodStart) {
        summary.skipped += 1;
        continue;
      }
      const reservation = await this.prisma.activityDigestPreference.updateMany({
        where: {
          id: preference.id,
          frequency: type,
          OR: [{ lastSentAt: null }, { lastSentAt: { lt: periodStart } }],
        },
        data: { lastSentAt: now },
      });
      if (reservation.count !== 1) {
        summary.skipped += 1;
        continue;
      }

      try {
        const digestData = await this.generateUserDigest(preference.userId, preference.user.email, type);
        if (!digestData) {
          summary.empty += 1;
          continue;
        }
        await this.sendDigestEmail(digestData);
        summary.sent += 1;
      } catch (error) {
        summary.failed += 1;
        await this.prisma.activityDigestPreference.updateMany({
          where: { id: preference.id, lastSentAt: now },
          data: { lastSentAt: preference.lastSentAt },
        });
        this.logger.error(`Failed to generate digest for user ${preference.userId}`, error);
      }
    }
    this.logger.log(`Completed ${type} digest generation: ${JSON.stringify(summary)}`);
    return summary;
  }

  async generateUserDigest(
    userId: string,
    email: string,
    type: DigestType,
    options: { ignoreFrequency?: boolean } = {},
  ): Promise<DigestData | null> {
    const now = new Date();
    const startDate = digestPeriodStart(type, now);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        digestPreference: { select: { frequency: true } },
        notificationChannels: {
          where: { channel: 'email', category: { in: ['connections', 'messages', 'opportunities', 'events', 'updates'] } },
          select: { category: true, isEnabled: true },
        },
      },
    });

    if (!user) return null;
    if (!options.ignoreFrequency && user.digestPreference?.frequency !== type) return null;

    const digestPrefs = { connections: true, messages: true, opportunities: true, events: true, updates: false };
    for (const channel of user.notificationChannels) {
      if (channel.category in digestPrefs) {
        digestPrefs[channel.category as DigestContentType] = channel.isEnabled;
      }
    }

    // Generate content for each type
    const content: Record<DigestContentType, DigestContent | undefined> = {
      connections: undefined,
      messages: undefined,
      opportunities: undefined,
      events: undefined,
      updates: undefined,
    };
    
    if (digestPrefs.connections) {
      const connectionsData = await this.getConnectionsDigest(userId, startDate);
      if (connectionsData) content.connections = connectionsData;
    }
    if (digestPrefs.messages) {
      const messagesData = await this.getMessagesDigest(userId, startDate);
      if (messagesData) content.messages = messagesData;
    }
    if (digestPrefs.opportunities) {
      const opportunitiesData = await this.getOpportunitiesDigest(userId, startDate);
      if (opportunitiesData) content.opportunities = opportunitiesData;
    }
    if (digestPrefs.events) {
      const eventsData = await this.getEventsDigest(userId, startDate);
      if (eventsData) content.events = eventsData;
    }
    if (digestPrefs.updates) {
      const updatesData = await this.getUpdatesDigest(userId, startDate);
      if (updatesData) content.updates = updatesData;
    }

    // Return null if no content
    if (!Object.values(content).some((section) => section && section.count > 0)) return null;

    return {
      userId,
      email,
      type,
      frequency: type,
      content,
      preferences: {
        connections: digestPrefs.connections || false,
        messages: digestPrefs.messages || false,
        opportunities: digestPrefs.opportunities || false,
        events: digestPrefs.events || false,
        updates: digestPrefs.updates || false,
      },
    };
  }

  private async getConnectionsDigest(userId: string, since: Date): Promise<DigestContent | null> {
    const connections = await this.prisma.connectionRequest.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: 'accepted',
        updatedAt: { gte: since },
      },
      include: {
        requester: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        receiver: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    if (connections.length === 0) return null;

    return {
      type: 'connections',
      count: connections.length,
      items: connections.map((conn: any) => {
        const otherUser = conn.requesterId === userId ? conn.receiver : conn.requester;
        const name = otherUser.profile?.displayName || otherUser.email;
        return {
          id: conn.id,
          title: `New connection with ${name}`,
          description: 'You connected with this person',
          url: `/connections`,
          createdAt: conn.updatedAt,
        };
      }),
    };
  }

  private async getMessagesDigest(userId: string, since: Date): Promise<DigestContent | null> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId, isArchived: false, isMuted: false },
        },
        messages: {
          some: {
            createdAt: { gte: since },
            senderId: { not: userId },
            deletedAt: null,
          },
        },
      },
      include: {
        messages: {
          where: { createdAt: { gte: since }, senderId: { not: userId }, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            sender: { select: { email: true, profile: { select: { displayName: true } } } },
          },
        },
        participants: {
          where: { userId: { not: userId } },
          include: { user: { select: { email: true, profile: { select: { displayName: true } } } } },
          take: 1,
        },
      },
      take: 10,
    });

    if (conversations.length === 0) return null;

    return {
      type: 'messages',
      count: conversations.length,
      items: conversations.map((conv: any) => {
        const otherParticipant = conv.participants[0];
        const latestMessage = conv.messages[0];
        return {
          id: conv.id,
          title: `Messages from ${otherParticipant?.user.profile?.displayName || otherParticipant?.user.email || 'a connection'}`,
          description: latestMessage?.body?.substring(0, 100) || 'New messages',
          url: '/messages',
          createdAt: latestMessage?.createdAt || conv.updatedAt,
        };
      }),
    };
  }

  private async getOpportunitiesDigest(userId: string, since: Date): Promise<DigestContent | null> {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        createdAt: { gte: since },
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (opportunities.length === 0) return null;

    return {
      type: 'opportunities',
      count: opportunities.length,
      items: opportunities.map((opp: any) => ({
        id: opp.id,
        title: opp.title,
        description: opp.description?.substring(0, 100) || 'New opportunity available',
        url: '/opportunities',
        createdAt: opp.createdAt,
      })),
    };
  }

  private async getEventsDigest(userId: string, since: Date): Promise<DigestContent | null> {
    const now = new Date();
    const windowMs = Math.max(24 * 60 * 60 * 1000, now.getTime() - since.getTime());
    const until = new Date(now.getTime() + windowMs);
    const events = await this.prisma.event.findMany({
      where: {
        startAt: { gte: now, lte: until },
      },
      orderBy: { startAt: 'asc' },
      take: 10,
    });

    if (events.length === 0) return null;

    return {
      type: 'events',
      count: events.length,
      items: events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description?.substring(0, 100) || 'Upcoming event',
        url: `/events/${event.id}`,
        createdAt: event.createdAt,
      })),
    };
  }

  private async getUpdatesDigest(userId: string, since: Date): Promise<DigestContent | null> {
    // Platform updates need a persisted, auditable source before they can be
    // claimed in a personalized email.
    return null;
  }

  private webBaseUrl(): string {
    const configured = this.config.get<string>('WEB_BASE_URL') ?? this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const url = new URL(configured);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('WEB_BASE_URL must use HTTP or HTTPS');
    return url.origin;
  }

  private absoluteUrl(path: string): string {
    return new URL(path.startsWith('/') ? path : `/${path}`, `${this.webBaseUrl()}/`).toString();
  }

  private async sendDigestEmail(digestData: DigestData) {
    const subject = `Your ${digestData.type} CoFounderBay Digest`;
    
    // Generate HTML content
    const html = this.generateDigestHTML(digestData);
    
    // Generate text content
    const text = this.generateDigestText(digestData);

    const delivery = await this.emailQueue.enqueueSendEmail({
      to: digestData.email,
      subject,
      html,
      text,
    });
    if (delivery === 'disabled') throw new Error('Email delivery is disabled');
    this.logger.log(`${delivery === 'queued' ? 'Queued' : 'Sent'} ${digestData.type} digest for user ${digestData.userId}`);
  }

  private generateDigestHTML(data: DigestData): string {
    const typeTitle = data.type.charAt(0).toUpperCase() + data.type.slice(1);
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CoFounderBay ${typeTitle} Digest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6756dc; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px 0; }
          .section { margin-bottom: 30px; }
          .section-title { color: #6756dc; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .item { border-left: 3px solid #e5e7eb; padding-left: 15px; margin-bottom: 15px; }
          .item-title { font-weight: bold; margin-bottom: 5px; }
          .item-description { color: #666; font-size: 14px; margin-bottom: 5px; }
          .item-time { color: #999; font-size: 12px; }
          .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #6756dc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CoFounderBay ${typeTitle} Digest</h1>
            <p>Your personalized summary of the past ${data.type}</p>
          </div>
          
          <div class="content">
    `;

    // Add content sections
    Object.entries(data.content).forEach(([type, content]) => {
      if (content && content.count > 0) {
        html += `
          <div class="section">
            <div class="section-title">${content.count} New ${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        `;
        
        content.items.forEach(item => {
          html += `
            <div class="item">
              <div class="item-title">${escapeHtml(item.title)}</div>
              ${item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ''}
              <div class="item-time">${escapeHtml(item.createdAt.toLocaleDateString('en-GB', { timeZone: 'UTC' }))}</div>
              ${item.url ? `<a href="${escapeHtml(this.absoluteUrl(item.url))}" class="btn">View</a>` : ''}
            </div>
          `;
        });
        
        html += '</div>';
      }
    });

    html += `
          </div>
          
          <div class="footer">
            <p>You're receiving this because you subscribed to CoFounderBay digests.</p>
            <p><a href="${escapeHtml(this.absoluteUrl('/settings/notifications'))}">Manage your preferences</a> | <a href="${escapeHtml(this.absoluteUrl('/settings/notifications?digest=never'))}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  private generateDigestText(data: DigestData): string {
    const typeTitle = data.type.charAt(0).toUpperCase() + data.type.slice(1);
    
    let text = `CoFounderBay ${typeTitle} Digest\n\n`;
    text += `Your personalized summary of the past ${data.type}\n\n`;

    Object.entries(data.content).forEach(([type, content]) => {
      if (content && content.count > 0) {
        text += `${content.count} New ${type.charAt(0).toUpperCase() + type.slice(1)}\n`;
        text += '─'.repeat(30) + '\n';
        
        content.items.forEach(item => {
          text += `• ${item.title}\n`;
          if (item.description) {
            text += `  ${item.description}\n`;
          }
          if (item.url) {
            text += `  View: ${this.absoluteUrl(item.url)}\n`;
          }
          text += '\n';
        });
        
        text += '\n';
      }
    });

    text += '─'.repeat(50) + '\n';
    text += "You're receiving this because you subscribed to CoFounderBay digests.\n";
    text += `Manage preferences: ${this.absoluteUrl('/settings/notifications')}\n`;
    text += `Unsubscribe: ${this.absoluteUrl('/settings/notifications?digest=never')}\n`;

    return text;
  }

  // Manual trigger for testing
  async sendTestDigest(userId: string, type: DigestType = 'daily') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      throw new Error('User not found or no email address');
    }

    const digestData = await this.generateUserDigest(userId, user.email, type, { ignoreFrequency: true });
    if (!digestData) {
      throw new Error('No digest content available');
    }

    await this.sendDigestEmail(digestData);
    this.logger.log(`Test ${type} digest sent for user ${userId}`);
  }
}

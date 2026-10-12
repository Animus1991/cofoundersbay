import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  readViewSource,
  summariseViewers,
  VIEWERS_WINDOW_DAYS,
  type ProfileViewersView,
  type ViewerPerson,
} from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileViewService } from '../analytics/profile-view.service';

/**
 * Who viewed a member's profile (packages/shared profile-viewers).
 *
 * Views were counted in Analytics, yet nothing ever recorded one: the
 * `trackView` that writes them had no caller, so every "profile views" figure
 * read 0. The profile pages now report a view here, and the owner reads a
 * summary that names only viewers who chose to be named - and only to an
 * owner who chose the same.
 */
@Injectable()
export class ProfileViewersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly views: ProfileViewService,
  ) {}

  /** Records that `viewerId` (or someone signed out) opened `userId`'s profile. Self-views are not counted. */
  async record(userId: string, viewerId: string | null, body: unknown): Promise<{ recorded: boolean }> {
    if (!userId || userId.length > 128) throw new BadRequestException('A profile id is required');
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundException('Profile not found');
    if (viewerId === userId) return { recorded: false };
    const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    await this.views.trackView(profile.id, viewerId, readViewSource(b.source));
    return { recorded: true };
  }

  async getSetting(userId: string): Promise<{ shareName: boolean }> {
    const row = await this.prisma.profileViewerSetting.findUnique({ where: { userId }, select: { shareName: true } });
    return { shareName: row?.shareName ?? false };
  }

  async setSetting(userId: string, body: unknown): Promise<{ shareName: boolean }> {
    const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    if (typeof b.shareName !== 'boolean') throw new BadRequestException('shareName must be true or false');
    const row = await this.prisma.profileViewerSetting.upsert({
      where: { userId },
      create: { userId, shareName: b.shareName },
      update: { shareName: b.shareName },
      select: { shareName: true },
    });
    return { shareName: row.shareName };
  }

  async summary(userId: string, now = Date.now()): Promise<ProfileViewersView> {
    const reader = await this.getSetting(userId);
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) return summariseViewers([], new Map(), { readerSharesName: reader.shareName, now, readerId: userId });
    const rows = (await this.prisma.profileView.findMany({
      where: { profileId: profile.id, createdAt: { gte: new Date(now - VIEWERS_WINDOW_DAYS * 86_400_000) } },
      select: { viewerId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })) as Array<{ viewerId: string | null; createdAt: Date }>;
    const ids = [...new Set(rows.map((r) => r.viewerId).filter((id): id is string => Boolean(id)))];
    const [users, settings] = ids.length
      ? await Promise.all([
          this.prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, role: true, profile: { select: { displayName: true, headline: true, avatarUrl: true } } },
          }) as Promise<Array<{ id: string; role: string | null; profile: { displayName: string; headline: string | null; avatarUrl: string | null } | null }>>,
          this.prisma.profileViewerSetting.findMany({ where: { userId: { in: ids } }, select: { userId: true, shareName: true } }) as Promise<Array<{ userId: string; shareName: boolean }>>,
        ])
      : [[], []];
    const shares = new Set(settings.filter((s) => s.shareName).map((s) => s.userId));
    const people = new Map<string, ViewerPerson>();
    for (const u of users) {
      if (!u.profile) continue;
      people.set(u.id, {
        id: u.id,
        displayName: u.profile.displayName,
        headline: u.profile.headline,
        avatarUrl: u.profile.avatarUrl,
        role: u.role,
        shareName: shares.has(u.id),
      });
    }
    return summariseViewers(
      rows.map((r) => ({ viewerId: r.viewerId, viewedAt: r.createdAt })),
      people,
      { readerSharesName: reader.shareName, now, readerId: userId },
    );
  }
}

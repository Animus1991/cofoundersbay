import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioItemType, type ProfilePortfolioItem } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { isMembersOnlyProfile } from '@cofounderbay/shared';

/** Enough for a career; past this a profile stops being read. */
export const PORTFOLIO_LIMIT = 30;

const webAddress = z.string().trim().url().max(500).refine((v) => /^https?:\/\//i.test(v), 'url must start with http or https');
const url = z.union([webAddress, z.literal('')]).nullish().transform((v) => v || null);

export const portfolioItemSchema = z.object({
  type: z.nativeEnum(PortfolioItemType).default(PortfolioItemType.project),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullish().transform((v) => v || null),
  url,
});
export const updatePortfolioItemSchema = portfolioItemSchema.partial();

function view(item: ProfilePortfolioItem) {
  return { id: item.id, type: item.type, title: item.title, description: item.description, url: item.url, createdAt: item.createdAt.toISOString() };
}

/**
 * The work a member shows on their profile (docs §111). The profile's button
 * and the edit form's tab said "coming soon" over a model nothing used.
 * Readers see what the profile itself lets them see: a members-only profile
 * answers not found without a session, as its other parts do.
 */
@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  private list(userId: string) {
    return this.prisma.profilePortfolioItem.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: PORTFOLIO_LIMIT,
    });
  }

  async mine(userId: string) {
    return { items: (await this.list(userId)).map(view) };
  }

  async ofMember(userId: string, viewerId?: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { visibilityRules: true } });
    if (!profile || (!viewerId && isMembersOnlyProfile(profile.visibilityRules))) throw new NotFoundException('Profile not found');
    return { items: (await this.list(userId)).map(view) };
  }

  async add(userId: string, input: z.infer<typeof portfolioItemSchema>) {
    const count = await this.prisma.profilePortfolioItem.count({ where: { userId } });
    if (count >= PORTFOLIO_LIMIT) throw new BadRequestException(`A portfolio holds up to ${PORTFOLIO_LIMIT} items`);
    await this.prisma.profilePortfolioItem.create({ data: { userId, ...input } });
    return this.mine(userId);
  }

  async update(userId: string, id: string, input: z.infer<typeof updatePortfolioItemSchema>) {
    const { count } = await this.prisma.profilePortfolioItem.updateMany({ where: { id, userId }, data: input });
    if (count === 0) throw new NotFoundException('Portfolio item not found');
    return this.mine(userId);
  }

  async remove(userId: string, id: string) {
    const { count } = await this.prisma.profilePortfolioItem.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException('Portfolio item not found');
    return this.mine(userId);
  }
}

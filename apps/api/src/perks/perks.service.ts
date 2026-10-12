import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  isCardStage,
  isPerkCategory,
  perkForReader,
  perkIsOpen,
  rankPerksForStage,
  readPerkInput,
  type PerkCategory,
  type PerkStage,
  type PerkView,
} from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';

type PerkRow = {
  id: string;
  partner: string;
  title: string;
  titleEl: string | null;
  summary: string;
  summaryEl: string | null;
  value: string;
  valueEl: string | null;
  category: string;
  stages: string[];
  howToRedeem: string;
  howToRedeemEl: string | null;
  terms: string | null;
  termsEl: string | null;
  code: string | null;
  redeemUrl: string | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  _count?: { claims: number };
};

const PERK_SELECT = {
  id: true,
  partner: true,
  title: true,
  titleEl: true,
  summary: true,
  summaryEl: true,
  value: true,
  valueEl: true,
  category: true,
  stages: true,
  howToRedeem: true,
  howToRedeemEl: true,
  terms: true,
  termsEl: true,
  code: true,
  redeemUrl: true,
  expiresAt: true,
  active: true,
  createdAt: true,
  _count: { select: { claims: true } },
} as const;

/**
 * Partner offers. A member reads the open ones and claims each once; the code
 * and the redeem link are revealed to them only after the claim. Nothing
 * here tells a partner who claimed: there is no endpoint that lists claimers,
 * and admins see a count.
 */
@Injectable()
export class PerksService {
  constructor(private readonly prisma: PrismaService) {}

  private full(row: PerkRow, claimedAt: Date | null): PerkView {
    return {
      id: row.id,
      partner: row.partner,
      title: row.title,
      titleEl: row.titleEl,
      summary: row.summary,
      summaryEl: row.summaryEl,
      value: row.value,
      valueEl: row.valueEl,
      category: (isPerkCategory(row.category) ? row.category : 'software') as PerkCategory,
      stages: row.stages.filter(isCardStage) as PerkStage[],
      howToRedeem: row.howToRedeem,
      howToRedeemEl: row.howToRedeemEl,
      terms: row.terms,
      termsEl: row.termsEl,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      active: row.active,
      claimCount: row._count?.claims ?? 0,
      claimed: claimedAt !== null,
      claimedAt: claimedAt ? claimedAt.toISOString() : null,
      code: row.code,
      redeemUrl: row.redeemUrl,
    };
  }

  /** Open perks for a member, the ones for `stage` first; codes only where claimed. */
  async list(userId: string, query: { category?: string; stage?: string }): Promise<{ perks: PerkView[] }> {
    if (query.category && !isPerkCategory(query.category)) throw new BadRequestException('Unknown category');
    const now = new Date();
    const [rows, claims] = await Promise.all([
      this.prisma.perk.findMany({
        where: {
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          ...(query.category ? { category: query.category } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: PERK_SELECT,
      }) as Promise<PerkRow[]>,
      this.prisma.perkClaim.findMany({ where: { userId }, select: { perkId: true, createdAt: true } }) as Promise<Array<{ perkId: string; createdAt: Date }>>,
    ]);
    const claimedAt = new Map(claims.map((c) => [c.perkId, c.createdAt]));
    const views = rows.map((row) => {
      const at = claimedAt.get(row.id) ?? null;
      return perkForReader(this.full(row, at), { claimed: at !== null });
    });
    return { perks: rankPerksForStage(views, isCardStage(query.stage) ? query.stage : null) };
  }

  /**
   * Claims a perk once. Claiming again answers with the same claim; a perk
   * that is switched off or past its end cannot be claimed.
   */
  async claim(userId: string, perkId: string): Promise<{ perk: PerkView }> {
    const row = (await this.prisma.perk.findUnique({ where: { id: perkId }, select: PERK_SELECT })) as PerkRow | null;
    if (!row) throw new NotFoundException('That perk does not exist');
    const existing = (await this.prisma.perkClaim.findUnique({
      where: { perkId_userId: { perkId, userId } },
      select: { createdAt: true },
    })) as { createdAt: Date } | null;
    if (existing) return { perk: perkForReader(this.full(row, existing.createdAt), { claimed: true }) };
    if (!perkIsOpen(row, Date.now())) throw new ConflictException('This perk is no longer offered');
    const claim = (await this.prisma.perkClaim.create({ data: { perkId, userId }, select: { createdAt: true } })) as { createdAt: Date };
    const counted = { ...row, _count: { claims: (row._count?.claims ?? 0) + 1 } };
    return { perk: perkForReader(this.full(counted, claim.createdAt), { claimed: true }) };
  }

  /** Every perk, open or not, with codes and counts: platform admins only (the controller guards it). */
  async adminList(): Promise<{ perks: PerkView[] }> {
    const rows = (await this.prisma.perk.findMany({ orderBy: { createdAt: 'desc' }, take: 500, select: PERK_SELECT })) as PerkRow[];
    return { perks: rows.map((row) => perkForReader(this.full(row, null), { claimed: false, admin: true })) };
  }

  async create(adminId: string, body: unknown): Promise<{ perk: PerkView }> {
    const input = readPerkInput(body);
    if (!input.ok) throw new BadRequestException(input.error);
    const { expiresAt, ...rest } = input.value;
    const row = (await this.prisma.perk.create({
      data: { ...rest, expiresAt: expiresAt ? new Date(expiresAt) : null, createdById: adminId },
      select: PERK_SELECT,
    })) as PerkRow;
    return { perk: perkForReader(this.full(row, null), { claimed: false, admin: true }) };
  }

  /**
   * Replaces a perk's fields, or switches it on or off with `{ active }`
   * alone. Switching off keeps every claim: a member who claimed still sees
   * their code under "Claimed".
   */
  async update(perkId: string, body: unknown): Promise<{ perk: PerkView }> {
    const exists = await this.prisma.perk.findUnique({ where: { id: perkId }, select: { id: true } });
    if (!exists) throw new NotFoundException('That perk does not exist');
    const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    let data: Record<string, unknown>;
    if (Object.keys(b).length === 1 && typeof b.active === 'boolean') {
      data = { active: b.active };
    } else {
      const input = readPerkInput(body);
      if (!input.ok) throw new BadRequestException(input.error);
      const { expiresAt, ...rest } = input.value;
      data = { ...rest, expiresAt: expiresAt ? new Date(expiresAt) : null };
    }
    const row = (await this.prisma.perk.update({ where: { id: perkId }, data, select: PERK_SELECT })) as PerkRow;
    return { perk: perkForReader(this.full(row, null), { claimed: false, admin: true }) };
  }

  /** The perks a member claimed, newest first, with their codes - including ones since switched off. */
  async claimed(userId: string): Promise<{ perks: PerkView[] }> {
    const claims = (await this.prisma.perkClaim.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { createdAt: true, perk: { select: PERK_SELECT } },
    })) as Array<{ createdAt: Date; perk: PerkRow }>;
    return { perks: claims.map((c) => perkForReader(this.full(c.perk, c.createdAt), { claimed: true })) };
  }
}

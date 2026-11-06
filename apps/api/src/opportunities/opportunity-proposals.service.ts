import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type { OpportunityProposalStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform((v) => v || null);

export const sendProposalSchema = z.object({
  scope: z.string().trim().min(10).max(2000),
  timeframe: optionalText(120),
  compensation: optionalText(120),
});

export const answerProposalSchema = z.object({
  status: z.enum(['accepted', 'declined', 'withdrawn']),
});

const PROPOSAL_SELECT = {
  id: true,
  opportunityId: true,
  fromId: true,
  scope: true,
  timeframe: true,
  compensation: true,
  status: true,
  respondedAt: true,
  createdAt: true,
  opportunity: { select: { title: true, createdById: true } },
  from: { select: { role: true, profile: { select: { displayName: true, avatarUrl: true, headline: true } } } },
} satisfies Prisma.OpportunityProposalSelect;

type Row = Prisma.OpportunityProposalGetPayload<{ select: typeof PROPOSAL_SELECT }>;

function view(row: Row) {
  return {
    id: row.id,
    opportunityId: row.opportunityId,
    opportunityTitle: row.opportunity.title,
    from: {
      id: row.fromId,
      displayName: row.from.profile?.displayName ?? null,
      avatarUrl: row.from.profile?.avatarUrl ?? null,
      headline: row.from.profile?.headline ?? null,
      role: row.from.role,
    },
    scope: row.scope,
    timeframe: row.timeframe,
    compensation: row.compensation,
    status: row.status,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Proposals on a listing (docs §111). The Proposals tab showed two sample
 * cards to anyone with samples on and nothing to real accounts, because
 * nothing could receive one.
 *
 * The listing's owner answers; the sender can only withdraw. Neither answer
 * can be changed once given, so a decision the other side was told about
 * stays true. A block in either direction stops a proposal, as it stops a
 * message, and says no more than that.
 */
@Injectable()
export class OpportunityProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    // Optional so unit tests that build the service without it still work.
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  private async tell(userId: string, title: string, link: string) {
    await this.notifications?.createNotification({ userId, type: 'system', title, body: null, link }).catch(() => undefined);
  }

  async send(fromId: string, opportunityId: string, input: z.infer<typeof sendProposalSchema>) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, title: true, isActive: true, createdById: true, deadline: true },
    });
    if (!opportunity || !opportunity.isActive) throw new NotFoundException('Opportunity not found');
    if (opportunity.createdById === fromId) throw new BadRequestException('You cannot send a proposal to your own listing');
    if (opportunity.deadline && opportunity.deadline.getTime() < Date.now()) throw new BadRequestException('This listing has closed');

    const blocked = await this.prisma.userBlock.findFirst({
      where: { OR: [{ blockerId: opportunity.createdById, blockedId: fromId }, { blockerId: fromId, blockedId: opportunity.createdById }] },
      select: { id: true },
    });
    if (blocked) throw new ForbiddenException('You cannot send a proposal to this member');

    const existing = await this.prisma.opportunityProposal.findUnique({
      where: { opportunityId_fromId: { opportunityId, fromId } },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== 'withdrawn') throw new ConflictException('You have already sent a proposal for this listing');

    const fields = { scope: input.scope, timeframe: input.timeframe, compensation: input.compensation, status: 'pending' as const, respondedAt: null };
    const row = existing
      ? await this.prisma.opportunityProposal.update({ where: { id: existing.id }, data: fields, select: PROPOSAL_SELECT })
      : await this.prisma.opportunityProposal.create({ data: { opportunityId, fromId, ...fields }, select: PROPOSAL_SELECT });

    const name = row.from.profile?.displayName ?? 'A member';
    await this.tell(opportunity.createdById, `${name} sent a proposal for ${opportunity.title}`, '/opportunities?tab=proposals');
    return { proposal: view(row) };
  }

  async incoming(ownerId: string) {
    const rows = await this.prisma.opportunityProposal.findMany({
      where: { opportunity: { createdById: ownerId }, status: { not: 'withdrawn' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: PROPOSAL_SELECT,
    });
    return { proposals: rows.map(view) };
  }

  async sent(fromId: string) {
    const rows = await this.prisma.opportunityProposal.findMany({
      where: { fromId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: PROPOSAL_SELECT,
    });
    return { proposals: rows.map(view) };
  }

  async answer(userId: string, id: string, status: Exclude<OpportunityProposalStatus, 'pending'>) {
    const row = await this.prisma.opportunityProposal.findUnique({ where: { id }, select: PROPOSAL_SELECT });
    const isOwner = row?.opportunity.createdById === userId;
    const isSender = row?.fromId === userId;
    // A proposal belongs to two people; anyone else is told it is not there.
    if (!row || (!isOwner && !isSender)) throw new NotFoundException('Proposal not found');
    if (status === 'withdrawn' ? !isSender : !isOwner) throw new ForbiddenException('You cannot make this change');
    if (row.status !== 'pending') throw new ConflictException('This proposal has already been answered');

    const updated = await this.prisma.opportunityProposal.update({
      where: { id },
      data: { status, respondedAt: new Date() },
      select: PROPOSAL_SELECT,
    });
    if (status !== 'withdrawn') {
      await this.tell(row.fromId, `Your proposal for ${row.opportunity.title} was ${status}`, '/opportunities?tab=applications');
    }
    return { proposal: view(updated) };
  }
}

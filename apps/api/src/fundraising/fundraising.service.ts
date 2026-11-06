import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { DataRoomDocCategory, DataRoomDocument, FundraisingRound, InvestorLeadStatus, InvestorPipelineLead, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { validateUpload } from '../uploads/upload-validation';
import type { CreateLead, CreateRound, ShareDocuments, UpdateDocument, UpdateLead, UpdateRound } from './fundraising.schemas';

const COMMITTED: InvestorLeadStatus = 'committed';

function money(value: Prisma.Decimal | null | undefined): number | null {
  return value == null ? null : Number(value);
}

type Person = { id: string; displayName: string; avatarUrl: string | null; headline: string | null };
type Openings = { openedBy: string[]; lastOpenedAt: string | null };

function leadView(lead: InvestorPipelineLead, people: Map<string, Person>) {
  return {
    id: lead.id,
    investorName: lead.investorName,
    investorFirm: lead.investorFirm,
    investorType: lead.investorType,
    stageFocus: lead.stageFocus,
    checkSizeText: lead.checkSizeText,
    status: lead.status,
    committedAmount: money(lead.committedAmount),
    currency: lead.currency,
    lastContactAt: lead.lastContactAt?.toISOString() ?? null,
    nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
    nextStep: lead.nextStep,
    notes: lead.notes,
    isVerifiedOnPlatform: lead.isVerifiedOnPlatform,
    linkedAccount: lead.platformUserId ? (people.get(lead.platformUserId) ?? null) : null,
  };
}

/** The storage key stays here: a client gets to know that a file exists, not where. */
function documentView(doc: DataRoomDocument, openings?: Openings) {
  return {
    id: doc.id,
    name: doc.name,
    category: doc.category,
    status: doc.status,
    isRequired: doc.isRequired,
    hasFile: Boolean(doc.fileUrl),
    fileName: doc.fileName,
    fileMimeType: doc.fileMimeType,
    fileSizeBytes: doc.fileSizeBytes,
    viewCount: doc.viewCount,
    sharedWithLeads: doc.sharedWithLeads,
    openedBy: openings?.openedBy ?? [],
    lastOpenedAt: openings?.lastOpenedAt ?? null,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function roundView(round: FundraisingRound, leads: InvestorPipelineLead[]) {
  const committed = leads.filter((l) => l.status === COMMITTED);
  return {
    id: round.id,
    name: round.name,
    roundType: round.roundType,
    status: round.status,
    currency: round.currency,
    targetAmount: money(round.targetAmount),
    // One number: what the committed investors add up to, never a typed total
    // beside them that can disagree with the list under it.
    raisedAmount: committed.reduce((sum, l) => sum + (money(l.committedAmount) ?? 0), 0),
    investors: committed.length,
    preMoneyValuation: money(round.preMoneyValuation),
    leadInvestorName: round.leadInvestorName,
    closingDate: round.closingDate?.toISOString() ?? null,
    description: round.description,
  };
}

/**
 * A founder's round, the investors they are talking to and the data room
 * (docs §111).
 *
 * Until this, /fundraising showed real accounts nothing but contacts held in
 * one tab's sessionStorage. Everything here belongs to its owner: another
 * member's id answers 404, not 403, so ids cannot be probed. Files live in
 * private storage and each opening by someone else is logged.
 */
@Injectable()
export class FundraisingService {
  private readonly logger = new Logger(FundraisingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    // Optional so unit tests that build the service without it still work.
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  private async tell(userId: string, title: string) {
    await this.notifications
      ?.createNotification({ userId, type: 'fundraising_update', title, body: null, link: '/data-room' })
      .catch((err: unknown) => this.logger.warn(`Data room notice not sent: ${String(err)}`));
  }

  private async nameOf(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { displayName: true } });
    return profile?.displayName ?? 'A founder';
  }

  private async people(ids: string[]): Promise<Map<string, Person>> {
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.profile.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, displayName: true, avatarUrl: true, headline: true },
    });
    return new Map(rows.map((r) => [r.userId, { id: r.userId, displayName: r.displayName, avatarUrl: r.avatarUrl, headline: r.headline }]));
  }

  /** Who opened each file, latest first: the owner's answer to "has anyone read this?". */
  private async openings(roundId: string): Promise<Map<string, Openings>> {
    const logs = await this.prisma.dataRoomAccessLog.findMany({
      where: { roundId },
      orderBy: { accessedAt: 'desc' },
      take: 500,
      select: { documentId: true, accessorId: true, accessedAt: true },
    });
    const people = await this.people([...new Set(logs.map((l) => l.accessorId))]);
    const byDocument = new Map<string, Openings>();
    for (const log of logs) {
      const entry = byDocument.get(log.documentId) ?? { openedBy: [], lastOpenedAt: log.accessedAt.toISOString() };
      const name = people.get(log.accessorId)?.displayName;
      if (name && !entry.openedBy.includes(name) && entry.openedBy.length < 5) entry.openedBy.push(name);
      byDocument.set(log.documentId, entry);
    }
    return byDocument;
  }

  /** The round in progress, else the latest one. */
  private currentRound(ownerId: string) {
    return this.prisma.fundraisingRound.findFirst({
      where: { ownerId },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /** Contacts and documents hang off a round, so the first one opens a plain one. */
  private async ensureRound(ownerId: string, currency = 'EUR') {
    return (await this.currentRound(ownerId)) ?? this.prisma.fundraisingRound.create({ data: { ownerId, name: 'My round', currency } });
  }

  private async ownRound(ownerId: string, id: string) {
    const round = await this.prisma.fundraisingRound.findFirst({ where: { id, ownerId } });
    if (!round) throw new NotFoundException('Round not found');
    return round;
  }

  private async ownLead(ownerId: string, id: string) {
    const lead = await this.prisma.investorPipelineLead.findFirst({ where: { id, round: { ownerId } } });
    if (!lead) throw new NotFoundException('Investor not found');
    return lead;
  }

  private async ownDocument(ownerId: string, id: string) {
    const doc = await this.prisma.dataRoomDocument.findFirst({ where: { id, uploadedById: ownerId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async state(ownerId: string) {
    const round = await this.currentRound(ownerId);
    if (!round) return { round: null, leads: [], documents: [] };
    const [leads, documents, openings] = await Promise.all([
      this.prisma.investorPipelineLead.findMany({ where: { roundId: round.id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dataRoomDocument.findMany({ where: { roundId: round.id }, orderBy: { createdAt: 'desc' } }),
      this.openings(round.id),
    ]);
    const people = await this.people(leads.flatMap((l) => (l.platformUserId ? [l.platformUserId] : [])));
    return {
      round: roundView(round, leads),
      leads: leads.map((l) => leadView(l, people)),
      documents: documents.map((d) => documentView(d, openings.get(d.id))),
    };
  }

  async createRound(ownerId: string, input: CreateRound) {
    await this.prisma.fundraisingRound.create({ data: { ownerId, ...input } });
    return this.state(ownerId);
  }

  async updateRound(ownerId: string, id: string, input: UpdateRound) {
    await this.ownRound(ownerId, id);
    await this.prisma.fundraisingRound.update({ where: { id }, data: input });
    return this.state(ownerId);
  }

  async createLead(ownerId: string, input: CreateLead) {
    const round = await this.ensureRound(ownerId);
    await this.prisma.investorPipelineLead.create({
      data: { ...input, roundId: round.id, addedById: ownerId, currency: round.currency, lastContactAt: input.status === 'prospect' ? null : new Date() },
    });
    return this.state(ownerId);
  }

  async updateLead(ownerId: string, id: string, input: UpdateLead) {
    const lead = await this.ownLead(ownerId, id);
    const { platformUserId, ...fields } = input;
    const moved = fields.status !== undefined && fields.status !== lead.status;
    const relinked = platformUserId !== undefined && platformUserId !== lead.platformUserId;
    if (relinked && platformUserId) await this.assertLinkable(ownerId, platformUserId, lead.roundId);
    await this.prisma.investorPipelineLead.update({
      where: { id },
      data: {
        ...fields,
        ...(moved && fields.status !== 'prospect' ? { lastContactAt: new Date() } : {}),
        ...(relinked ? { platformUserId, isVerifiedOnPlatform: Boolean(platformUserId) } : {}),
      },
    });
    if (relinked && platformUserId) {
      const shared = await this.prisma.dataRoomDocument.count({ where: { roundId: lead.roundId, sharedWithLeads: true } });
      if (shared > 0) await this.tell(platformUserId, `${await this.nameOf(ownerId)} gave you access to their data room`);
    }
    return this.state(ownerId);
  }

  /** The account has to exist, be someone else, and not stand behind a block in either direction. */
  private async assertLinkable(ownerId: string, userId: string, roundId: string) {
    if (userId === ownerId) throw new BadRequestException('A lead cannot be linked to your own account');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { moderationStatus: true } });
    if (!user || user.moderationStatus !== 'active') throw new NotFoundException('Member not found');
    const blocked = await this.prisma.userBlock.findFirst({
      where: { OR: [{ blockerId: ownerId, blockedId: userId }, { blockerId: userId, blockedId: ownerId }] },
      select: { id: true },
    });
    if (blocked) throw new ForbiddenException('You cannot link this member');
    const taken = await this.prisma.investorPipelineLead.findFirst({ where: { roundId, platformUserId: userId }, select: { id: true } });
    if (taken) throw new BadRequestException('This member is already linked to another investor on this round');
  }

  /** Members a founder can link a lead to, investors first. Only what a member card already shows. */
  async searchInvestors(ownerId: string, q: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: ownerId }, { blockedId: ownerId }] },
      select: { blockerId: true, blockedId: true },
    });
    const hidden = [ownerId, ...blocks.flatMap((b) => [b.blockerId, b.blockedId])];
    const rows = await this.prisma.profile.findMany({
      where: {
        userId: { notIn: hidden },
        displayName: { contains: q, mode: 'insensitive' },
        user: { moderationStatus: 'active' },
      },
      take: 20,
      orderBy: { displayName: 'asc' },
      select: { userId: true, displayName: true, avatarUrl: true, headline: true, user: { select: { role: true } } },
    });
    const investorsFirst = [...rows].sort((a, b) => Number(b.user.role === 'investor') - Number(a.user.role === 'investor'));
    return {
      members: investorsFirst.slice(0, 8).map((r) => ({
        id: r.userId,
        displayName: r.displayName,
        avatarUrl: r.avatarUrl,
        headline: r.headline,
        isInvestor: r.user.role === 'investor',
      })),
    };
  }

  async removeLead(ownerId: string, id: string) {
    await this.ownLead(ownerId, id);
    await this.prisma.investorPipelineLead.delete({ where: { id } });
    return this.state(ownerId);
  }

  async addDocument(
    ownerId: string,
    file: Express.Multer.File | undefined,
    fields: { name?: string; category: DataRoomDocCategory; isRequired: boolean },
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('A non-empty file is required');
    const validated = validateUpload(file, 'attachment');
    const round = await this.ensureRound(ownerId);
    const filename = `dataroom_${Date.now()}_${randomBytes(16).toString('hex')}${validated.extension}`;
    const stored = await this.uploads.storePrivateFile({ buffer: file.buffer, filename, mimeType: validated.mimeType });
    await this.prisma.dataRoomDocument.create({
      data: {
        roundId: round.id,
        uploadedById: ownerId,
        name: fields.name ?? (file.originalname || filename).slice(0, 160),
        category: fields.category,
        isRequired: fields.isRequired,
        status: 'ready',
        fileUrl: stored.key,
        fileName: (file.originalname || filename).slice(0, 200),
        fileMimeType: validated.mimeType,
        fileSizeBytes: file.size ?? file.buffer.length,
      },
    });
    return this.state(ownerId);
  }

  async updateDocument(ownerId: string, id: string, input: UpdateDocument) {
    await this.ownDocument(ownerId, id);
    await this.prisma.dataRoomDocument.update({ where: { id }, data: input });
    return this.state(ownerId);
  }

  /**
   * Share files with the investors linked on their round, or stop. Only a
   * linked account can open them, and each opening is logged; there is no
   * public link. One notice per investor, however many files moved.
   */
  async shareDocuments(ownerId: string, input: ShareDocuments) {
    const ids = [...new Set(input.documentIds)];
    const docs = await this.prisma.dataRoomDocument.findMany({ where: { id: { in: ids }, uploadedById: ownerId } });
    if (docs.length !== ids.length) throw new NotFoundException('Document not found');
    if (input.shared && docs.some((d) => !d.fileUrl)) throw new BadRequestException('Only a document with a file can be shared');
    await this.prisma.dataRoomDocument.updateMany({
      where: { id: { in: ids } },
      data: { sharedWithLeads: input.shared, status: input.shared ? 'shared' : 'ready' },
    });
    const fresh = docs.filter((d) => !d.sharedWithLeads && d.roundId);
    if (input.shared && fresh.length > 0) {
      const leads = await this.prisma.investorPipelineLead.findMany({
        where: { roundId: { in: [...new Set(fresh.map((d) => d.roundId as string))] }, platformUserId: { not: null } },
        select: { platformUserId: true },
      });
      const owner = await this.nameOf(ownerId);
      const title = fresh.length === 1 ? `${owner} shared a document with you` : `${owner} shared ${fresh.length} documents with you`;
      await Promise.all([...new Set(leads.map((l) => l.platformUserId as string))].map((userId) => this.tell(userId, title)));
    }
    return this.state(ownerId);
  }

  /** The rooms opened to this member, each with what its owner shared. No key leaves this service. */
  async sharedWithMe(userId: string) {
    const links = await this.prisma.investorPipelineLead.findMany({
      where: { platformUserId: userId },
      select: { round: { select: { id: true, name: true, roundType: true, ownerId: true } } },
    });
    const rounds = links.map((l) => l.round);
    if (rounds.length === 0) return { rooms: [] };
    const [documents, owners] = await Promise.all([
      this.prisma.dataRoomDocument.findMany({
        where: { roundId: { in: rounds.map((r) => r.id) }, sharedWithLeads: true, fileUrl: { not: null } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.people([...new Set(rounds.map((r) => r.ownerId))]),
    ]);
    return {
      rooms: rounds
        .map((round) => ({
          roundId: round.id,
          roundName: round.name,
          roundType: round.roundType,
          owner: owners.get(round.ownerId) ?? null,
          documents: documents.filter((d) => d.roundId === round.id).map((d) => ({
            id: d.id,
            name: d.name,
            category: d.category,
            fileName: d.fileName,
            fileMimeType: d.fileMimeType,
            fileSizeBytes: d.fileSizeBytes,
            updatedAt: d.updatedAt.toISOString(),
          })),
        }))
        .filter((room) => room.documents.length > 0),
    };
  }

  async removeDocument(ownerId: string, id: string) {
    const doc = await this.ownDocument(ownerId, id);
    await this.prisma.dataRoomDocument.delete({ where: { id } });
    // The row is gone either way: a file that will not delete is logged, not shown.
    if (doc.fileUrl) await this.uploads.deletePrivateFile(doc.fileUrl).catch((err: unknown) => this.logger.warn(`Data room file not deleted: ${String(err)}`));
    return this.state(ownerId);
  }

  /**
   * The file, for its owner, or for an investor on the round the owner shared
   * it with (a lead linked to their account). Openings by anyone else are
   * logged and counted; the owner reading their own file is not an event.
   */
  async openDocument(userId: string, id: string, context: { ipAddress?: string | null; userAgent?: string | null }) {
    const doc = await this.prisma.dataRoomDocument.findUnique({ where: { id } });
    if (!doc?.fileUrl) throw new NotFoundException('Document not found');
    const owner = doc.uploadedById === userId;
    if (!owner) {
      const shared = doc.sharedWithLeads && doc.roundId
        ? await this.prisma.investorPipelineLead.findFirst({ where: { roundId: doc.roundId, platformUserId: userId }, select: { id: true } })
        : null;
      if (!shared) throw new NotFoundException('Document not found');
    }
    const buffer = await this.uploads.readPrivateFile(doc.fileUrl);
    if (!owner) {
      await this.prisma.$transaction([
        this.prisma.dataRoomAccessLog.create({
          data: { documentId: doc.id, accessorId: userId, roundId: doc.roundId, source: 'investor_pipeline', ipAddress: context.ipAddress ?? null, userAgent: context.userAgent?.slice(0, 300) ?? null },
        }),
        this.prisma.dataRoomDocument.update({ where: { id: doc.id }, data: { viewCount: { increment: 1 } } }),
      ]);
    }
    return { buffer, fileName: doc.fileName ?? doc.name, mimeType: doc.fileMimeType ?? 'application/octet-stream' };
  }
}

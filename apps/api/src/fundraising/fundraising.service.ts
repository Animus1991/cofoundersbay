import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { DataRoomDocCategory, DataRoomDocument, FundraisingRound, InvestorLeadStatus, InvestorPipelineLead, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { validateUpload } from '../uploads/upload-validation';
import type { CreateLead, CreateRound, UpdateDocument, UpdateLead, UpdateRound } from './fundraising.schemas';

const COMMITTED: InvestorLeadStatus = 'committed';

function money(value: Prisma.Decimal | null | undefined): number | null {
  return value == null ? null : Number(value);
}

function leadView(lead: InvestorPipelineLead) {
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
    notes: lead.notes,
    isVerifiedOnPlatform: lead.isVerifiedOnPlatform,
  };
}

/** The storage key stays here: a client gets to know that a file exists, not where. */
function documentView(doc: DataRoomDocument) {
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
  ) {}

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
    const [leads, documents] = await Promise.all([
      this.prisma.investorPipelineLead.findMany({ where: { roundId: round.id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dataRoomDocument.findMany({ where: { roundId: round.id }, orderBy: { createdAt: 'desc' } }),
    ]);
    return { round: roundView(round, leads), leads: leads.map(leadView), documents: documents.map(documentView) };
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
    const moved = input.status !== undefined && input.status !== lead.status;
    await this.prisma.investorPipelineLead.update({
      where: { id },
      data: { ...input, ...(moved && input.status !== 'prospect' ? { lastContactAt: new Date() } : {}) },
    });
    return this.state(ownerId);
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

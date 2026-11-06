import 'reflect-metadata';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ZodError } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FundraisingService } from './fundraising.service';
import { createLeadSchema, createRoundSchema, documentFieldsSchema, updateDocumentSchema, updateLeadSchema } from './fundraising.schemas';

/** A founder's round, investors and data room: their own only, and files stay private (docs §111). */

const NOW = new Date('2026-11-06T10:00:00Z');
const round = { id: 'r1', ownerId: 'me', name: 'Seed', roundType: 'seed', status: 'active', currency: 'EUR', targetAmount: 750000, preMoneyValuation: null, leadInvestorName: null, closingDate: null, description: null };
const lead = (over: Record<string, unknown>) => ({
  id: 'l1', roundId: 'r1', investorName: 'Ada', investorFirm: null, investorType: 'Angel', stageFocus: null, checkSizeText: null,
  status: 'prospect', committedAmount: null, currency: 'EUR', lastContactAt: null, notes: null, isVerifiedOnPlatform: false, ...over,
});
const doc = (over: Record<string, unknown> = {}) => ({
  id: 'd1', roundId: 'r1', uploadedById: 'me', name: 'Deck', category: 'pitch', status: 'ready', isRequired: false,
  fileUrl: 'dataroom_1_abc.pdf', fileName: 'deck.pdf', fileMimeType: 'application/pdf', fileSizeBytes: 4, viewCount: 0, sharedWithLeads: false, updatedAt: NOW, ...over,
});
const pdf = { buffer: Buffer.from('%PDF-1.7 x'), originalname: 'deck.pdf', mimetype: 'application/pdf', size: 10 } as Express.Multer.File;

function setup() {
  const prisma: Record<string, any> = {
    fundraisingRound: { findFirst: vi.fn(async ({ where }: any) => (where.ownerId === 'me' && (!where.id || where.id === 'r1') ? round : null)), create: vi.fn(async ({ data }: any) => ({ ...round, ...data })), update: vi.fn(async () => round) },
    investorPipelineLead: { findMany: vi.fn(async () => [] as unknown[]), findFirst: vi.fn(async () => null as unknown), create: vi.fn(async () => ({})), update: vi.fn(async () => ({})), delete: vi.fn(async () => ({})) },
    dataRoomDocument: { count: vi.fn(async () => 0), findMany: vi.fn(async () => [] as unknown[]), findFirst: vi.fn(async () => null as unknown), findUnique: vi.fn(async () => null as unknown), create: vi.fn(async () => ({})), update: vi.fn(async () => ({})), delete: vi.fn(async () => ({})) },
    dataRoomAccessLog: { create: vi.fn(async () => ({})), findMany: vi.fn(async () => [] as unknown[]) },
    profile: { findMany: vi.fn(async () => [] as unknown[]), findUnique: vi.fn(async () => ({ displayName: 'Elena' }) as unknown) },
    user: { findUnique: vi.fn(async () => ({ moderationStatus: 'active' }) as unknown) },
    userBlock: { findFirst: vi.fn(async () => null as unknown), findMany: vi.fn(async () => [] as unknown[]) },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  };
  const uploads = {
    storePrivateFile: vi.fn(async ({ filename }: { filename: string }) => ({ key: filename })),
    readPrivateFile: vi.fn(async () => Buffer.from('bytes')),
    deletePrivateFile: vi.fn(async () => undefined),
  };
  const notifications = { createNotification: vi.fn(async () => ({})) };
  return { service: new FundraisingService(prisma as never, uploads as never, notifications as never), prisma, uploads, notifications };
}

let t: ReturnType<typeof setup>;
beforeEach(() => { t = setup(); });

describe('the round', () => {
  it('adds up what the committed investors put in, and only those', async () => {
    t.prisma.investorPipelineLead.findMany.mockResolvedValue([
      lead({ id: 'a', status: 'committed', committedAmount: 250000 }),
      lead({ id: 'b', status: 'committed', committedAmount: 125000.5 }),
      lead({ id: 'c', status: 'meeting', committedAmount: 999999 }),
    ]);
    const state = await t.service.state('me');
    expect(state.round).toMatchObject({ raisedAmount: 375000.5, investors: 2, targetAmount: 750000 });
    expect(state.leads).toHaveLength(3);
  });

  it('is empty, not invented, for a member with no round', async () => {
    await expect(t.service.state('someone-new')).resolves.toEqual({ round: null, leads: [], documents: [] });
  });

  it('answers 404 for another member’s round, so ids cannot be probed', async () => {
    await expect(t.service.updateRound('me', 'theirs', { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    expect(t.prisma.fundraisingRound.update).not.toHaveBeenCalled();
  });
});

describe('investors', () => {
  it('open a plain round for the first contact, in that round’s currency', async () => {
    t.prisma.fundraisingRound.findFirst.mockResolvedValue(null);
    await t.service.createLead('me', createLeadSchema.parse({ investorName: 'Ada' }));
    expect(t.prisma.fundraisingRound.create).toHaveBeenCalledWith({ data: { ownerId: 'me', name: 'My round', currency: 'EUR' } });
    expect(t.prisma.investorPipelineLead.create.mock.calls[0][0].data).toMatchObject({ investorName: 'Ada', addedById: 'me', status: 'prospect', lastContactAt: null });
  });

  it('are moved and removed by their owner only', async () => {
    await expect(t.service.updateLead('me', 'theirs', { status: 'meeting' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(t.service.removeLead('me', 'theirs')).rejects.toBeInstanceOf(NotFoundException);
    expect(t.prisma.investorPipelineLead.findFirst).toHaveBeenCalledWith({ where: { id: 'theirs', round: { ownerId: 'me' } } });
  });

  it('record the last contact when they move on, not when a note changes', async () => {
    t.prisma.investorPipelineLead.findFirst.mockResolvedValue(lead({ status: 'contacted' }));
    await t.service.updateLead('me', 'l1', { notes: 'Called' });
    expect(t.prisma.investorPipelineLead.update.mock.calls[0][0].data.lastContactAt).toBeUndefined();
    await t.service.updateLead('me', 'l1', { status: 'meeting' });
    expect(t.prisma.investorPipelineLead.update.mock.calls[1][0].data.lastContactAt).toBeInstanceOf(Date);
  });
});

describe('the data room', () => {
  it('stores the file privately and never tells the client where', async () => {
    await t.service.addDocument('me', pdf, { category: 'pitch', isRequired: true });
    expect(t.uploads.storePrivateFile).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'application/pdf' }));
    const data = t.prisma.dataRoomDocument.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ uploadedById: 'me', status: 'ready', name: 'deck.pdf', isRequired: true, fileName: 'deck.pdf' });
    expect(data.fileUrl).toMatch(/^dataroom_\d+_[0-9a-f]{32}\.pdf$/);

    t.prisma.dataRoomDocument.findMany.mockResolvedValue([doc()]);
    const state = await t.service.state('me');
    expect(state.documents[0]).toMatchObject({ hasFile: true, fileName: 'deck.pdf' });
    expect(JSON.stringify(state)).not.toContain('dataroom_1_abc');
  });

  it('refuses an empty file and a type outside the attachment policy', async () => {
    await expect(t.service.addDocument('me', undefined, { category: 'other', isRequired: false })).rejects.toBeInstanceOf(BadRequestException);
    const script = { buffer: Buffer.from('<script>alert(1)</script>'), originalname: 'x.html', mimetype: 'text/html', size: 25 } as Express.Multer.File;
    await expect(t.service.addDocument('me', script, { category: 'other', isRequired: false })).rejects.toBeInstanceOf(BadRequestException);
    expect(t.uploads.storePrivateFile).not.toHaveBeenCalled();
  });

  it('gives the owner their file without logging them', async () => {
    t.prisma.dataRoomDocument.findUnique.mockResolvedValue(doc());
    await expect(t.service.openDocument('me', 'd1', {})).resolves.toMatchObject({ fileName: 'deck.pdf', mimeType: 'application/pdf' });
    expect(t.prisma.dataRoomAccessLog.create).not.toHaveBeenCalled();
  });

  it('answers 404 to anyone else, shared or not, unless they are a linked investor', async () => {
    t.prisma.dataRoomDocument.findUnique.mockResolvedValue(doc());
    await expect(t.service.openDocument('stranger', 'd1', {})).rejects.toBeInstanceOf(NotFoundException);
    t.prisma.dataRoomDocument.findUnique.mockResolvedValue(doc({ sharedWithLeads: true }));
    await expect(t.service.openDocument('stranger', 'd1', {})).rejects.toBeInstanceOf(NotFoundException);
    expect(t.uploads.readPrivateFile).not.toHaveBeenCalled();
  });

  it('logs and counts an opening by a linked investor', async () => {
    t.prisma.dataRoomDocument.findUnique.mockResolvedValue(doc({ sharedWithLeads: true }));
    t.prisma.investorPipelineLead.findFirst.mockResolvedValue({ id: 'l1' });
    await t.service.openDocument('investor', 'd1', { ipAddress: '10.0.0.1', userAgent: 'x'.repeat(400) });
    expect(t.prisma.investorPipelineLead.findFirst).toHaveBeenCalledWith({ where: { roundId: 'r1', platformUserId: 'investor' }, select: { id: true } });
    const log = t.prisma.dataRoomAccessLog.create.mock.calls[0][0].data;
    expect(log).toMatchObject({ documentId: 'd1', accessorId: 'investor', roundId: 'r1', ipAddress: '10.0.0.1' });
    expect(log.userAgent).toHaveLength(300);
    expect(t.prisma.dataRoomDocument.update).toHaveBeenCalledWith({ where: { id: 'd1' }, data: { viewCount: { increment: 1 } } });
  });

  it('removes the file with the row, and a stuck file does not undo the delete', async () => {
    t.prisma.dataRoomDocument.findFirst.mockResolvedValue(doc());
    t.uploads.deletePrivateFile.mockRejectedValueOnce(new Error('disk'));
    await expect(t.service.removeDocument('me', 'd1')).resolves.toBeTruthy();
    expect(t.prisma.dataRoomDocument.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
    expect(t.uploads.deletePrivateFile).toHaveBeenCalledWith('dataroom_1_abc.pdf');
  });

  it('is changed by its owner only', async () => {
    await expect(t.service.updateDocument('me', 'theirs', { status: 'archived' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(t.service.removeDocument('me', 'theirs')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('the next step with an investor', () => {
  it('keeps a date and a step, and returns them', async () => {
    t.prisma.investorPipelineLead.findFirst.mockResolvedValue(lead({}));
    t.prisma.investorPipelineLead.findMany.mockResolvedValue([lead({ nextFollowUpAt: new Date('2026-11-10T00:00:00Z'), nextStep: 'Send the deck' })]);
    const state = await t.service.updateLead('me', 'l1', updateLeadSchema.parse({ nextFollowUpAt: '2026-11-10', nextStep: 'Send the deck' }));
    expect(t.prisma.investorPipelineLead.update.mock.calls[0][0].data).toMatchObject({ nextStep: 'Send the deck' });
    expect(state.leads[0]).toMatchObject({ nextFollowUpAt: '2026-11-10T00:00:00.000Z', nextStep: 'Send the deck' });
  });

  it('leaves them alone when something else changes', () => {
    expect(updateLeadSchema.parse({ status: 'meeting' })).toEqual({ status: 'meeting' });
  });

  it('clears on an empty value, and refuses a date that is not one', () => {
    expect(updateLeadSchema.parse({ nextFollowUpAt: null, nextStep: '' })).toEqual({ nextFollowUpAt: null, nextStep: null });
    expect(() => updateLeadSchema.parse({ nextFollowUpAt: 'soon' })).toThrow(ZodError);
  });
});

describe('sharing the data room', () => {
  const ACCOUNT = '11111111-1111-4111-8111-111111111111';

  it('links a lead to an account, which the state then names', async () => {
    t.prisma.investorPipelineLead.findFirst.mockImplementation(async ({ where }: any) => (where.id === 'l1' ? lead({}) : null));
    t.prisma.investorPipelineLead.findMany.mockResolvedValue([lead({ platformUserId: ACCOUNT })]);
    t.prisma.profile.findMany.mockResolvedValue([{ userId: ACCOUNT, displayName: 'Nikos', avatarUrl: null, headline: null }]);
    const state = await t.service.updateLead('me', 'l1', { platformUserId: ACCOUNT });
    expect(t.prisma.investorPipelineLead.update.mock.calls[0][0].data).toMatchObject({ platformUserId: ACCOUNT, isVerifiedOnPlatform: true });
    expect(state.leads[0].linkedAccount).toMatchObject({ id: ACCOUNT, displayName: 'Nikos' });
  });

  it('will not link your own account, a blocked member, or one already on this round', async () => {
    t.prisma.investorPipelineLead.findFirst.mockImplementation(async ({ where }: any) => (where.id === 'l1' ? lead({}) : null));
    await expect(t.service.updateLead('me', 'l1', { platformUserId: 'me' })).rejects.toBeInstanceOf(BadRequestException);

    t.prisma.userBlock.findFirst.mockResolvedValueOnce({ id: 'b' });
    await expect(t.service.updateLead('me', 'l1', { platformUserId: ACCOUNT })).rejects.toBeInstanceOf(ForbiddenException);

    t.prisma.investorPipelineLead.findFirst.mockImplementation(async ({ where }: any) => (where.id === 'l1' ? lead({}) : { id: 'other' }));
    await expect(t.service.updateLead('me', 'l1', { platformUserId: ACCOUNT })).rejects.toBeInstanceOf(BadRequestException);
    expect(t.prisma.investorPipelineLead.update).not.toHaveBeenCalled();
  });

  it('unlinking takes the verified mark with it', async () => {
    t.prisma.investorPipelineLead.findFirst.mockResolvedValue(lead({ platformUserId: ACCOUNT, isVerifiedOnPlatform: true }));
    await t.service.updateLead('me', 'l1', { platformUserId: null });
    expect(t.prisma.investorPipelineLead.update.mock.calls[0][0].data).toMatchObject({ platformUserId: null, isVerifiedOnPlatform: false });
  });

  it('shares files and tells each linked investor once, however many files moved', async () => {
    t.prisma.dataRoomDocument.findMany.mockResolvedValueOnce([doc({ id: 'd1' }), doc({ id: 'd2' })]);
    t.prisma.dataRoomDocument.updateMany = vi.fn(async () => ({ count: 2 }));
    t.prisma.investorPipelineLead.findMany.mockResolvedValueOnce([{ platformUserId: ACCOUNT }, { platformUserId: ACCOUNT }]);
    await t.service.shareDocuments('me', { documentIds: ['d1', 'd2'], shared: true });
    expect(t.prisma.dataRoomDocument.updateMany.mock.calls[0][0].data).toEqual({ sharedWithLeads: true, status: 'shared' });
    expect(t.notifications.createNotification).toHaveBeenCalledTimes(1);
    expect(t.notifications.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: ACCOUNT, title: 'Elena shared 2 documents with you', link: '/data-room' }));
  });

  it('stopping tells no one, and a re-share of what was shared stays quiet', async () => {
    t.prisma.dataRoomDocument.updateMany = vi.fn(async () => ({ count: 1 }));
    t.prisma.dataRoomDocument.findMany.mockResolvedValueOnce([doc({ sharedWithLeads: true })]);
    await t.service.shareDocuments('me', { documentIds: ['d1'], shared: false });
    expect(t.prisma.dataRoomDocument.updateMany.mock.calls[0][0].data).toEqual({ sharedWithLeads: false, status: 'ready' });
    t.prisma.dataRoomDocument.findMany.mockResolvedValueOnce([doc({ sharedWithLeads: true })]);
    await t.service.shareDocuments('me', { documentIds: ['d1'], shared: true });
    expect(t.notifications.createNotification).not.toHaveBeenCalled();
  });

  it('refuses a document with no file, and one that is not yours', async () => {
    t.prisma.dataRoomDocument.findMany.mockResolvedValueOnce([doc({ fileUrl: null })]);
    await expect(t.service.shareDocuments('me', { documentIds: ['d1'], shared: true })).rejects.toBeInstanceOf(BadRequestException);
    t.prisma.dataRoomDocument.findMany.mockResolvedValueOnce([]);
    await expect(t.service.shareDocuments('me', { documentIds: ['theirs'], shared: true })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists a room for its investor, without a storage key', async () => {
    t.prisma.investorPipelineLead.findMany.mockResolvedValueOnce([{ round: { id: 'r1', name: 'Seed', roundType: 'seed', ownerId: 'me' } }]);
    t.prisma.dataRoomDocument.findMany.mockResolvedValueOnce([doc({ sharedWithLeads: true })]);
    const { rooms } = await t.service.sharedWithMe('investor');
    expect(rooms).toHaveLength(1);
    expect(rooms[0].documents[0]).toMatchObject({ id: 'd1', fileName: 'deck.pdf' });
    expect(JSON.stringify(rooms)).not.toContain('dataroom_1_abc');
  });

  it('shows nothing to a member no one linked', async () => {
    await expect(t.service.sharedWithMe('stranger')).resolves.toEqual({ rooms: [] });
  });
});

describe('what the API accepts', () => {
  it('reads a date, an upper-case currency and an optional amount', () => {
    const parsed = createRoundSchema.parse({ name: ' Seed ', currency: 'eur', closingDate: '2027-03-01', targetAmount: 750000 });
    expect(parsed).toMatchObject({ name: 'Seed', currency: 'EUR', roundType: 'seed', status: 'planning' });
    expect(parsed.closingDate).toEqual(new Date('2027-03-01'));
  });

  it('refuses what the columns could not hold or the lists do not know', () => {
    expect(() => createRoundSchema.parse({ name: '' })).toThrow(ZodError);
    expect(() => createRoundSchema.parse({ name: 'x', targetAmount: -1 })).toThrow(ZodError);
    expect(() => createRoundSchema.parse({ name: 'x', targetAmount: 1e14 })).toThrow(ZodError);
    expect(() => createLeadSchema.parse({ investorName: 'x', status: 'friend' })).toThrow(ZodError);
    expect(() => updateDocumentSchema.parse({ status: 'public' })).toThrow(ZodError);
  });

  it('reads a form field as a form sends it', () => {
    expect(documentFieldsSchema.parse({ category: 'legal', isRequired: 'true' })).toMatchObject({ category: 'legal', isRequired: true });
    expect(documentFieldsSchema.parse({})).toMatchObject({ category: 'other', isRequired: false });
  });
});

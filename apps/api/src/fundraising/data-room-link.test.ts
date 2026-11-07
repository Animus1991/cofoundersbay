import 'reflect-metadata';
import { createHash } from 'node:crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FundraisingService } from './fundraising.service';
import { createRoomLinkSchema, createLeadSchema, updateRoundSchema } from './fundraising.schemas';

const round = { id: 'r1', ownerId: 'me', name: 'Seed' };
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

function setup() {
  const stored: Record<string, any> = {};
  const prisma: Record<string, any> = {
    fundraisingRound: {
      findFirst: vi.fn(async () => round),
      findMany: vi.fn(async () => [round]),
      create: vi.fn(async () => round),
    },
    dataRoomDocument: {
      count: vi.fn(async () => 2),
      findMany: vi.fn(async () => [{ id: 'd1', name: 'Deck', category: 'pitch', fileName: 'deck.pdf', fileSizeBytes: 10 }]),
      findFirst: vi.fn(async () => ({ id: 'd1', name: 'Deck', fileUrl: 'key.pdf', fileName: 'deck.pdf', fileMimeType: 'application/pdf' })),
      update: vi.fn(async () => ({})),
    },
    dataRoomLink: {
      create: vi.fn(async ({ data }: any) => { stored.link = { id: 'k1', revokedAt: null, openCount: 0, lastOpenedAt: null, createdAt: new Date(), ...data, round }; return stored.link; }),
      findUnique: vi.fn(async ({ where }: any) => (stored.link?.tokenHash === where.tokenHash ? stored.link : null)),
      findFirst: vi.fn(async ({ where }: any) => (where.round.ownerId === 'me' && where.id === 'k1' ? stored.link : null)),
      findMany: vi.fn(async () => (stored.link ? [stored.link] : [])),
      update: vi.fn(async ({ data }: any) => { Object.assign(stored.link, data); return stored.link; }),
    },
    profile: { findUnique: vi.fn(async () => ({ displayName: 'Alex Demo' })) },
    user: { findUnique: vi.fn(async () => ({ moderationStatus: 'active' })) },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  };
  const uploads = { readPrivateFile: vi.fn(async () => Buffer.from('%PDF')) };
  return { stored, prisma, uploads, service: new FundraisingService(prisma as never, uploads as never) };
}

describe('a data room link for someone without an account', () => {
  let t: ReturnType<typeof setup>;
  beforeEach(() => { t = setup(); });
  const make = () => t.service.createRoomLink('me', { label: 'For Irini', days: 7 });

  it('answers the token once and keeps only its hash', async () => {
    const { token, link } = await make();
    expect(token.length).toBeGreaterThan(40);
    expect(t.stored.link.tokenHash).toBe(hash(token));
    expect(JSON.stringify(t.stored.link)).not.toContain(token);
    expect(JSON.stringify(link)).not.toContain(t.stored.link.tokenHash);
  });

  it('needs a shared file, so it never opens on nothing', async () => {
    t.prisma.dataRoomDocument.count.mockResolvedValue(0);
    await expect(make()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('opens the shared files, with no ids of people and no storage keys', async () => {
    const { token } = await make();
    const read = await t.service.readRoomLink(token);
    expect(read).toMatchObject({ roundName: 'Seed', founderName: 'Alex Demo' });
    expect(JSON.stringify(read)).not.toMatch(/key\.pdf|ownerId|tokenHash/);
    expect(t.prisma.dataRoomDocument.findMany.mock.calls[0][0].where).toMatchObject({ roundId: 'r1', sharedWithLeads: true });
  });

  it('counts an opening on the link and on the file', async () => {
    const { token } = await make();
    const file = await t.service.openRoomLinkFile(token, 'd1');
    expect(file.fileName).toBe('deck.pdf');
    expect(t.stored.link.openCount).toEqual({ increment: 1 });
    expect(t.prisma.dataRoomDocument.update).toHaveBeenCalledWith({ where: { id: 'd1' }, data: { viewCount: { increment: 1 } } });
  });

  it('never reaches a file outside the round, or one no longer shared', async () => {
    const { token } = await make();
    t.prisma.dataRoomDocument.findFirst.mockResolvedValue(null);
    await expect(t.service.openRoomLinkFile(token, 'other')).rejects.toBeInstanceOf(NotFoundException);
    expect(t.prisma.dataRoomDocument.findFirst.mock.calls[0][0].where).toMatchObject({ id: 'other', roundId: 'r1', sharedWithLeads: true });
    expect(t.uploads.readPrivateFile).not.toHaveBeenCalled();
  });

  it('answers the same for a wrong, an ended and a revoked link', async () => {
    const { token } = await make();
    await expect(t.service.readRoomLink('wrong')).rejects.toBeInstanceOf(NotFoundException);
    t.stored.link.expiresAt = inDays(-1);
    await expect(t.service.readRoomLink(token)).rejects.toBeInstanceOf(NotFoundException);
    t.stored.link.expiresAt = inDays(1);
    await t.service.revokeRoomLink('me', 'k1');
    await expect(t.service.readRoomLink(token)).rejects.toBeInstanceOf(NotFoundException);
    await expect(t.service.openRoomLinkFile(token, 'd1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stops when the owner is suspended', async () => {
    const { token } = await make();
    t.prisma.user.findUnique.mockResolvedValue({ moderationStatus: 'suspended' });
    await expect(t.service.readRoomLink(token)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets only the owner revoke, and keeps the record', async () => {
    await make();
    await expect(t.service.revokeRoomLink('someone-else', 'k1')).rejects.toBeInstanceOf(NotFoundException);
    const links = await t.service.revokeRoomLink('me', 'k1');
    expect(links[0].revokedAt).not.toBeNull();
  });

  it('lasts thirty days at most', () => {
    expect(createRoomLinkSchema.parse({}).days).toBe(7);
    expect(createRoomLinkSchema.safeParse({ days: 31 }).success).toBe(false);
    expect(createRoomLinkSchema.safeParse({ days: 0 }).success).toBe(false);
  });
});

describe('what the round keeps', () => {
  it('takes a cap table of real holders only', () => {
    const holder = { id: 'a', name: 'Alex', kind: 'founder', shares: 100 };
    expect(updateRoundSchema.parse({ capTable: [holder] }).capTable).toEqual([holder]);
    expect(updateRoundSchema.safeParse({ capTable: [{ ...holder, shares: -1 }] }).success).toBe(false);
    expect(updateRoundSchema.safeParse({ capTable: [{ ...holder, kind: 'wizard' }] }).success).toBe(false);
  });

  it('takes an investor email, and an empty one as none', () => {
    expect(createLeadSchema.parse({ investorName: 'Ada', investorEmail: 'ada@fund.example' }).investorEmail).toBe('ada@fund.example');
    expect(createLeadSchema.parse({ investorName: 'Ada', investorEmail: '' }).investorEmail).toBeNull();
    expect(createLeadSchema.safeParse({ investorName: 'Ada', investorEmail: 'not an email' }).success).toBe(false);
  });
});

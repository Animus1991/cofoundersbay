import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MessagingService } from './messaging.service';

/**
 * Changing what was said (docs §114): only the sender, only for a while, and
 * never in a validated conversation, whose transcript carries a hash of the words.
 */
const MINUTE = 60_000;

function setup(opts: { sender?: string; ageMinutes?: number; validated?: boolean; found?: boolean; participant?: boolean } = {}) {
  const found = opts.found ?? true;
  const message = {
    id: 'm1',
    senderId: opts.sender ?? 'me',
    createdAt: new Date(Date.now() - (opts.ageMinutes ?? 1) * MINUTE),
    body: 'Forward me',
    attachments: [{ uploadId: 'u1', url: '/uploads/a.pdf', mimeType: 'application/pdf', fileName: 'a.pdf', sizeBytes: 9 }],
  };
  const prisma = {
    conversationParticipant: { findUnique: vi.fn().mockResolvedValue(opts.participant === false ? null : { conversationId: 'c1' }) },
    conversationValidation: { findUnique: vi.fn().mockResolvedValue(opts.validated ? { transcriptAvailable: true } : null) },
    message: {
      findFirst: vi.fn().mockResolvedValue(found ? message : null),
      update: vi.fn().mockImplementation(({ data }: { data: { body?: string; editedAt?: Date } }) => Promise.resolve({
        id: 'm1',
        conversationId: 'c1',
        senderId: 'me',
        body: data.body ?? 'x',
        createdAt: message.createdAt,
        editedAt: data.editedAt ?? null,
        forwarded: false,
        sender: { id: 'me', email: 'me@x.test', role: 'founder', profile: null },
        attachments: [],
      })),
    },
  };
  const service = new MessagingService(prisma as never, {} as never, {} as never);
  return { service, prisma };
}

describe('editing a message', () => {
  it('saves the new words and says when', async () => {
    const { service, prisma } = setup();
    const dto = await service.editMessage('me', 'c1', 'm1', '  Corrected  ');
    expect(dto.body).toBe('Corrected');
    expect(dto.editedAt).not.toBeNull();
    expect(prisma.message.update).toHaveBeenCalledOnce();
  });

  it('is for the sender alone', async () => {
    const { service, prisma } = setup({ sender: 'them' });
    await expect(service.editMessage('me', 'c1', 'm1', 'x')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.message.update).not.toHaveBeenCalled();
  });

  it('closes after fifteen minutes', async () => {
    const { service, prisma } = setup({ ageMinutes: 16 });
    await expect(service.editMessage('me', 'c1', 'm1', 'x')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.message.update).not.toHaveBeenCalled();
  });

  it('leaves a validated conversation as written', async () => {
    const { service, prisma } = setup({ validated: true });
    await expect(service.editMessage('me', 'c1', 'm1', 'x')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.message.update).not.toHaveBeenCalled();
  });

  it('refuses an empty message', async () => {
    const { service } = setup();
    await expect(service.editMessage('me', 'c1', 'm1', '   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses someone outside the conversation', async () => {
    const { service } = setup({ participant: false });
    await expect(service.editMessage('me', 'c1', 'm1', 'x')).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('deleting a message', () => {
  it('keeps the row, marked deleted', async () => {
    const { service, prisma } = setup();
    await expect(service.deleteMessage('me', 'c1', 'm1')).resolves.toEqual({ id: 'm1', conversationId: 'c1' });
    expect(prisma.message.update.mock.calls[0]?.[0]).toMatchObject({ data: { deletedAt: expect.any(Date) } });
  });

  it('has no time limit, but keeps the other rules', async () => {
    const old = setup({ ageMinutes: 600 });
    await expect(old.service.deleteMessage('me', 'c1', 'm1')).resolves.toBeTruthy();
    const theirs = setup({ sender: 'them' });
    await expect(theirs.service.deleteMessage('me', 'c1', 'm1')).rejects.toBeInstanceOf(ForbiddenException);
    const validated = setup({ validated: true });
    await expect(validated.service.deleteMessage('me', 'c1', 'm1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('forwarding a message', () => {
  it('sends a marked copy with its attachments, through the normal checks', async () => {
    const { service } = setup();
    const send = vi.spyOn(service, 'sendMessage').mockResolvedValue({ id: 'm2' } as never);
    await service.forwardMessage('me', 'm1', 'c2');
    expect(send).toHaveBeenCalledWith('me', 'c2', 'Forward me', undefined, { attachments: [expect.objectContaining({ url: '/uploads/a.pdf' })] });
  });

  it('needs a message the member can read', async () => {
    const { service } = setup({ found: false });
    await expect(service.forwardMessage('me', 'm1', 'c2')).rejects.toBeInstanceOf(NotFoundException);
  });
});

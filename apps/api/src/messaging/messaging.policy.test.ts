import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { messagePolicy } from '@cofounderbay/shared';
import { MessagingService } from './messaging.service';

/**
 * "Who can start a conversation with you" (Settings > Privacy): asked only
 * when a new direct conversation is made; an existing thread carries on.
 */

function setup(opts: { rules?: unknown; connected?: boolean; existing?: boolean }) {
  const created = { id: 'new-conv' };
  const prisma = {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'them' }) },
    connectionRequest: {
      // The first call is the block check, the second the connection check.
      findFirst: vi.fn().mockImplementation(({ where }: { where: { status: string } }) =>
        Promise.resolve(where.status === 'accepted' && opts.connected ? { id: 'cr1' } : null)),
    },
    conversation: {
      findFirst: vi.fn().mockResolvedValue(opts.existing ? { id: 'old-conv' } : null),
      create: vi.fn().mockResolvedValue(created),
    },
    profile: { findUnique: vi.fn().mockResolvedValue({ visibilityRules: opts.rules ?? null }) },
  };
  const service = new MessagingService(prisma as never, {} as never, {} as never);
  return { service, prisma };
}

describe('who can start a conversation', () => {
  it('reads the setting, with everyone as the default', () => {
    expect(messagePolicy(null)).toBe('anyone');
    expect(messagePolicy({ messages: 'connections' })).toBe('connections');
    expect(messagePolicy({ messages: 'nobody' })).toBe('nobody');
    expect(messagePolicy({ messages: 'odd' })).toBe('anyone');
  });

  it('lets anyone start one by default', async () => {
    const { service, prisma } = setup({});
    await expect(service.getOrCreateDirectConversation('me', 'them')).resolves.toEqual({ id: 'new-conv' });
    expect(prisma.conversation.create).toHaveBeenCalled();
  });

  it('refuses a new one when the member takes none', async () => {
    const { service, prisma } = setup({ rules: { messages: 'nobody' } });
    await expect(service.getOrCreateDirectConversation('me', 'them')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('asks for a connection when the member takes connections only', async () => {
    await expect(setup({ rules: { messages: 'connections' } }).service.getOrCreateDirectConversation('me', 'them'))
      .rejects.toThrow(/connections only/);
    await expect(setup({ rules: { messages: 'connections' }, connected: true }).service.getOrCreateDirectConversation('me', 'them'))
      .resolves.toEqual({ id: 'new-conv' });
  });

  it('never cuts off a conversation that already exists', async () => {
    const { service, prisma } = setup({ rules: { messages: 'nobody' }, existing: true });
    await expect(service.getOrCreateDirectConversation('me', 'them')).resolves.toEqual({ id: 'old-conv' });
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
  });
});

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MESSAGE_SEARCH_WINDOW, messageSnippet } from '@cofounderbay/shared';
import { MessagingService } from './messaging.service';

/**
 * Message search reads only the member's own conversations, never a deleted
 * message, and matches by the shared rule the thread's search box uses, so
 * «ορους» finds «όρους» on the server too.
 */

const person = (id: string, name: string) => ({ userId: id, user: { email: `${id}@x.test`, profile: { displayName: name } } });
const row = (id: string, body: string, senderId: string, day: number) => ({
  id,
  conversationId: 'c1',
  body,
  createdAt: new Date(Date.UTC(2026, 9, day)),
  senderId,
  sender: { email: `${senderId}@x.test`, profile: { displayName: senderId === 'me' ? 'Alex' : 'Elena' } },
  conversation: { participants: [person('me', 'Alex'), person('elena', 'Elena Papadopoulos')] },
});

function setup(rows: ReturnType<typeof row>[]) {
  const findMany = vi.fn().mockResolvedValue(rows);
  const prisma = { message: { findMany } };
  const service = new MessagingService(prisma as never, {} as never, {} as never);
  return { service, findMany };
}

describe('message search', () => {
  it('reads only conversations the member is in, skips deleted messages, newest first', async () => {
    const { service, findMany } = setup([]);
    await service.searchMessages('me', 'terms');
    const query = findMany.mock.calls[0][0];
    expect(query.where).toEqual({ deletedAt: null, conversation: { participants: { some: { userId: 'me' } } } });
    expect(query.orderBy).toEqual({ createdAt: 'desc' });
    expect(query.take).toBe(MESSAGE_SEARCH_WINDOW);
  });

  it('finds words with accents and case ignored, and names the other person', async () => {
    const { service } = setup([
      row('m3', 'Οι ΟΡΟΥΣ θέλουν μία αλλαγή στο vesting.', 'elena', 3),
      row('m2', 'Τέλεια, ευχαριστώ.', 'me', 2),
      row('m1', 'Θα σου στείλω τους όρους αύριο.', 'me', 1),
    ]);
    const hits = await service.searchMessages('me', 'ορους');
    expect(hits.map((h) => h.messageId)).toEqual(['m3', 'm1']);
    expect(hits[0]).toMatchObject({ fromMe: false, senderName: 'Elena', withName: 'Elena Papadopoulos', withUserId: 'elena', conversationId: 'c1' });
    expect(hits[1].fromMe).toBe(true);
  });

  it('keeps to the limit and refuses a search of one character', async () => {
    const many = Array.from({ length: 40 }, (_, i) => row(`m${i}`, `vesting note ${i}`, 'elena', 1));
    const { service } = setup(many);
    expect(await service.searchMessages('me', 'vesting', 5)).toHaveLength(5);
    expect(await service.searchMessages('me', 'vesting', 999)).toHaveLength(25);
    await expect(service.searchMessages('me', 'v')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cuts a long message to a line around the hit', () => {
    const body = `${'Intro words before the point. '.repeat(6)}The term sheet arrives Monday. ${'More words after it. '.repeat(6)}`;
    const snippet = messageSnippet(body, 'term sheet');
    expect(snippet).toContain('term sheet');
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet.length).toBeLessThan(body.length);
    expect(messageSnippet('Short one about terms', 'terms')).toBe('Short one about terms');
  });
});

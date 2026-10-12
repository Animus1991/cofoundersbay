import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { COMPAT_MIN_SHARED, compareCompatAnswers, readCompatAnswers } from '@cofounderbay/shared';
import { CompatibilityService } from './compatibility.service';

function setup(rows: Record<string, { workStyle?: unknown; showInMatching?: boolean }> = {}) {
  const store = new Map(Object.entries(rows));
  const prisma = {
    userPreference: {
      findUnique: vi.fn(async ({ where }: any) => store.get(where.userId) ?? null),
      upsert: vi.fn(async ({ where, create, update }: any) => {
        const prev = store.get(where.userId);
        const next = prev ? { ...prev, ...update } : { ...create };
        store.set(where.userId, next);
        return next;
      }),
    },
  };
  return { prisma, store, service: new CompatibilityService(prisma as any) };
}

describe('compatibility answers', () => {
  it('saves one answer at a time, keeps the rest, and clears with an empty value', async () => {
    const { service, prisma } = setup({ me: { workStyle: { compat: { hours: '40_plus' }, other: 'kept' } } });
    const saved = await service.save('me', { answers: { risk: 'high', place: 'same_city' } });
    expect(saved.answers).toEqual({ hours: '40_plus', risk: 'high', place: 'same_city' });
    const write = prisma.userPreference.upsert.mock.calls[0][0];
    // Other keys in the work-style column survive; the unused risk and remote fields follow.
    expect(write.update.workStyle).toEqual({ other: 'kept', compat: { hours: '40_plus', risk: 'high', place: 'same_city' } });
    expect(write.update).toMatchObject({ riskTolerance: 'high', remotePreference: 'onsite' });

    const cleared = await service.save('me', { hours: '' });
    expect(cleared.answers).toEqual({ risk: 'high', place: 'same_city' });
    expect(cleared.answered).toBe(2);
  });

  it('refuses an unknown question or option with the field and a Greek message', async () => {
    const { service } = setup();
    for (const body of [{ astrology: 'leo' }, { hours: 'all_of_them' }]) {
      const err = await service.save('me', body).catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      const details = (err.getResponse() as any).error.details;
      expect(details.reason).toBe('compat_invalid');
      expect(details.messageEl).toBeTruthy();
    }
  });

  it('sends the other member only the comparison, never their answers', async () => {
    const theirs = { hours: '40_plus', start: 'later', runway: '12_plus', risk: 'low' };
    const { service } = setup({
      me: { workStyle: { compat: { hours: '40_plus', start: 'now', runway: '6_12', risk: 'high' } } },
      them: { workStyle: { compat: theirs } },
    });
    const result = await service.withUser('me', 'them');
    expect(result.available).toBe(true);
    const text = JSON.stringify(result);
    for (const value of Object.values(theirs)) expect(text).not.toContain(`"${value}"`);
    if (!result.available) throw new Error('unreachable');
    expect(result.shared).toBe(4);
    expect(result.items[0].verdict).toBe('talk');
  });

  it('does not compare with a member who left matching, and never with oneself', async () => {
    const { service } = setup({ them: { workStyle: { compat: { hours: '10_20' } }, showInMatching: false } });
    expect(await service.withUser('me', 'them')).toEqual({ available: false, answeredByYou: 0 });
    await expect(service.withUser('me', 'me')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('the comparison rules', () => {
  it('ordinal neighbours are close, further apart is a talk', () => {
    const c = compareCompatAnswers({ hours: '10_20', start: 'now', runway: 'under_3' }, { hours: '20_40', start: '3_6_months', runway: 'under_3' });
    const by = Object.fromEntries(c.items.map((i) => [i.id, i.verdict]));
    expect(by).toEqual({ hours: 'close', start: 'talk', runway: 'agree' });
    expect(c.share).toBeCloseTo((1 + 0.5) / 3);
  });

  it('an idea and a joiner fit; two ideas, or two joiners, talk first; "either" is close', () => {
    const v = (a: string, b: string) => compareCompatAnswers({ idea: a }, { idea: b }).items[0].verdict;
    expect(v('have_idea', 'want_to_join')).toBe('agree');
    expect(v('have_idea', 'have_idea')).toBe('talk');
    expect(v('want_to_join', 'want_to_join')).toBe('talk');
    expect(v('open', 'have_idea')).toBe('close');
    expect(v('open', 'open')).toBe('agree');
  });

  it('shows no figure below the minimum, and puts the talks first', () => {
    const few = compareCompatAnswers({ hours: '10_20', risk: 'low' }, { hours: '10_20', risk: 'high' });
    expect(few.shared).toBeLessThan(COMPAT_MIN_SHARED);
    expect(few.share).toBeNull();
    expect(few.items.map((i) => i.verdict)).toEqual(['talk', 'agree']);
    expect(few.items[0].talk?.el).toBeTruthy();
    expect(few.items[1].talk).toBeUndefined();
  });

  it('drops stored answers the questions no longer have', () => {
    expect(compareCompatAnswers({ hours: '10_20', gone: 'x' }, { hours: 'nonsense' }).shared).toBe(0);
    expect(readCompatAnswers([]).ok).toBe(false);
  });
});

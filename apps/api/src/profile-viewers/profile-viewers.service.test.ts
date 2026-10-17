import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PRIVATE_GROUP_MIN, readViewSource, summariseViewers, type ViewerPerson } from '@cofounderbay/shared';
import { ProfileViewersService } from './profile-viewers.service';

const NOW = new Date('2026-10-12T10:00:00Z').getTime();
const DAY = 86_400_000;

function person(id: string, over: Partial<ViewerPerson> = {}): ViewerPerson {
  return { id, displayName: `Person ${id}`, headline: null, avatarUrl: null, role: 'founder', shareName: false, ...over };
}

describe('profile viewer rules', () => {
  const people = new Map<string, ViewerPerson>([
    ['a', person('a', { shareName: true })],
    ['b', person('b', { shareName: false, role: 'investor' })],
    ['c', person('c', { role: 'investor' })],
    ['d', person('d', { role: 'investor' })],
    ['e', person('e', { role: 'mentor' })],
  ]);
  const rows = [
    { viewerId: 'a', viewedAt: new Date(NOW - DAY) },
    { viewerId: 'a', viewedAt: new Date(NOW - 2 * DAY) },
    { viewerId: 'b', viewedAt: new Date(NOW - DAY) },
    { viewerId: 'c', viewedAt: new Date(NOW - DAY) },
    { viewerId: 'd', viewedAt: new Date(NOW - DAY) },
    { viewerId: 'e', viewedAt: new Date(NOW - DAY) },
    { viewerId: null, viewedAt: new Date(NOW - DAY) },
    { viewerId: 'a', viewedAt: new Date(NOW - 120 * DAY) },
    { viewerId: 'owner', viewedAt: new Date(NOW - DAY) },
  ];

  it('names only viewers who share their name, and only to a reader who shares theirs', () => {
    const open = summariseViewers(rows, people, { readerSharesName: true, now: NOW, readerId: 'owner' });
    expect(open.named.map((n) => [n.id, n.views])).toEqual([['a', 2]]);
    const closed = summariseViewers(rows, people, { readerSharesName: false, now: NOW, readerId: 'owner' });
    expect(closed.named).toEqual([]);
    expect(closed.privateCount).toBe(5);
  });

  it('counts members once, keeps signed-out views apart, and ignores old views and the owner', () => {
    const s = summariseViewers(rows, people, { readerSharesName: true, now: NOW, readerId: 'owner' });
    expect(s).toMatchObject({ totalViews: 7, members: 5, signedOutViews: 1, privateCount: 4 });
  });

  it(`groups private viewers by role only from ${PRIVATE_GROUP_MIN} up, so nobody is singled out`, () => {
    const s = summariseViewers(rows, people, { readerSharesName: true, now: NOW, readerId: 'owner' });
    expect(s.privateByRole).toEqual([{ role: 'investor', count: 3 }]);
    expect(JSON.stringify(s)).not.toContain('Person b');
    expect(JSON.stringify(s)).not.toContain('mentor');
  });

  it('reads a known source and falls back to direct', () => {
    expect(readViewSource('search')).toBe('search');
    expect(readViewSource('spam')).toBe('direct');
  });
});

function setup() {
  const settings = new Map<string, boolean>([['a', true]]);
  const views: Array<{ profileId: string; viewerId: string | null; createdAt: Date }> = [
    { profileId: 'prof-owner', viewerId: 'a', createdAt: new Date(NOW - DAY) },
    { profileId: 'prof-owner', viewerId: 'b', createdAt: new Date(NOW - DAY) },
  ];
  const prisma = {
    profile: { findUnique: vi.fn(async ({ where }: any) => (where.userId === 'owner' ? { id: 'prof-owner' } : null)) },
    profileView: { findMany: vi.fn(async ({ where }: any) => views.filter((v) => v.profileId === where.profileId)) },
    user: {
      findMany: vi.fn(async ({ where }: any) =>
        where.id.in.map((id: string) => ({ id, role: 'founder', profile: { displayName: `Person ${id}`, headline: null, avatarUrl: null } })),
      ),
    },
    profileViewerSetting: {
      findUnique: vi.fn(async ({ where }: any) => (settings.has(where.userId) ? { shareName: settings.get(where.userId) } : null)),
      findMany: vi.fn(async ({ where }: any) => where.userId.in.filter((id: string) => settings.has(id)).map((id: string) => ({ userId: id, shareName: settings.get(id) }))),
      upsert: vi.fn(async ({ where, create }: any) => {
        settings.set(where.userId, create.shareName);
        return { shareName: create.shareName };
      }),
    },
  };
  const tracker = { trackView: vi.fn(async () => undefined) };
  return { service: new ProfileViewersService(prisma as never, tracker as never), tracker, settings };
}

describe('profile viewers service', () => {
  it('records a view through the analytics tracker, never a self-view', async () => {
    const { service, tracker } = setup();
    expect(await service.record('owner', 'a', { source: 'search' })).toEqual({ recorded: true });
    expect(tracker.trackView).toHaveBeenCalledWith('prof-owner', 'a', 'search');
    expect(await service.record('owner', 'owner', {})).toEqual({ recorded: false });
    expect(await service.record('owner', null, {})).toEqual({ recorded: true });
    await expect(service.record('ghost', 'a', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps the setting off by default and names nobody until the owner turns it on', async () => {
    const { service } = setup();
    expect(await service.getSetting('owner')).toEqual({ shareName: false });
    expect((await service.summary('owner', NOW)).named).toEqual([]);
    await service.setSetting('owner', { shareName: true });
    expect((await service.summary('owner', NOW)).named.map((n) => n.id)).toEqual(['a']);
    await expect(service.setSetting('owner', { shareName: 'yes' })).rejects.toBeInstanceOf(BadRequestException);
  });
});

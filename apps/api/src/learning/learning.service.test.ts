import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { LearningService } from './learning.service';

/**
 * The library is open to every signed-in member to add to, and every member's
 * "Start" button follows what they typed. The service therefore refuses a link
 * that is not an ordinary web address when it is written.
 */

function setup(existing: { createdById: string } | null = { createdById: 'owner' }) {
  const prisma = {
    learningResource: {
      create: vi.fn(async ({ data }: any) => ({ id: 'new', ...data })),
      update: vi.fn(async ({ data }: any) => ({ id: 'r1', ...data })),
      findUnique: vi.fn(async () => existing),
    },
  };
  return { service: new LearningService(prisma as never), prisma };
}

const good = { title: 'Pricing 101', url: 'https://library.example/pricing' };

describe('creating a resource', () => {
  it('keeps a resource whose link is an ordinary web address', async () => {
    const { service, prisma } = setup();
    await service.create('owner', { ...good, imageUrl: 'https://library.example/cover.png' });
    expect(prisma.learningResource.create).toHaveBeenCalledTimes(1);
    expect(prisma.learningResource.create.mock.calls[0][0].data).toMatchObject({ url: good.url, createdById: 'owner' });
  });

  it.each(["javascript:fetch('/api/me')", 'data:text/html,hi', 'vbscript:x', '#', '', 'library.example/x'])(
    'refuses the link %j without writing anything',
    async (url) => {
      const { service, prisma } = setup();
      await expect(service.create('owner', { title: 'x', url })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.learningResource.create).not.toHaveBeenCalled();
    },
  );

  it('answers a missing link with a 400, not a database error', async () => {
    const { service, prisma } = setup();
    await expect(service.create('owner', { title: 'x' } as never)).rejects.toThrow('url must be an http or https address');
    expect(prisma.learningResource.create).not.toHaveBeenCalled();
  });

  it('refuses a picture that is not a web address, but lets it be left out', async () => {
    const { service, prisma } = setup();
    await expect(service.create('owner', { ...good, imageUrl: 'javascript:alert(1)' })).rejects.toThrow('imageUrl must be an http or https address');
    expect(prisma.learningResource.create).not.toHaveBeenCalled();
    await service.create('owner', good);
    await service.create('owner', { ...good, imageUrl: '' });
    expect(prisma.learningResource.create).toHaveBeenCalledTimes(2);
  });
});

describe('editing a resource', () => {
  it('refuses a script link, after the checks on who may edit it', async () => {
    const { service, prisma } = setup();
    await expect(service.update('r1', 'owner', { url: 'javascript:alert(1)' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.learningResource.update).not.toHaveBeenCalled();
    // Someone else is told they may not edit it, whatever they sent.
    await expect(service.update('r1', 'stranger', { url: 'javascript:alert(1)' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('says a resource that is not there is not there', async () => {
    const { service } = setup(null);
    await expect(service.update('r1', 'owner', { url: 'https://library.example/x' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets a change that leaves the links alone through, and an empty link is ignored as before', async () => {
    const { service, prisma } = setup();
    await service.update('r1', 'owner', { title: 'Renamed' });
    await service.update('r1', 'owner', { title: 'Renamed again', url: '' });
    await service.update('r1', 'owner', { url: 'https://library.example/moved', imageUrl: '' });
    expect(prisma.learningResource.update).toHaveBeenCalledTimes(3);
    expect(prisma.learningResource.update.mock.calls[1][0].data).not.toHaveProperty('url');
    expect(prisma.learningResource.update.mock.calls[2][0].data).toMatchObject({ url: 'https://library.example/moved', imageUrl: '' });
  });

  it('lets an administrator edit, with the same refusal for a script link', async () => {
    const { service } = setup();
    await expect(service.update('r1', 'admin', { url: 'data:text/html,hi' }, true)).rejects.toBeInstanceOf(BadRequestException);
  });
});

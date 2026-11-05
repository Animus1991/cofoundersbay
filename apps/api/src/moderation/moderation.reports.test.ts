import 'reflect-metadata';
import { ZodError } from 'zod';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { AdminController } from '../admin/admin.controller';
import { ModerationAdminController } from './moderation.controller';
import { ModerationService } from './moderation.service';

/** The moderation queue has one `GET admin/reports` with every filter (docs §111). */

function row(id: string) {
  const when = new Date('2026-11-01T10:00:00Z');
  return {
    id,
    type: 'spam',
    status: 'pending',
    reason: 'Sends the same link to everyone',
    context: null,
    createdAt: when,
    updatedAt: when,
    resolvedAt: null,
    reporter: { id: 'u1', email: 'a@example.com', role: 'founder', profile: { displayName: 'Ada' } },
    reported: { id: 'u2', email: 'b@example.com', role: 'founder', moderationStatus: 'active', profile: null },
  };
}

function setup(total = 7) {
  const report = {
    findMany: vi.fn().mockResolvedValue([row('r1'), row('r2')]),
    count: vi.fn().mockResolvedValue(total),
  };
  const service = new ModerationService({ report } as never, {} as never);
  return { service, report, controller: new ModerationAdminController(service) };
}

function getRoutes(controller: { prototype: object }): string[] {
  const proto = controller.prototype as Record<string, unknown>;
  return Object.getOwnPropertyNames(proto)
    .filter((name) => name !== 'constructor')
    .filter((name) => Reflect.getMetadata(METHOD_METADATA, proto[name] as object) === RequestMethod.GET)
    .map((name) => Reflect.getMetadata(PATH_METADATA, proto[name] as object) as string);
}

describe('admin reports listing', () => {
  it('filters by status and type, pages with limit and offset, and counts the whole match', async () => {
    const { controller, report } = setup();
    const result = await controller.listReports({ status: 'pending', type: 'spam', limit: '20', offset: '40' });
    const where = { AND: [{ status: 'pending' }, { type: 'spam' }] };
    expect(report.findMany).toHaveBeenCalledWith(expect.objectContaining({ where, take: 20, skip: 40 }));
    expect(report.count).toHaveBeenCalledWith({ where });
    expect(result.total).toBe(7);
    expect(result.reports.map((r) => r.id)).toEqual(['r1', 'r2']);
    // The shape the web's AdminReportItem reads: a name, falling back to the email.
    expect(result.reports[0].reported.name).toBe('b@example.com');
    expect(result.reports[0].createdAt).toBe('2026-11-01T10:00:00.000Z');
  });

  it('keeps the earlier defaults: newest first, 100 at most by default, clamped to 300', async () => {
    const { controller, report } = setup();
    await controller.listReports({});
    expect(report.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: undefined, take: 100, skip: 0, orderBy: { createdAt: 'desc' } }));
    await controller.listReports({ limit: '5000', offset: '-3' });
    expect(report.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ take: 300, skip: 0 }));
  });

  it('refuses an unknown status or type instead of passing it to the database', async () => {
    const { controller, report } = setup();
    await expect(controller.listReports({ status: 'archived' })).rejects.toBeInstanceOf(ZodError);
    await expect(controller.listReports({ type: 'rude' })).rejects.toBeInstanceOf(ZodError);
    expect(report.findMany).not.toHaveBeenCalled();
  });

  it('is answered by the moderation controller alone', () => {
    expect(getRoutes(ModerationAdminController)).toContain('reports');
    expect(getRoutes(AdminController)).not.toContain('reports');
  });
});

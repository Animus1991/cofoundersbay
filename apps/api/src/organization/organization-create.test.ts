import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ORG_PLATFORM_FIELDS, RESERVED_ORG_SLUGS, readNewOrganization, slugFromName } from '@cofounderbay/shared';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';

function makeService(existing: unknown = null) {
  const prisma = {
    organization: {
      findUnique: vi.fn().mockResolvedValue(existing),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'org-1', ...data })),
    },
    organizationMembership: { create: vi.fn().mockResolvedValue({}) },
  };
  return { service: new OrganizationService(prisma as never), prisma };
}

describe('readNewOrganization', () => {
  it('keeps the member-owned fields and drops every platform field', () => {
    const body: Record<string, unknown> = { type: 'incubator', name: 'Aegean Venture Lab', city: 'Athens' };
    for (const f of ORG_PLATFORM_FIELDS) body[f] = 'x';
    const read = readNewOrganization(body);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value).toEqual({ type: 'incubator', name: 'Aegean Venture Lab', slug: 'aegean-venture-lab', city: 'Athens' });
    for (const f of ORG_PLATFORM_FIELDS) expect(read.ignored).toContain(f);
  });

  it('refuses an unknown type, a short name, a reserved or malformed slug and a bare domain', () => {
    expect(readNewOrganization({ type: 'club', name: 'Lab' })).toMatchObject({ ok: false, field: 'type' });
    expect(readNewOrganization({ type: 'incubator', name: 'L' })).toMatchObject({ ok: false, field: 'name' });
    for (const slug of RESERVED_ORG_SLUGS) expect(readNewOrganization({ type: 'incubator', name: 'Lab one', slug })).toMatchObject({ ok: false, field: 'slug' });
    expect(readNewOrganization({ type: 'incubator', name: 'Lab one', slug: 'Lab One' })).toMatchObject({ ok: false, field: 'slug' });
    expect(readNewOrganization({ type: 'incubator', name: 'Lab one', website: 'lab.example' })).toMatchObject({ ok: false, field: 'website' });
    expect(readNewOrganization(null)).toMatchObject({ ok: false, field: 'type' });
  });

  it('says every refusal in Greek too', () => {
    const read = readNewOrganization({ type: 'nope', name: 'x' });
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.reason.el).toMatch(/[Α-ω]/);
  });

  it('suggests a Latin slug from a Greek name', () => {
    expect(slugFromName('Θερμοκοιτίδα Πάτρας')).toBe('thermokoitida-patras');
  });
});

describe('POST /organizations', () => {
  it('creates the organisation from the read value only, with the creator as owner', async () => {
    const { service, prisma } = makeService();
    const controller = new OrganizationController(service, {} as never, {} as never);
    await controller.create({ user: { id: 'u1' } }, { type: 'accelerator', name: 'Harbor Labs', tenantId: 'someone-elses-tenant', isVerified: true });
    const data = prisma.organization.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ type: 'accelerator', name: 'Harbor Labs', slug: 'harbor-labs', createdById: 'u1' });
    expect(data).not.toHaveProperty('tenantId');
    expect(data).not.toHaveProperty('isVerified');
    expect(prisma.organizationMembership.create).toHaveBeenCalledWith({ data: { organizationId: 'org-1', userId: 'u1', role: 'owner' } });
  });

  it('refuses in the standard shape, with the field and its Greek', async () => {
    const { service } = makeService();
    const controller = new OrganizationController(service, {} as never, {} as never);
    const err = await controller.create({ user: { id: 'u1' } }, { type: 'incubator', name: 'Lab', slug: 'programs' }).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.getResponse().error.details).toMatchObject({ reason: 'org_invalid', field: 'slug' });
    expect(err.getResponse().error.details.messageEl).toMatch(/[Α-ω]/);
  });

  it('refuses a slug another organisation holds', async () => {
    const { service } = makeService({ id: 'org-0' });
    const err = await service.create('u1', { type: 'incubator', name: 'Lab one', slug: 'lab-one' }).catch((e) => e);
    expect(err.getResponse().error.details).toMatchObject({ reason: 'org_invalid', field: 'slug' });
  });
});

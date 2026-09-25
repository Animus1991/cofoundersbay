import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';

describe('TenantService public tenant lookup', () => {
  it('never joins private SSO or identity-provider material', async () => {
    const tenant = {
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme',
      branding: { primaryColor: '#123456' },
    };
    const findUnique = vi.fn().mockResolvedValue(tenant);
    const service = new TenantService({ tenant: { findUnique } } as never);

    await expect(service.findById('tenant-1')).resolves.toEqual(tenant);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      include: { branding: true },
    });
    expect(JSON.stringify(findUnique.mock.calls[0])).not.toContain('identityProvider');
    expect(JSON.stringify(findUnique.mock.calls[0])).not.toContain('ssoConfig');
  });

  it('keeps the existing not-found contract', async () => {
    const service = new TenantService({
      tenant: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

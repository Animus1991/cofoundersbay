import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { LISTING_PLATFORM_FIELDS, readInvestorListing, readMentorListing, readProviderListing } from '@cofounderbay/shared';
import { RolesService } from './roles.service';

function setup(existing: { provider?: object | null; investor?: object | null } = {}) {
  const prisma = {
    mentorProfile: { upsert: vi.fn(async (args: any) => ({ ...args.create })) },
    serviceProviderProfile: {
      findUnique: vi.fn(async () => existing.provider ?? null),
      upsert: vi.fn(async (args: any) => ({ ...args.create })),
    },
    investorProfile: {
      findUnique: vi.fn(async () => existing.investor ?? null),
      upsert: vi.fn(async (args: any) => ({ ...args.create })),
    },
  };
  return { prisma, service: new RolesService(prisma as any) };
}

const PLATFORM_OWNED = Object.fromEntries(LISTING_PLATFORM_FIELDS.map((f) => [f, f === 'isVerified' ? true : f.endsWith('At') || f === 'mentoringSince' ? '2020-01-01' : f === 'user' ? { connect: { id: 'other' } } : 999]));

describe('stakeholder listings keep platform-owned fields out of a member write', () => {
  it('a mentor cannot set their own rating, counts or verification', async () => {
    const { prisma, service } = setup();
    await service.createOrUpdateMentorProfile('u1', { headline: '  GTM advisor  ', isFree: false, hourlyRate: 12000, ...PLATFORM_OWNED });
    const args = prisma.mentorProfile.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId: 'u1' });
    expect(args.create).toEqual({ headline: 'GTM advisor', isFree: false, hourlyRate: 12000, userId: 'u1' });
    for (const field of LISTING_PLATFORM_FIELDS) {
      if (field === 'userId') continue;
      expect(args.update).not.toHaveProperty(field);
    }
    expect(args.update.userId).toBeUndefined();
  });

  it('a provider listing names its kind on the first save, and not after', async () => {
    const first = setup();
    await expect(first.service.createOrUpdateServiceProviderProfile('u1', { headline: 'Seed-stage legal' })).rejects.toBeInstanceOf(BadRequestException);
    expect(first.prisma.serviceProviderProfile.upsert).not.toHaveBeenCalled();

    const later = setup({ provider: { id: 'sp1' } });
    await later.service.createOrUpdateServiceProviderProfile('u1', { headline: 'Seed-stage legal', avgRating: 5 });
    expect(later.prisma.serviceProviderProfile.upsert.mock.calls[0][0].update).toEqual({ headline: 'Seed-stage legal' });
  });

  it('refuses an unknown kind with the field and a Greek message', async () => {
    const { service } = setup({ provider: { id: 'sp1' } });
    const err = await service.createOrUpdateServiceProviderProfile('u1', { serviceType: 'astrology' }).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    const body = (err as BadRequestException).getResponse() as any;
    expect(body.error.details).toMatchObject({ reason: 'listing_invalid', field: 'serviceType' });
    expect(body.error.details.messageEl).toMatch(/serviceType/);
  });

  it('an investor bound sent alone still sits on the right side of the stored one', async () => {
    const { prisma, service } = setup({ investor: { checkSizeMin: 50_000, checkSizeMax: 250_000 } });
    await expect(service.createOrUpdateInvestorProfile('u1', { checkSizeMax: 10_000 })).rejects.toBeInstanceOf(BadRequestException);
    await service.createOrUpdateInvestorProfile('u1', { checkSizeMax: 500_000 });
    expect(prisma.investorProfile.upsert).toHaveBeenCalledTimes(1);
  });
});

describe('listing readers', () => {
  it('trim text, empty text clears, lists dedupe case-insensitively', () => {
    const read = readMentorListing({ bio: '   ', industries: ['SaaS', 'saas', ' Fintech '], unknownKey: 1 });
    expect(read).toEqual({ ok: true, value: { bio: null, industries: ['SaaS', 'Fintech'] }, ignored: ['unknownKey'] });
  });

  it('session formats accept only the three the form offers', () => {
    expect(readMentorListing({ sessionFormats: ['video', 'async'] }).ok).toBe(true);
    expect(readMentorListing({ sessionFormats: ['telepathy'] }).ok).toBe(false);
  });

  it('numbers are whole and bounded; numeric strings from a form are read', () => {
    expect(readMentorListing({ yearsExperience: '20' })).toMatchObject({ ok: true, value: { yearsExperience: 20 } });
    expect(readMentorListing({ hoursPerWeek: 81 }).ok).toBe(false);
    expect(readMentorListing({ sessionDuration: 30.5 }).ok).toBe(false);
  });

  it('a website gains https when typed bare, and other schemes are refused', () => {
    expect(readProviderListing({ companyWebsite: 'example.com/team' })).toMatchObject({ ok: true, value: { companyWebsite: 'https://example.com/team' } });
    expect(readProviderListing({ companyWebsite: 'javascript:alert(1)' }).ok).toBe(false);
  });

  it('an investor cheque range must be ordered when both arrive', () => {
    expect(readInvestorListing({ checkSizeMin: 100, checkSizeMax: 50 })).toMatchObject({ ok: false, field: 'checkSizeMax' });
    expect(readInvestorListing({ investingSince: '2999-01-01' }).ok).toBe(false);
  });

  it('a body that is not an object is refused', () => {
    expect(readProviderListing(null).ok).toBe(false);
    expect(readProviderListing(['headline']).ok).toBe(false);
  });
});

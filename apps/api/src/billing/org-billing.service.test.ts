import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OrgBillingService } from './org-billing.service';

/*
 * An organisation's own plan (docs §104): members read it, owners and admins
 * buy it through Checkout and manage it in the portal, the webhook keeps the
 * row in step, and the plan's seats count the members.
 */

type Row = Record<string, any>;

const TEAM: Row = { id: 'plan-team', name: 'team', displayName: 'Team', planType: 'team', priceMonthly: 9900, priceAnnual: 89900, currency: 'USD', seatLimit: 25, isActive: true, isPublic: true, stripePriceIdMonthly: 'price_team_m', stripePriceIdAnnual: 'price_team_y' };
const ENTERPRISE: Row = { id: 'plan-ent', name: 'enterprise', displayName: 'Enterprise', isActive: true, isPublic: true, stripePriceIdMonthly: null, stripePriceIdAnnual: null };

function setup(opts: { role?: string | null; stripe?: boolean; subs?: Row[]; team?: Row } = {}) {
  const subs: Row[] = opts.subs ?? [];
  const team = opts.team ?? TEAM;
  const sessions: Row[] = [];
  const customers: Row[] = [];
  const prisma: any = {
    organizationMembership: {
      findFirst: vi.fn(async () => (opts.role === null ? null : { role: opts.role ?? 'admin' })),
      count: vi.fn(async () => 7),
    },
    organizationInvitation: { count: vi.fn(async () => 0) },
    billingPlan: {
      findUnique: vi.fn(async ({ where }: any) => [team, ENTERPRISE].find((p) => p.name === where.name || p.id === where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) => [team].find((p) => where.OR.some((o: Row) => (o.stripePriceIdMonthly && o.stripePriceIdMonthly === p.stripePriceIdMonthly) || (o.stripePriceIdAnnual && o.stripePriceIdAnnual === p.stripePriceIdAnnual))) ?? null),
      findMany: vi.fn(async () => [team, ENTERPRISE]),
      create: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(async ({ where }: any) => {
        const match = (row: Row) => Object.entries(where).every(([k, v]: [string, any]) => {
          if (k === 'status') return !v?.in || v.in.includes(row.status);
          if (v && typeof v === 'object' && 'not' in v) return row[k] != null;
          return row[k] === v;
        });
        const row = subs.find(match);
        return row ? { ...row, plan: team } : null;
      }),
      create: vi.fn(async ({ data }: any) => { const r = { id: `sub${subs.length}`, ...data }; subs.push(r); return r; }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(subs.find((s) => s.id === where.id)!, data)),
    },
    organization: { findUnique: vi.fn(async () => ({ name: 'Aegean Venture Lab', email: 'programs@aegeanlab.example' })) },
    user: { findUnique: vi.fn(async () => ({ email: 'alex@example.com' })) },
  };
  const stripeClient: any = {
    customers: { create: vi.fn(async (c: Row) => { customers.push(c); return { id: 'cus_org' }; }) },
    checkout: { sessions: { create: vi.fn(async (s: Row) => { sessions.push(s); return { id: 'cs_1', url: 'https://checkout.example/cs_1' }; }) } },
    billingPortal: { sessions: { create: vi.fn(async () => ({ url: 'https://portal.example/1' })) } },
  };
  const stripe: any = { isEnabled: () => opts.stripe !== false, getClient: () => stripeClient };
  const config: any = { get: (k: string) => (k === 'WEB_BASE_URL' ? 'https://cofounderbay.example' : undefined) };
  return { service: new OrgBillingService(prisma, config, stripe), subs, sessions, customers, prisma };
}

describe('an organisation\'s plan', () => {
  it('is read by its members; only owners and admins may change it', async () => {
    const member = await setup({ role: 'mentor' }).service.overview('org-1', 'u');
    expect(member).toMatchObject({ subscription: null, canManage: false, billingConfigured: true, seats: { used: 7, limit: null, full: false } });
    expect(member.plans.map((p) => [p.name, p.purchasable])).toEqual([['team', { monthly: true, annual: true }], ['enterprise', { monthly: false, annual: false }]]);
    expect(JSON.stringify(member.plans)).not.toContain('price_team');
    await expect(setup({ role: null }).service.overview('org-1', 'outsider')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(setup({ role: 'mentor' }).service.checkout('org-1', 'u', { planId: 'plan-team' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('is bought through Checkout for the organisation, monthly or yearly', async () => {
    const { service, sessions, customers, subs } = setup();
    const out = await service.checkout('org-1', 'admin', { planId: 'plan-team', cycle: 'annual' });
    expect(out.url).toBe('https://checkout.example/cs_1');
    expect(customers[0]).toMatchObject({ name: 'Aegean Venture Lab', email: 'programs@aegeanlab.example', metadata: { organizationId: 'org-1' } });
    expect(subs[0]).toMatchObject({ organizationId: 'org-1', planId: 'plan-team', status: 'incomplete', stripeCustomerId: 'cus_org' });
    expect(sessions[0]).toMatchObject({
      mode: 'subscription',
      customer: 'cus_org',
      line_items: [{ price: 'price_team_y', quantity: 1 }],
      metadata: { organizationId: 'org-1', planId: 'plan-team', cycle: 'annual' },
      success_url: 'https://cofounderbay.example/org/settings?tab=billing&billing=success',
    });
  });

  it('says why it cannot be bought', async () => {
    const problem = (p: Promise<unknown>) => p.catch((e) => e.response?.error?.details?.problem);
    expect(await problem(setup().service.checkout('org-1', 'admin', { planId: 'plan-ent' }))).toBe('enterprise_by_contact');
    expect(await problem(setup({ stripe: false }).service.checkout('org-1', 'admin', { planId: 'plan-team' }))).toBe('billing_not_configured');
    expect(await problem(setup({ team: { ...TEAM, stripePriceIdAnnual: null } }).service.checkout('org-1', 'admin', { planId: 'plan-team', cycle: 'annual' }))).toBe('plan_has_no_price');
    expect(await problem(setup().service.portal('org-1', 'admin'))).toBe('no_subscription');
  });

  it('is kept in step by the webhook: plan and period from the price bought', async () => {
    const { service, subs } = setup({ subs: [{ id: 's1', organizationId: 'org-1', planId: 'plan-team', status: 'incomplete', stripeCustomerId: 'cus_org' }] });
    expect(await service.syncCheckout({ metadata: { organizationId: 'org-1', planId: 'plan-team', cycle: 'monthly' }, subscription: 'sub_1', customer: 'cus_org' } as any)).toBe(true);
    expect(subs[0]).toMatchObject({ status: 'active', stripeSubscriptionId: 'sub_1', billingCycle: 'monthly' });
    const end = Math.floor(Date.parse('2027-10-24T00:00:00Z') / 1000);
    expect(await service.syncSubscription({ id: 'sub_1', customer: 'cus_org', metadata: {}, cancel_at_period_end: true, items: { data: [{ price: { id: 'price_team_y' }, current_period_end: end, current_period_start: end - 31_536_000 }] } } as any, 'active')).toBe(true);
    expect(subs[0]).toMatchObject({ billingCycle: 'annual', cancelAtPeriodEnd: true, planId: 'plan-team' });
    expect(subs[0].currentPeriodEnd.toISOString()).toBe('2027-10-24T00:00:00.000Z');
  });

  it('leaves a person\'s subscription to the person\'s sync', async () => {
    const { service } = setup();
    expect(await service.syncCheckout({ metadata: { userId: 'u1' } } as any)).toBe(false);
    expect(await service.syncSubscription({ id: 'sub_u', customer: 'cus_u', metadata: { userId: 'u1' }, items: { data: [] } } as any, 'active')).toBe(false);
  });
});

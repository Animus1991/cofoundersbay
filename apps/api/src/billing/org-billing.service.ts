import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BillingCycle, Prisma, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import {
  ORG_BILLING_PROBLEM_COPY,
  ORG_PLAN_LIVE_STATUSES,
  ORG_PLAN_NAMES,
  ORG_TEAM_PLAN_DEFAULTS,
  orgSeats,
  type OrgBillingCycle,
  type OrgBillingProblem,
} from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

export function orgBillingRefusal(problem: OrgBillingProblem) {
  const copy = ORG_BILLING_PROBLEM_COPY[problem];
  const details = { reason: 'org_billing', problem, messageEl: copy.el };
  if (problem === 'seats_full') return new ConflictException({ success: false, error: { code: 'CONFLICT', message: copy.en, details } });
  return new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: copy.en, details } });
}

type Tx = Prisma.TransactionClient | PrismaService;

/**
 * Seats of the organisation's live plan (active, trial or overdue), counted
 * against its active members - plus invitations still waiting when
 * `withPending`. No plan, no limit: what organisations had before plans.
 */
export async function orgSeatState(db: Tx, organizationId: string, withPending = false) {
  const sub = await db.subscription.findFirst({
    where: { organizationId, status: { in: [...ORG_PLAN_LIVE_STATUSES] as SubscriptionStatus[] } },
    include: { plan: { select: { seatLimit: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const members = await db.organizationMembership.count({ where: { organizationId, isActive: true } });
  const pending = withPending
    ? await db.organizationInvitation.count({ where: { organizationId, status: 'pending', expiresAt: { gt: new Date() } } })
    : 0;
  return orgSeats(members + pending, sub ? (sub.seatLimit ?? sub.plan?.seatLimit ?? null) : null);
}

/** Refuses a new member (or invitation) when the plan's seats are all taken. */
export async function assertOrgSeat(db: Tx, organizationId: string, withPending = false) {
  if ((await orgSeatState(db, organizationId, withPending)).full) throw orgBillingRefusal('seats_full');
}

/**
 * An organisation's own plan (docs §104): read by its members, bought and
 * managed by its owners and admins through Stripe Checkout and the billing
 * portal. The webhook (`BillingService.handleEvent`) keeps the row in step.
 */
@Injectable()
export class OrgBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stripeSvc: StripeService,
  ) {}

  private webBaseUrl(): string {
    return this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000';
  }

  private async role(orgId: string, userId: string): Promise<string> {
    const m = await this.prisma.organizationMembership.findFirst({ where: { organizationId: orgId, userId, isActive: true }, select: { role: true } });
    if (!m) throw new ForbiddenException('Membership required');
    return m.role;
  }

  private async assertManager(orgId: string, userId: string) {
    const role = await this.role(orgId, userId);
    if (role !== 'owner' && role !== 'admin') throw new ForbiddenException('Organization owner or admin access required');
  }

  /** The Team plan row, written from the pricing page's numbers when it does not exist yet. */
  async ensureTeamPlan() {
    const existing = await this.prisma.billingPlan.findUnique({ where: { name: ORG_TEAM_PLAN_DEFAULTS.name } });
    if (existing) return existing;
    const d = ORG_TEAM_PLAN_DEFAULTS;
    return this.prisma.billingPlan.create({
      data: {
        name: d.name,
        displayName: d.displayName,
        description: d.description,
        planType: d.planType,
        priceMonthly: d.priceMonthly,
        priceAnnual: d.priceAnnual,
        currency: d.currency,
        seatLimit: d.seatLimit,
        features: d.features as unknown as Prisma.InputJsonValue,
        isPublic: true,
        isActive: true,
        sortOrder: d.sortOrder,
        stripePriceIdMonthly: this.config.get<string>('STRIPE_PRICE_ID_TEAM_MONTHLY') ?? null,
        stripePriceIdAnnual: this.config.get<string>('STRIPE_PRICE_ID_TEAM_ANNUAL') ?? null,
      },
    });
  }

  async overview(orgId: string, userId: string) {
    const role = await this.role(orgId, userId);
    await this.ensureTeamPlan();
    const [sub, plans, seats] = await Promise.all([
      this.prisma.subscription.findFirst({ where: { organizationId: orgId }, include: { plan: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.billingPlan.findMany({ where: { isActive: true, isPublic: true, name: { in: [...ORG_PLAN_NAMES] } }, orderBy: { sortOrder: 'asc' } }),
      orgSeatState(this.prisma, orgId),
    ]);
    return {
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            billingCycle: sub.billingCycle,
            currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            hasPaymentAccount: Boolean(sub.stripeCustomerId),
            plan: { id: sub.plan.id, name: sub.plan.name, displayName: sub.plan.displayName, priceMonthly: sub.plan.priceMonthly, priceAnnual: sub.plan.priceAnnual, currency: sub.plan.currency, seatLimit: sub.seatLimit ?? sub.plan.seatLimit },
          }
        : null,
      seats,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceAnnual: p.priceAnnual,
        currency: p.currency,
        seatLimit: p.seatLimit,
        // Whether Checkout can sell it for each period; the ids stay here.
        purchasable: { monthly: Boolean(p.stripePriceIdMonthly), annual: Boolean(p.stripePriceIdAnnual) },
      })),
      billingConfigured: this.stripeSvc.isEnabled(),
      canManage: role === 'owner' || role === 'admin',
    };
  }

  /** The organisation's Stripe customer, made once and kept on its subscription row. */
  private async ensureCustomer(orgId: string, actorId: string, planId: string, cycle: OrgBillingCycle) {
    const existing = await this.prisma.subscription.findFirst({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
    if (existing?.stripeCustomerId) return { customerId: existing.stripeCustomerId };
    const [org, actor] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, email: true } }),
      this.prisma.user.findUnique({ where: { id: actorId }, select: { email: true } }),
    ]);
    if (!org) throw new NotFoundException('Organization not found');
    const customer = await this.stripeSvc.getClient().customers.create({
      name: org.name,
      email: org.email ?? actor?.email ?? undefined,
      metadata: { organizationId: orgId },
    });
    const now = new Date();
    if (existing) {
      await this.prisma.subscription.update({ where: { id: existing.id }, data: { stripeCustomerId: customer.id } });
    } else {
      await this.prisma.subscription.create({
        data: {
          organizationId: orgId,
          planId,
          billingCycle: cycle as BillingCycle,
          status: 'incomplete' as SubscriptionStatus,
          currentPeriodStart: now,
          currentPeriodEnd: now,
          stripeCustomerId: customer.id,
        },
      });
    }
    return { customerId: customer.id };
  }

  async checkout(orgId: string, userId: string, body: Record<string, unknown>) {
    await this.assertManager(orgId, userId);
    const cycle: OrgBillingCycle = body.cycle === 'annual' ? 'annual' : 'monthly';
    const plan = typeof body.planId === 'string' ? await this.prisma.billingPlan.findUnique({ where: { id: body.planId } }) : await this.ensureTeamPlan();
    if (!plan || !plan.isActive || !(ORG_PLAN_NAMES as readonly string[]).includes(plan.name)) throw orgBillingRefusal('not_an_org_plan');
    if (plan.name === 'enterprise') throw orgBillingRefusal('enterprise_by_contact');
    if (!this.stripeSvc.isEnabled()) throw orgBillingRefusal('billing_not_configured');
    const priceId = cycle === 'annual' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;
    if (!priceId) throw orgBillingRefusal('plan_has_no_price');
    const { customerId } = await this.ensureCustomer(orgId, userId, plan.id, cycle);
    const metadata = { organizationId: orgId, planId: plan.id, cycle };
    const session = await this.stripeSvc.getClient().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: `org:${orgId}`,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${this.webBaseUrl()}/org/settings?tab=billing&billing=success`,
      cancel_url: `${this.webBaseUrl()}/org/settings?tab=billing&billing=cancel`,
      subscription_data: { metadata },
      metadata,
    });
    return { url: session.url, id: session.id };
  }

  async portal(orgId: string, userId: string) {
    await this.assertManager(orgId, userId);
    if (!this.stripeSvc.isEnabled()) throw orgBillingRefusal('billing_not_configured');
    const sub = await this.prisma.subscription.findFirst({ where: { organizationId: orgId, stripeCustomerId: { not: null } }, orderBy: { createdAt: 'desc' } });
    if (!sub?.stripeCustomerId) throw orgBillingRefusal('no_subscription');
    const session = await this.stripeSvc.getClient().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${this.webBaseUrl()}/org/settings?tab=billing`,
    });
    return { url: session.url };
  }

  // ── Webhook ────────────────────────────────────────────────────────────────

  /** A completed Checkout for an organisation: the row takes the Stripe subscription and the plan bought. */
  async syncCheckout(session: Stripe.Checkout.Session): Promise<boolean> {
    const orgId = session.metadata?.organizationId;
    if (!orgId) return false;
    const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const existing = await this.prisma.subscription.findFirst({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
    const planId = session.metadata?.planId ?? existing?.planId ?? (await this.ensureTeamPlan()).id;
    const data = {
      status: 'active' as SubscriptionStatus,
      planId,
      billingCycle: (session.metadata?.cycle === 'annual' ? 'annual' : 'monthly') as BillingCycle,
      ...(stripeSubscriptionId && { stripeSubscriptionId }),
      ...(stripeCustomerId && { stripeCustomerId }),
    };
    if (existing) await this.prisma.subscription.update({ where: { id: existing.id }, data });
    else await this.prisma.subscription.create({ data: { organizationId: orgId, currentPeriodEnd: new Date(), ...data } });
    return true;
  }

  /** A Stripe subscription change for an organisation; false when it is not one. */
  async syncSubscription(sub: Stripe.Subscription, status: SubscriptionStatus): Promise<boolean> {
    const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const existing =
      (await this.prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } })) ??
      (await this.prisma.subscription.findFirst({ where: { stripeCustomerId, organizationId: { not: null } } }));
    const orgId = existing?.organizationId ?? sub.metadata?.organizationId ?? null;
    if (!orgId) return false;
    const priceId = sub.items.data[0]?.price?.id ?? null;
    const plan = priceId
      ? await this.prisma.billingPlan.findFirst({ where: { OR: [{ stripePriceIdMonthly: priceId }, { stripePriceIdAnnual: priceId }] } })
      : null;
    const periodEnd = sub.items?.data?.length ? Math.max(...sub.items.data.map((i) => i.current_period_end)) : null;
    const periodStart = sub.items.data[0]?.current_period_start ?? null;
    const data = {
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      status,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      ...(periodEnd && { currentPeriodEnd: new Date(periodEnd * 1000) }),
      ...(periodStart && { currentPeriodStart: new Date(periodStart * 1000) }),
      ...(plan && { planId: plan.id, billingCycle: (plan.stripePriceIdAnnual === priceId ? 'annual' : 'monthly') as BillingCycle }),
      ...(status === 'canceled' && { canceledAt: new Date() }),
    };
    if (existing) await this.prisma.subscription.update({ where: { id: existing.id }, data });
    else await this.prisma.subscription.create({ data: { organizationId: orgId, planId: plan?.id ?? (await this.ensureTeamPlan()).id, currentPeriodEnd: new Date(), ...data } });
    return true;
  }
}

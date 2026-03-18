import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SubscriptionStatus, BillingCycle } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stripeSvc: StripeService,
  ) {}

  private webBaseUrl(): string {
    return this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000';
  }

  private defaultPriceId(): string | null {
    return this.config.get<string>('STRIPE_PRICE_ID_PREMIUM') ?? null;
  }

  // ── Plans ─────────────────────────────────────────────────────────────────

  async listPlans() {
    const plans = await this.prisma.billingPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { plans };
  }

  async getPlan(planId: string) {
    const plan = await this.prisma.billingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    return { plan };
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  async getSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return { subscription: sub };
  }

  async getUserSubscriptions(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return { subscriptions };
  }

  private async getOrCreateFreePlan(): Promise<string> {
    let freePlan = await this.prisma.billingPlan.findUnique({ where: { name: 'free' } });
    if (!freePlan) {
      freePlan = await this.prisma.billingPlan.create({
        data: {
          name: 'free',
          displayName: 'Free',
          description: 'Basic access to the platform',
          planType: 'free',
          priceMonthly: 0,
          priceAnnual: 0,
          features: { matching: 'basic', messages: 100, events: true },
          isPublic: true,
          isActive: true,
          sortOrder: 0,
        },
      });
    }
    return freePlan.id;
  }

  private async ensureStripeCustomer(userId: string): Promise<{ customerId: string; subscriptionId?: string }> {
    const stripe = this.stripeSvc.getClient();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new BadRequestException('User not found');

    const existing = await this.prisma.subscription.findFirst({ where: { userId } });
    if (existing?.stripeCustomerId) {
      return { customerId: existing.stripeCustomerId, subscriptionId: existing.id };
    }

    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });

    // Create a free subscription by default
    const freePlanId = await this.getOrCreateFreePlan();
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const sub = await this.prisma.subscription.create({
      data: {
        userId,
        planId: freePlanId,
        billingCycle: 'monthly' as BillingCycle,
        status: 'active' as SubscriptionStatus,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripeCustomerId: customer.id,
      },
    });

    return { customerId: customer.id, subscriptionId: sub.id };
  }

  async createCheckoutSession(params: { userId: string; priceId?: string | null }) {
    if (!this.stripeSvc.isEnabled()) throw new BadRequestException('Billing is not configured');

    const priceId = params.priceId?.trim() || this.defaultPriceId();
    if (!priceId) throw new BadRequestException('Missing priceId');

    const stripe = this.stripeSvc.getClient();
    const { customerId } = await this.ensureStripeCustomer(params.userId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: params.userId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${this.webBaseUrl()}/settings?billing=success`,
      cancel_url: `${this.webBaseUrl()}/settings?billing=cancel`,
      subscription_data: {
        metadata: { userId: params.userId },
      },
      metadata: { userId: params.userId },
    });

    return { url: session.url, id: session.id };
  }

  async createPortalSession(userId: string) {
    if (!this.stripeSvc.isEnabled()) throw new BadRequestException('Billing is not configured');
    const stripe = this.stripeSvc.getClient();
    const { customerId } = await this.ensureStripeCustomer(userId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.webBaseUrl()}/settings`,
    });

    return { url: session.url };
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const stripe = this.stripeSvc.getClient();
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new BadRequestException('Missing STRIPE_WEBHOOK_SECRET');
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.syncFromCheckoutSession(session);
        return;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncFromStripeSubscription(sub);
        return;
      }
      default:
        return;
    }
  }

  private async syncFromCheckoutSession(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription') return;

    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const stripeSubscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    if (!stripeCustomerId || !stripeSubscriptionId) return;

    const userId = session.client_reference_id ?? (session.metadata?.userId || null);
    if (!userId) return;

    // Find existing subscription for this user
    const existing = await this.prisma.subscription.findFirst({ where: { userId } });
    
    if (existing) {
      // Update existing subscription with Stripe IDs
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          stripeCustomerId,
          stripeSubscriptionId,
          status: 'active' as SubscriptionStatus,
        },
      });
    }
    // If no existing subscription, the webhook for subscription.created will handle it
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'trialing':
      case 'active':
      case 'past_due':
      case 'canceled':
      case 'unpaid':
      case 'incomplete':
      case 'incomplete_expired':
      case 'paused':
        return status as SubscriptionStatus;
      default:
        return 'past_due' as SubscriptionStatus;
    }
  }

  private async syncFromStripeSubscription(sub: Stripe.Subscription) {
    const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const stripeSubscriptionId = sub.id;

    const stripePriceId = sub.items.data[0]?.price?.id ?? null;
    const maxItemPeriodEnd = sub.items?.data?.length
      ? Math.max(...sub.items.data.map((i) => i.current_period_end))
      : null;
    const currentPeriodEnd = maxItemPeriodEnd 
      ? new Date(maxItemPeriodEnd * 1000) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const currentPeriodStart = sub.items.data[0]?.current_period_start
      ? new Date(sub.items.data[0].current_period_start * 1000)
      : new Date();
    const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
    const status = this.mapStripeStatus(sub.status);

    // Find existing subscription by Stripe IDs or user
    const existing =
      (await this.prisma.subscription.findFirst({ where: { stripeCustomerId } })) ??
      (await this.prisma.subscription.findFirst({ where: { stripeSubscriptionId } }));

    const userId = existing?.userId ?? (sub.metadata?.userId || null);
    if (!userId) return;

    // Get or create a premium plan to link to
    let premiumPlan = await this.prisma.billingPlan.findUnique({ where: { name: 'premium' } });
    if (!premiumPlan) {
      premiumPlan = await this.prisma.billingPlan.create({
        data: {
          name: 'premium',
          displayName: 'Premium',
          description: 'Full access to all platform features',
          planType: 'individual_premium',
          priceMonthly: 1900, // $19/month
          priceAnnual: 15900, // $159/year
          features: { matching: 'advanced', messages: 'unlimited', events: true, analytics: true },
          stripePriceIdMonthly: stripePriceId,
          isPublic: true,
          isActive: true,
          sortOrder: 1,
        },
      });
    }

    if (existing) {
      // Update existing subscription
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          stripeCustomerId,
          stripeSubscriptionId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          planId: premiumPlan.id,
        },
      });
    } else {
      // Create new subscription
      await this.prisma.subscription.create({
        data: {
          userId,
          planId: premiumPlan.id,
          billingCycle: 'monthly',
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          stripeCustomerId,
          stripeSubscriptionId,
        },
      });
    }
  }
}


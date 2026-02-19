import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SubscriptionStatus } from '@prisma/client';
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

  async getSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    return { subscription: sub };
  }

  private async ensureStripeCustomer(userId: string): Promise<{ customerId: string }> {
    const stripe = this.stripeSvc.getClient();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new BadRequestException('User not found');

    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    if (existing?.stripeCustomerId) return { customerId: existing.stripeCustomerId };

    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customer.id,
        status: 'incomplete' as SubscriptionStatus,
      },
      update: {
        stripeCustomerId: customer.id,
      },
    });

    return { customerId: customer.id };
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

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'incomplete' as SubscriptionStatus,
      },
      update: {
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
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

    const priceId = sub.items.data[0]?.price?.id ?? null;
    const maxItemPeriodEnd = sub.items?.data?.length
      ? Math.max(...sub.items.data.map((i) => i.current_period_end))
      : null;
    const currentPeriodEnd = maxItemPeriodEnd ? new Date(maxItemPeriodEnd * 1000) : null;
    const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
    const status = this.mapStripeStatus(sub.status);

    const existing =
      (await this.prisma.subscription.findFirst({ where: { stripeCustomerId } })) ??
      (await this.prisma.subscription.findFirst({ where: { stripeSubscriptionId } }));

    const userId = existing?.userId ?? (sub.metadata?.userId || null);
    if (!userId) return;

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        status,
        priceId,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
      update: {
        stripeCustomerId,
        stripeSubscriptionId,
        status,
        priceId,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
    });
  }
}


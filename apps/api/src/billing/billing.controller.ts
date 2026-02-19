import { BadRequestException, Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('v1/billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser() user: { id: string }) {
    const { subscription } = await this.billing.getSubscription(user.id);
    if (!subscription) return { subscription: null };
    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.priceId,
        currentPeriodEnd: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    };
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@CurrentUser() user: { id: string }, @Body() body?: { priceId?: string }) {
    return this.billing.createCheckoutSession({ userId: user.id, priceId: body?.priceId });
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(@CurrentUser() user: { id: string }) {
    return this.billing.createPortalSession(user.id);
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest, @Headers('stripe-signature') sig?: string) {
    if (!sig) throw new BadRequestException('Missing stripe-signature');
    const raw = req.rawBody;
    if (!raw || !(raw instanceof Buffer)) throw new BadRequestException('Missing raw body');

    const event = this.billing.constructEvent(raw, sig);
    await this.billing.handleEvent(event);
    return { received: true };
  }
}


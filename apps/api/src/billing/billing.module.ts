import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { OrgBillingService } from './org-billing.service';

@Module({
  imports: [ConfigModule],
  controllers: [BillingController],
  providers: [StripeService, BillingService, OrgBillingService],
  exports: [BillingService, OrgBillingService],
})
export class BillingModule {}


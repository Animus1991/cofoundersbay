import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { OpportunityProposalsController } from './opportunity-proposals.controller';
import { OpportunityProposalsService } from './opportunity-proposals.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [OpportunityProposalsController, OpportunitiesController],
  providers: [OpportunitiesService, OpportunityProposalsService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}

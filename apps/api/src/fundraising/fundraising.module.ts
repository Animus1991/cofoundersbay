import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadsModule } from '../uploads/uploads.module';
import { FundraisingController } from './fundraising.controller';
import { FundraisingService } from './fundraising.service';

@Module({
  imports: [PrismaModule, UploadsModule, NotificationsModule],
  controllers: [FundraisingController],
  providers: [FundraisingService],
})
export class FundraisingModule {}

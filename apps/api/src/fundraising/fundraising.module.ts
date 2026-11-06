import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadsModule } from '../uploads/uploads.module';
import { FundraisingController } from './fundraising.controller';
import { FundraisingService } from './fundraising.service';

@Module({
  imports: [PrismaModule, UploadsModule],
  controllers: [FundraisingController],
  providers: [FundraisingService],
})
export class FundraisingModule {}

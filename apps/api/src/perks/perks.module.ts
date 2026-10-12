import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PerksController } from './perks.controller';
import { PerksService } from './perks.service';

@Module({
  imports: [PrismaModule],
  controllers: [PerksController],
  providers: [PerksService],
})
export class PerksModule {}

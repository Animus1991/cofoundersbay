import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ResearchGateway } from './research.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ConfigModule, AuthModule],
  controllers: [ResearchController],
  providers: [ResearchService, ResearchGateway],
  exports: [ResearchService, ResearchGateway],
})
export class ResearchModule {}

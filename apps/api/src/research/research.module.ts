import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ResearchGateway } from './research.gateway';
import { CanvasVersioningService } from './canvas-versioning.service';
import { CanvasVersioningController } from './canvas-versioning.controller';
import { CanvasSynthesisService } from './canvas-synthesis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, ConfigModule, AuthModule, AIModule],
  controllers: [ResearchController, CanvasVersioningController],
  providers: [ResearchService, ResearchGateway, CanvasVersioningService, CanvasSynthesisService],
  exports: [ResearchService, ResearchGateway, CanvasVersioningService, CanvasSynthesisService],
})
export class ResearchModule {}

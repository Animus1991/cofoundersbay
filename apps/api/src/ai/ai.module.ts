import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { OllamaService } from './ollama.service';
import { AIConversationService } from './ai-conversation.service';
import { AIJobQueueService } from './ai-job-queue.service';
import { AIProviderRegistry } from './providers/ai-provider.registry';
import { AIRateLimitGuard } from './guards/ai-rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AIController],
  providers: [
    AIProviderRegistry,
    AIService,
    OllamaService,
    AIConversationService,
    AIJobQueueService,
    AIRateLimitGuard,
  ],
  exports: [AIProviderRegistry, AIService, OllamaService, AIJobQueueService],
})
export class AIModule {}

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';

const directConversationSchema = z.object({
  userId: z.string().uuid(),
});

const flagsSchema = z.object({
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

@Controller('v1/messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get('conversations')
  async listConversations(@CurrentUser() user: { id: string }) {
    const conversations = await this.messaging.listConversations(user.id);
    return { conversations };
  }

  @Post('conversations/direct')
  async getOrCreateDirect(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const { userId } = directConversationSchema.parse(body);
    const conversation = await this.messaging.getOrCreateDirectConversation(user.id, userId);
    return { conversationId: conversation.id };
  }

  @Get('conversations/:conversationId/messages')
  async listMessages(
    @CurrentUser() user: { id: string },
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
  ) {
    const messages = await this.messaging.listMessages(user.id, conversationId, limit ? parseInt(limit, 10) : 50);
    return { messages };
  }

  @Patch('conversations/:conversationId')
  async updateConversationFlags(
    @CurrentUser() user: { id: string },
    @Param('conversationId') conversationId: string,
    @Body() body: unknown,
  ) {
    const flags = flagsSchema.parse(body);
    return this.messaging.setConversationFlags(user.id, conversationId, flags);
  }
}


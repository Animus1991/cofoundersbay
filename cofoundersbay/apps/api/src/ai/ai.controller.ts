import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AIService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly ai: AIService) {}

  @Post('profile-suggestions')
  async getProfileSuggestions(@CurrentUser() user: { id: string }) {
    const suggestions = await this.ai.getProfileSuggestions(user.id);
    return { suggestions };
  }

  @Post('meeting-notes/summarize')
  async summarizeMeetingNotes(
    @Body() body: { notes: string },
  ) {
    const summary = await this.ai.summarizeMeetingNotes(body.notes ?? '');
    return { summary };
  }
}

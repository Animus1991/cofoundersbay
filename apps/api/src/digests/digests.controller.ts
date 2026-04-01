import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EmailDigestService, DigestType } from './email-digest.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('digests')
@UseGuards(JwtAuthGuard)
export class DigestsController {
  constructor(private readonly emailDigestService: EmailDigestService) {}

  @Post('test/:userId')
  async sendTestDigest(
    @Param('userId') userId: string,
    @Body('type') type: DigestType = 'daily',
    @CurrentUser() currentUser: any,
  ) {
    // Only allow admins to send test digests to other users
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      throw new Error('You can only send test digests to yourself');
    }

    await this.emailDigestService.sendTestDigest(userId, type);
    return { message: `Test ${type} digest sent successfully` };
  }

  @Post('trigger/:type')
  async triggerDigest(
    @Param('type') type: DigestType,
    @CurrentUser() currentUser: any,
  ) {
    // Only allow admins to manually trigger digests
    if (currentUser.role !== 'admin') {
      throw new Error('Only admins can trigger digest generation');
    }

    await this.emailDigestService.generateDigests(type);
    return { message: `${type} digest generation triggered` };
  }

  @Get('preferences')
  async getDigestPreferences(@CurrentUser() currentUser: any) {
    // TODO: Implement digest preferences storage (requires schema update)
    // For now, return default preferences
    return {
      preferences: {
        daily: false,
        weekly: true,
        monthly: false,
        connections: true,
        messages: true,
        opportunities: true,
        events: true,
        updates: false,
      },
    };
  }

  @Post('preferences')
  async updateDigestPreferences(
    @Body() preferences: any,
    @CurrentUser() currentUser: any,
  ) {
    // TODO: Implement digest preferences storage (requires schema update)
    // For now, just acknowledge the request
    return { message: 'Digest preferences updated successfully (storage pending schema update)' };
  }
}

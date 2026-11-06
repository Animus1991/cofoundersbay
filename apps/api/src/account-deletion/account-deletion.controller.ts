import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { clearAuthCookies } from '../auth/cookie.utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { deleteAccountSchema } from './account-deletion.schemas';
import { AccountDeletionService } from './account-deletion.service';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountDeletionController {
  constructor(private readonly deletion: AccountDeletionService) {}

  /** What deleting would remove, what stands in the way, and how to confirm it. */
  @Get('deletion')
  preview(@CurrentUser() user: { id: string }) {
    return this.deletion.preview(user.id);
  }

  @Post('delete')
  @HttpCode(200)
  // A password is asked for here, so guessing it is held to the login's pace.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async delete(@CurrentUser() user: { id: string }, @Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.deletion.delete(user.id, deleteAccountSchema.parse(body));
    clearAuthCookies(res);
    return result;
  }
}

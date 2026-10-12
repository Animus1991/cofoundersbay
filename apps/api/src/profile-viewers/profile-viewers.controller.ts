import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-optional.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProfileViewersService } from './profile-viewers.service';

@Controller('profile-viewers')
export class ProfileViewersController {
  constructor(private readonly viewers: ProfileViewersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  summary(@CurrentUser() user: { id: string }) {
    return this.viewers.summary(user.id);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  getSetting(@CurrentUser() user: { id: string }) {
    return this.viewers.getSetting(user.id);
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  setSetting(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.viewers.setSetting(user.id, body);
  }

  /** Signed in or not: a signed-out view is counted, never named. */
  @Post(':userId/view')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  record(@Param('userId') userId: string, @CurrentUser() user: { id: string } | undefined, @Body() body: unknown) {
    return this.viewers.record(userId, user?.id ?? null, body);
  }
}

import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CompatibilityService } from './compatibility.service';

@Controller('compatibility')
@UseGuards(JwtAuthGuard)
export class CompatibilityController {
  constructor(private readonly compatibility: CompatibilityService) {}

  @Get('me')
  mine(@CurrentUser() user: { id: string }) {
    return this.compatibility.mine(user.id);
  }

  @Put('me')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  save(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.compatibility.save(user.id, body);
  }

  @Get('with/:userId')
  withUser(@CurrentUser() user: { id: string }, @Param('userId') userId: string) {
    return this.compatibility.withUser(user.id, userId);
  }
}

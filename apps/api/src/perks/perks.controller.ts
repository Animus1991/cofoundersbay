import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PerksService } from './perks.service';

@Controller('perks')
@UseGuards(JwtAuthGuard)
export class PerksController {
  constructor(private readonly perks: PerksService) {}

  @Get()
  list(@CurrentUser() user: { id: string }, @Query('category') category?: string, @Query('stage') stage?: string) {
    return this.perks.list(user.id, { category, stage });
  }

  @Get('claimed')
  claimed(@CurrentUser() user: { id: string }) {
    return this.perks.claimed(user.id);
  }

  @Post(':id/claim')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  claim(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.perks.claim(user.id, id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  adminList() {
    return this.perks.adminList();
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.perks.create(user.id, body);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.perks.update(id, body);
  }
}

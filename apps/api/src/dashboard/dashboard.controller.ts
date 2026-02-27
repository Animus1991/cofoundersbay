import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.dashboard.getStats();
  }

  @Get('dashboard/activity')
  @UseGuards(JwtAuthGuard)
  async getActivity(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 10;
    return this.dashboard.getActivity(Math.min(Math.max(parsed, 1), 50));
  }
}

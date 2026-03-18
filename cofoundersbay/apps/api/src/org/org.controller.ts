import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { OrgService } from './org.service';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-optional.guard';

@Controller('org')
@UseGuards(OptionalJwtAuthGuard)
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get(':slug')
  async getOrgProfile(@Param('slug') slug: string) {
    return this.orgService.getOrgProfile(slug);
  }

  @Get(':slug/opportunities')
  async getOrgOpportunities(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.orgService.getOrgOpportunities(slug, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get(':slug/cohorts')
  async getOrgCohorts(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.orgService.getOrgCohorts(slug, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }
}

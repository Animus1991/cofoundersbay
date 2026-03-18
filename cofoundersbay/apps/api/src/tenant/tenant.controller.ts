import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  /** Public: get tenant by slug (for branded landing pages) */
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.tenants.findBySlug(slug);
  }

  /** Public: list active tenants */
  @Get()
  async list(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.tenants.list({
      status: status ?? 'active',
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /** Admin: create tenant */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async create(@Body() body: {
    slug: string;
    name: string;
    displayName?: string;
    description?: string;
    website?: string;
    logoUrl?: string;
  }) {
    return this.tenants.create(body);
  }

  /** Admin: update tenant */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.tenants.update(id, body as Parameters<TenantService['update']>[1]);
  }

  /** Admin: upsert branding */
  @Patch(':id/branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async upsertBranding(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.tenants.upsertBranding(id, body as Parameters<TenantService['upsertBranding']>[1]);
  }

  /** Admin: delete tenant */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async remove(@Param('id') id: string) {
    return this.tenants.delete(id);
  }
}

import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TenantService, TenantCreateInput, TenantUpdateInput, TenantBrandingInput } from './tenant.service';
import { TenantMemberRole } from '@prisma/client';
import { TenantDomainService } from './tenant-domain.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenants: TenantService,
    private readonly domains: TenantDomainService,
  ) {}

  // ── Public endpoints ────────────────────────────────────────────────────────

  /** Public: list active tenants */
  @Get()
  async list(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.tenants.list({
      status: status ?? 'active',
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /** Public: get tenant by slug (for branded landing pages) */
  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.tenants.findBySlug(slug);
  }

  /** Public: resolve tenant from a hostname (used by Next.js middleware / TenantContext) */
  @Get('resolve-domain')
  async resolveDomain(@Query('domain') domain: string) {
    if (!domain) return { tenant: null };
    const result = await this.domains.resolveTenantFromDomain(domain);
    if (!result) return { tenant: null };
    return {
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        name: result.tenant.name,
        displayName: result.tenant.displayName,
        logoUrl: result.tenant.logoUrl,
        faviconUrl: result.tenant.faviconUrl,
        status: result.tenant.status,
      },
      branding: result.branding
        ? {
            primaryColor: result.branding.primaryColor,
            secondaryColor: result.branding.secondaryColor,
            accentColor: result.branding.accentColor,
            heroTitle: result.branding.heroTitle,
            heroSubtitle: result.branding.heroSubtitle,
            isBrandingActive: result.branding.isBrandingActive,
          }
        : null,
      domain: result.domain
        ? { id: result.domain.id, domainType: result.domain.domainType, isPrimary: result.domain.isPrimary }
        : null,
    };
  }

  /** Public: get tenant by ID */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.tenants.findById(id);
  }

  // ── Admin: Tenant CRUD ──────────────────────────────────────────────────────

  /** Admin: create tenant */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async create(@Body() body: TenantCreateInput) {
    return this.tenants.create(body);
  }

  /** Admin: update tenant */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async update(@Param('id') id: string, @Body() body: TenantUpdateInput) {
    return this.tenants.update(id, body);
  }

  /** Admin: delete tenant */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.tenants.delete(id);
  }

  // ── Admin: Branding ─────────────────────────────────────────────────────────

  /** Admin: get tenant branding */
  @Get(':id/branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async getBranding(@Param('id') id: string) {
    return this.tenants.getBranding(id);
  }

  /** Admin: upsert branding */
  @Patch(':id/branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async upsertBranding(@Param('id') id: string, @Body() body: TenantBrandingInput) {
    return this.tenants.upsertBranding(id, body);
  }

  /** Admin: publish branding */
  @Post(':id/branding/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async publishBranding(@Param('id') id: string) {
    return this.tenants.publishBranding(id);
  }

  /** Admin: unpublish branding */
  @Post(':id/branding/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async unpublishBranding(@Param('id') id: string) {
    return this.tenants.unpublishBranding(id);
  }

  // ── Admin: Members ──────────────────────────────────────────────────────────

  /** Admin: list tenant members */
  @Get(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async getMembers(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.tenants.getMembers(id, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /** Admin: add member */
  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role?: string },
  ) {
    return this.tenants.addMember(id, body.userId, body.role as TenantMemberRole | undefined);
  }

  /** Admin: update member role / active status */
  @Patch(':id/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role?: string; isActive?: boolean },
  ) {
    return this.tenants.updateMember(id, userId, body as { role?: TenantMemberRole; isActive?: boolean });
  }

  /** Admin: remove member */
  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    await this.tenants.removeMember(id, userId);
  }

  // ── Admin: Domain Management ─────────────────────────────────────────────

  /** Admin: list domains for a tenant */
  @Get(':id/domains')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async listDomains(@Param('id') id: string) {
    return this.domains.listDomainsForTenant(id);
  }

  /** Admin: add subdomain (e.g. athens.cofounderbay.com) */
  @Post(':id/domains/subdomain')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async addSubdomain(
    @Param('id') id: string,
    @Body() body: { subdomain: string },
  ) {
    return this.domains.createSubdomain(id, body.subdomain);
  }

  /** Admin: add custom domain */
  @Post(':id/domains/custom')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async addCustomDomain(
    @Param('id') id: string,
    @Body() body: { domainName: string },
  ) {
    return this.domains.addCustomDomain(id, body.domainName);
  }

  /** Admin: get DNS instructions for a domain */
  @Get(':id/domains/:domainId/dns-instructions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async getDnsInstructions(@Param('domainId') domainId: string) {
    const { domain } = await this.domains.getDomainById(domainId);
    return this.domains.getDnsInstructions(domain);
  }

  /** Admin: verify custom domain DNS */
  @Post(':id/domains/:domainId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async verifyDomain(@Param('domainId') domainId: string) {
    return this.domains.verifyCustomDomain(domainId);
  }

  /** Admin: set primary domain */
  @Post(':id/domains/:domainId/set-primary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async setPrimary(@Param('id') id: string, @Param('domainId') domainId: string) {
    return this.domains.setPrimaryDomain(id, domainId);
  }

  /** Admin: activate / deactivate domain */
  @Patch(':id/domains/:domainId/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async toggleActive(
    @Param('domainId') domainId: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.domains.toggleDomainActive(domainId, body.isActive);
  }

  /** Admin: delete domain */
  @Delete(':id/domains/:domainId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDomain(@Param('domainId') domainId: string) {
    await this.domains.deleteDomain(domainId);
  }
}

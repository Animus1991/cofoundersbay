import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AdminAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // Platform Stats
  // ─────────────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    const stats = await this.adminService.getPlatformStats();
    return { stats };
  }

  // ─────────────────────────────────────────────────────────────────
  // User Management
  // ─────────────────────────────────────────────────────────────────

  @Get('users')
  async listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    const offset = offsetRaw ? parseInt(offsetRaw, 10) : 0;
    return this.adminService.listUsers({ role, status, q, limit, offset });
  }

  @Patch('users/:userId/role')
  async changeUserRole(
    @CurrentUser() admin: { id: string },
    @Param('userId') userId: string,
    @Body() body: { role: Role },
  ) {
    await this.adminService.changeUserRole({
      adminId: admin.id,
      userId,
      newRole: body.role,
    });
    return { success: true };
  }

  @Post('users/:userId/ban')
  async banUser(
    @CurrentUser() admin: { id: string },
    @Param('userId') userId: string,
    @Body() body: { reason: string },
  ) {
    await this.adminService.banUser({
      adminId: admin.id,
      userId,
      reason: body.reason,
    });
    return { success: true };
  }

  @Post('users/:userId/unban')
  async unbanUser(
    @CurrentUser() admin: { id: string },
    @Param('userId') userId: string,
  ) {
    await this.adminService.unbanUser({
      adminId: admin.id,
      userId,
    });
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // Content Management
  // ─────────────────────────────────────────────────────────────────

  @Patch('content/:type/:id/feature')
  async featureContent(
    @CurrentUser() admin: { id: string },
    @Param('type') type: 'event' | 'group' | 'job',
    @Param('id') id: string,
    @Body() body: { featured: boolean },
  ) {
    await this.adminService.featureContent({
      adminId: admin.id,
      contentType: type,
      contentId: id,
      featured: body.featured,
    });
    return { success: true };
  }

  @Delete('content/:type/:id')
  async removeContent(
    @CurrentUser() admin: { id: string },
    @Param('type') type: 'event' | 'group' | 'job',
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    await this.adminService.removeContent({
      adminId: admin.id,
      contentType: type,
      contentId: id,
      reason: body.reason,
    });
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // Cohort / Program Management
  // ─────────────────────────────────────────────────────────────────

  @Get('cohorts')
  async listCohorts(
    @Query('q') q?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    const offset = offsetRaw ? parseInt(offsetRaw, 10) : 0;
    return this.adminService.listCohorts({ q, limit, offset });
  }

  @Post('cohorts')
  async createCohort(
    @CurrentUser() admin: { id: string },
    @Body() body: {
      name: string;
      slug: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      capacity?: number;
      isPublic?: boolean;
    },
  ) {
    const cohort = await this.adminService.createCohort({ adminId: admin.id, ...body });
    return { cohort };
  }

  @Patch('cohorts/:cohortId')
  async updateCohort(
    @CurrentUser() admin: { id: string },
    @Param('cohortId') cohortId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const cohort = await this.adminService.updateCohort({ adminId: admin.id, cohortId, data: body });
    return { cohort };
  }

  @Delete('cohorts/:cohortId')
  async deleteCohort(
    @CurrentUser() admin: { id: string },
    @Param('cohortId') cohortId: string,
  ) {
    await this.adminService.deleteCohort({ adminId: admin.id, cohortId });
    return { success: true };
  }

  @Post('cohorts/:cohortId/members')
  async addCohortMember(
    @CurrentUser() admin: { id: string },
    @Param('cohortId') cohortId: string,
    @Body() body: { userId: string; role?: string },
  ) {
    await this.adminService.addCohortMember({ adminId: admin.id, cohortId, userId: body.userId, role: body.role });
    return { success: true };
  }

  @Delete('cohorts/:cohortId/members/:userId')
  async removeCohortMember(
    @CurrentUser() admin: { id: string },
    @Param('cohortId') cohortId: string,
    @Param('userId') userId: string,
  ) {
    await this.adminService.removeCohortMember({ adminId: admin.id, cohortId, userId });
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // Reports listing (needed by frontend moderation queue)
  // ─────────────────────────────────────────────────────────────────

  @Get('reports')
  async listReports(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    const offset = offsetRaw ? parseInt(offsetRaw, 10) : 0;
    return this.adminService.listReports({ status, type, limit, offset });
  }

  @Patch('users/:userId/moderation')
  async updateUserModeration(
    @CurrentUser() admin: { id: string },
    @Param('userId') userId: string,
    @Body() body: { status: 'active' | 'suspended' | 'banned'; reason?: string },
  ) {
    await this.adminService.updateUserModerationStatus({ adminId: admin.id, userId, status: body.status, reason: body.reason });
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // Reports / Moderation
  // ─────────────────────────────────────────────────────────────────

  @Post('reports/:reportId/resolve')
  async resolveReport(
    @CurrentUser() admin: { id: string },
    @Param('reportId') reportId: string,
    @Body() body: { resolution: 'resolved' | 'dismissed'; note?: string; banUser?: boolean },
  ) {
    await this.adminService.resolveReport({
      adminId: admin.id,
      reportId,
      resolution: body.resolution,
      note: body.note,
      banUser: body.banUser,
    });
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────
  // Audit Log
  // ─────────────────────────────────────────────────────────────────

  @Get('audit-logs')
  async listAuditLogs(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    const offset = offsetRaw ? parseInt(offsetRaw, 10) : 0;
    return this.auditService.list({ actorId, action, entityType, limit, offset });
  }
}

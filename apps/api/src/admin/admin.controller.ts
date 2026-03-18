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
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { MailerService } from '../mailer/mailer.service';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AdminAuditService,
    private readonly mailer: MailerService,
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
  // Email Template Preview & Test Send
  // ─────────────────────────────────────────────────────────────────

  @Get('email-templates')
  listEmailTemplates() {
    return {
      templates: [
        { id: 'welcome', name: 'Welcome Email', description: 'Sent on successful registration' },
        { id: 'connection_request', name: 'Connection Request', description: 'Sent when someone requests to connect' },
        { id: 'connection_accepted', name: 'Connection Accepted', description: 'Sent when a connection is accepted' },
        { id: 'new_message', name: 'New Message', description: 'Sent when a new message arrives' },
        { id: 'session_reminder', name: 'Session Reminder', description: 'Sent 24h before a mentor session' },
        { id: 'weekly_digest', name: 'Weekly Digest', description: 'Personalized weekly recommendations' },
        { id: 'password_reset', name: 'Password Reset', description: 'Sent on password reset request' },
      ],
    };
  }

  @Get('email-templates/:templateId/preview')
  previewEmailTemplate(@Param('templateId') templateId: string) {
    const templates: Record<string, { subject: string; html: string }> = {
      welcome: {
        subject: 'Welcome to CoFounderBay!',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h1 style="color:#5b6ef5">Welcome to CoFounderBay!</h1>
  <p>Your account has been created. Start exploring founders, mentors, and investors.</p>
  <a href="{{FRONTEND_URL}}/discover" style="background:#5b6ef5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Explore Now</a>
</div>`,
      },
      connection_request: {
        subject: '{{SENDER_NAME}} wants to connect with you',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h2>New Connection Request</h2>
  <p><strong>{{SENDER_NAME}}</strong> ({{SENDER_ROLE}}) wants to connect with you on CoFounderBay.</p>
  <a href="{{FRONTEND_URL}}/connections" style="background:#5b6ef5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">View Request</a>
</div>`,
      },
      weekly_digest: {
        subject: 'Your weekly founder recommendations',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h2>People you should meet this week</h2>
  <p>Based on your profile and activity, here are this week's top matches:</p>
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
    <strong>{{MATCH_NAME}}</strong> — {{MATCH_ROLE}}<br/>
    <span style="color:#6b7280">{{MATCH_REASON}}</span>
  </div>
  <a href="{{FRONTEND_URL}}/discover" style="background:#5b6ef5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">See All Matches</a>
</div>`,
      },
      password_reset: {
        subject: 'Reset your CoFounderBay password',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h2>Password Reset</h2>
  <p>Click the link below to reset your password. This link expires in 1 hour.</p>
  <a href="{{RESET_URL}}" style="background:#5b6ef5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">Reset Password</a>
  <p style="color:#6b7280;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
</div>`,
      },
    };
    const tpl = templates[templateId];
    if (!tpl) throw new BadRequestException(`Unknown template: ${templateId}`);
    return tpl;
  }

  @Post('email-templates/:templateId/test-send')
  async testSendEmail(
    @Param('templateId') templateId: string,
    @Body() body: { to: string },
  ) {
    if (!body.to) throw new BadRequestException('Recipient email required');
    if (!this.mailer.isEnabled()) {
      return { sent: false, reason: 'Email not configured (SMTP settings missing)' };
    }
    const templates: Record<string, { subject: string; html: string }> = {
      welcome: { subject: '[TEST] Welcome to CoFounderBay!', html: '<h1>Welcome!</h1><p>This is a test email.</p>' },
      weekly_digest: { subject: '[TEST] Weekly digest', html: '<h1>Weekly Digest</h1><p>Test email.</p>' },
    };
    const tpl = templates[templateId] ?? { subject: `[TEST] ${templateId}`, html: `<p>Test for template: ${templateId}</p>` };
    await this.mailer.sendEmail({ to: body.to, subject: tpl.subject, html: tpl.html });
    return { sent: true, to: body.to };
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

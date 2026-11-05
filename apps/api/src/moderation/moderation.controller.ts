import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ReportStatus, ReportType, UserModerationStatus } from '@prisma/client';
import { z } from 'zod';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ModerationService } from './moderation.service';

const createReportSchema = z.object({
  reportedId: z.string().uuid(),
  type: z.nativeEnum(ReportType),
  reason: z.string().trim().min(8).max(3000),
  context: z.unknown().optional(),
});

// An unknown status or type is a 400, not a database error. Numbers outside
// the range are clamped by the service, as before.
const listReportsQuerySchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  type: z.nativeEnum(ReportType).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().optional(),
  offset: z.coerce.number().int().optional(),
});

const updateReportSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  moderationStatus: z.nativeEnum(UserModerationStatus).optional(),
});


@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly moderation: ModerationService) {}

  @Post()
  async createReport(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const input = createReportSchema.parse(body);
    const report = await this.moderation.createReport({
      reporterId: user.id,
      reportedId: input.reportedId,
      type: input.type,
      reason: input.reason,
      context: input.context,
    });
    return { report };
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ModerationAdminController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('reports')
  async listReports(@Query() query: unknown) {
    const input = listReportsQuerySchema.parse(query);
    return this.moderation.listReports({
      status: input.status,
      type: input.type,
      q: input.q?.trim() || undefined,
      limit: input.limit,
      offset: input.offset,
    });
  }

  @Patch('reports/:reportId')
  async updateReport(
    @CurrentUser() user: { id: string },
    @Param('reportId') reportId: string,
    @Body() body: unknown,
  ) {
    const input = updateReportSchema.parse(body);
    const report = await this.moderation.updateReportStatus({
      reportId,
      resolverId: user.id,
      status: input.status,
      moderationStatus: input.moderationStatus,
    });
    return { report };
  }
}

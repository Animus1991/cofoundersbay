import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FundraisingService } from './fundraising.service';
import { createLeadSchema, createRoundSchema, documentFieldsSchema, updateDocumentSchema, updateLeadSchema, updateRoundSchema } from './fundraising.schemas';

type Me = { id: string };

/** Each write answers with the whole state, so the page never shows a mix of old and new. */
@Controller('fundraising')
@UseGuards(JwtAuthGuard)
export class FundraisingController {
  constructor(private readonly fundraising: FundraisingService) {}

  @Get()
  state(@CurrentUser() user: Me) {
    return this.fundraising.state(user.id);
  }

  @Post('rounds')
  createRound(@CurrentUser() user: Me, @Body() body: unknown) {
    return this.fundraising.createRound(user.id, createRoundSchema.parse(body));
  }

  @Patch('rounds/:id')
  updateRound(@CurrentUser() user: Me, @Param('id') id: string, @Body() body: unknown) {
    return this.fundraising.updateRound(user.id, id, updateRoundSchema.parse(body));
  }

  @Post('leads')
  createLead(@CurrentUser() user: Me, @Body() body: unknown) {
    return this.fundraising.createLead(user.id, createLeadSchema.parse(body));
  }

  @Patch('leads/:id')
  updateLead(@CurrentUser() user: Me, @Param('id') id: string, @Body() body: unknown) {
    return this.fundraising.updateLead(user.id, id, updateLeadSchema.parse(body));
  }

  @Delete('leads/:id')
  removeLead(@CurrentUser() user: Me, @Param('id') id: string) {
    return this.fundraising.removeLead(user.id, id);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  addDocument(@CurrentUser() user: Me, @UploadedFile() file: Express.Multer.File | undefined, @Body() body: unknown) {
    return this.fundraising.addDocument(user.id, file, documentFieldsSchema.parse(body ?? {}));
  }

  @Patch('documents/:id')
  updateDocument(@CurrentUser() user: Me, @Param('id') id: string, @Body() body: unknown) {
    return this.fundraising.updateDocument(user.id, id, updateDocumentSchema.parse(body));
  }

  @Delete('documents/:id')
  removeDocument(@CurrentUser() user: Me, @Param('id') id: string) {
    return this.fundraising.removeDocument(user.id, id);
  }

  /** Always a download, under a policy that keeps anything active inert. */
  @Get('documents/:id/file')
  async openDocument(
    @CurrentUser() user: Me,
    @Param('id') id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.fundraising.openDocument(user.id, id, {
      ipAddress: req.ip ?? null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.buffer);
  }
}

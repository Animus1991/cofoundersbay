import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { FundraisingService } from './fundraising.service';

/**
 * What a link opens, for someone without an account. No guard on purpose: the
 * token is the permission. Throttled, because a token can be guessed at.
 */
@Controller('public/data-room')
@Throttle({ default: { ttl: 60000, limit: 30 } })
export class DataRoomLinkController {
  constructor(private readonly fundraising: FundraisingService) {}

  @Get(':token')
  read(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    return this.fundraising.readRoomLink(token);
  }

  /** Always a download, under the same policy as the signed-in route. */
  @Get(':token/documents/:id/file')
  async open(@Param('token') token: string, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const file = await this.fundraising.openRoomLinkFile(token, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    return new StreamableFile(file.buffer);
  }
}

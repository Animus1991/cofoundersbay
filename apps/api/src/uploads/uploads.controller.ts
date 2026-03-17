import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';

function safeExt(originalName: string): string {
  const ext = extname(originalName || '').toLowerCase();
  if (!ext || ext.length > 10) return '';
  return ext;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer) return { ok: false };

    const ext = safeExt(file.originalname);
    const filename = `avatar_${Date.now()}_${randomBytes(8).toString('hex')}${ext}`;

    const stored = await this.uploads.storeFile({
      buffer: file.buffer,
      filename,
      mimeType: file.mimetype || 'application/octet-stream',
    });

    const upload = await this.uploads.createUploadRecord({
      userId: user.id,
      kind: 'avatar',
      key: stored.key,
      url: stored.url,
      mimeType: file.mimetype ?? null,
      originalName: file.originalname ?? null,
      sizeBytes: file.size ?? null,
    });

    return { upload };
  }

  @Post('message-attachment')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  async uploadMessageAttachment(
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer) return { ok: false };

    const ext = safeExt(file.originalname);
    const filename = `msg_${Date.now()}_${randomBytes(8).toString('hex')}${ext}`;

    const stored = await this.uploads.storeFile({
      buffer: file.buffer,
      filename,
      mimeType: file.mimetype || 'application/octet-stream',
    });

    const upload = await this.uploads.createUploadRecord({
      userId: user.id,
      kind: 'message_attachment',
      key: stored.key,
      url: stored.url,
      mimeType: file.mimetype ?? null,
      originalName: file.originalname ?? null,
      sizeBytes: file.size ?? null,
    });

    return { upload };
  }
}


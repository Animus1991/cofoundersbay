import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';

function getUploadsDir(): string {
  const dir = resolve(__dirname, '..', '..', 'uploads');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function safeExt(originalName: string): string {
  const ext = extname(originalName || '').toLowerCase();
  if (!ext || ext.length > 10) return '';
  return ext;
}

@Controller('v1/uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) =>
          cb(null, getUploadsDir()),
        filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ext = safeExt(file.originalname);
          const name = `avatar_${Date.now()}_${randomBytes(8).toString('hex')}${ext}`;
          cb(null, name);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) return { ok: false };

    const key = file.filename;
    const urlPath = `/uploads/${file.filename}`;

    const upload = await this.uploads.createUploadRecord({
      userId: user.id,
      kind: 'avatar',
      key,
      urlPath,
      mimeType: file.mimetype ?? null,
      originalName: file.originalname ?? null,
      sizeBytes: file.size ?? null,
    });

    return { upload };
  }

  @Post('message-attachment')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) =>
          cb(null, getUploadsDir()),
        filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ext = safeExt(file.originalname);
          const name = `msg_${Date.now()}_${randomBytes(8).toString('hex')}${ext}`;
          cb(null, name);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  async uploadMessageAttachment(
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) return { ok: false };

    const key = file.filename;
    const urlPath = `/uploads/${file.filename}`;

    const upload = await this.uploads.createUploadRecord({
      userId: user.id,
      kind: 'message_attachment',
      key,
      urlPath,
      mimeType: file.mimetype ?? null,
      originalName: file.originalname ?? null,
      sizeBytes: file.size ?? null,
    });

    return { upload };
  }
}


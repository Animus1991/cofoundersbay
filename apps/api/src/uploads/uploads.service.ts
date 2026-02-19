import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private apiBaseUrl(): string {
    return (
      this.config.get<string>('API_URL') ||
      `http://localhost:${this.config.get<string>('API_PORT') ?? 3001}`
    );
  }

  async createUploadRecord(params: {
    userId: string;
    kind: UploadKind;
    key: string;
    urlPath: string; // e.g. /uploads/<file>
    mimeType?: string | null;
    originalName?: string | null;
    sizeBytes?: number | null;
  }) {
    const url = `${this.apiBaseUrl()}${params.urlPath}`;
    const upload = await this.prisma.upload.create({
      data: {
        userId: params.userId,
        kind: params.kind,
        key: params.key,
        url,
        mimeType: params.mimeType ?? null,
        originalName: params.originalName ?? null,
        sizeBytes: params.sizeBytes ?? null,
      },
      select: {
        id: true,
        userId: true,
        kind: true,
        key: true,
        url: true,
        mimeType: true,
        originalName: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return upload;
  }
}


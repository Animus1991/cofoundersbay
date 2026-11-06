import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from 'fs';
import { basename, resolve } from 'path';

export type StoredFile = {
  key: string;
  url: string;
  provider: 's3' | 'local';
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly useS3: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.useS3 = !!(config.get('AWS_S3_BUCKET') && config.get('AWS_ACCESS_KEY_ID') && config.get('AWS_SECRET_ACCESS_KEY'));
    if (this.useS3) {
      this.logger.log('Storage provider: AWS S3');
    } else {
      this.logger.log('Storage provider: local disk (set AWS_S3_BUCKET + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY to use S3)');
    }
  }

  private apiBaseUrl(): string {
    return (
      this.config.get<string>('API_URL') ||
      `http://localhost:${this.config.get<string>('API_PORT') ?? 3001}`
    );
  }

  private getUploadsDir(): string {
    const dir = resolve(__dirname, '..', '..', 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  /** Beside `uploads/`, never under it: `main.ts` serves that folder to anyone with the URL. */
  private getPrivateDir(): string {
    const dir = resolve(__dirname, '..', '..', 'private-uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  /** A stored name, not a path: nothing from a request can step out of the folder. */
  private privateName(key: string): string {
    const name = key.replace(/^private\//, '');
    if (!/^[A-Za-z0-9_.-]+$/.test(name) || name.startsWith('.')) throw new Error('Invalid private file key');
    return name;
  }

  private s3Client() {
    const region = this.config.get<string>('AWS_REGION') || 'us-east-1';
    const customEndpoint = this.config.get<string>('AWS_S3_ENDPOINT');
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const sdk = require('@aws-sdk/client-s3') as any;
    const client = new sdk.S3Client({
      region,
      credentials: { accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!, secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')! },
      ...(customEndpoint ? { endpoint: customEndpoint, forcePathStyle: true } : {}),
    });
    return { client, sdk, bucket: this.config.get<string>('AWS_S3_BUCKET')! };
  }

  /**
   * Files that must never have a public URL (the data room, docs §111). They
   * come back only through `readPrivateFile`, behind the caller's own access
   * check. On S3 they sit under `private/`: a bucket policy that opens
   * `uploads/` to the CDN must not open this prefix.
   */
  async storePrivateFile(params: { buffer: Buffer; filename: string; mimeType: string }): Promise<{ key: string }> {
    const name = this.privateName(params.filename);
    if (this.useS3) {
      const { client, sdk, bucket } = this.s3Client();
      const key = `private/${name}`;
      await client.send(new sdk.PutObjectCommand({ Bucket: bucket, Key: key, Body: params.buffer, ContentType: params.mimeType, ContentDisposition: 'attachment' }));
      return { key };
    }
    writeFileSync(`${this.getPrivateDir()}/${name}`, params.buffer);
    return { key: name };
  }

  async readPrivateFile(key: string): Promise<Buffer> {
    const name = this.privateName(key);
    if (this.useS3) {
      const { client, sdk, bucket } = this.s3Client();
      const object = await client.send(new sdk.GetObjectCommand({ Bucket: bucket, Key: `private/${name}` }));
      return Buffer.from(await object.Body.transformToByteArray());
    }
    return readFileSync(`${this.getPrivateDir()}/${name}`);
  }

  async deletePrivateFile(key: string): Promise<void> {
    const name = this.privateName(key);
    if (this.useS3) {
      const { client, sdk, bucket } = this.s3Client();
      await client.send(new sdk.DeleteObjectCommand({ Bucket: bucket, Key: `private/${name}` }));
      return;
    }
    const path = `${this.getPrivateDir()}/${name}`;
    if (existsSync(path)) unlinkSync(path);
  }

  /** A public upload, by the key `storeFile` returned: `uploads/…` on S3, the bare name on disk. */
  async deletePublicFile(key: string): Promise<void> {
    if (this.useS3) {
      const { client, sdk, bucket } = this.s3Client();
      await client.send(new sdk.DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return;
    }
    const path = `${this.getUploadsDir()}/${basename(key)}`;
    if (existsSync(path)) unlinkSync(path);
  }

  async storeFile(params: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<StoredFile> {
    if (this.useS3) {
      return this.storeToS3(params);
    }
    return this.storeToDisk(params);
  }

  private async storeToS3(params: { buffer: Buffer; filename: string; mimeType: string }): Promise<StoredFile> {
    const bucket = this.config.get<string>('AWS_S3_BUCKET')!;
    const region = this.config.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')!;
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY')!;
    const customEndpoint = this.config.get<string>('AWS_S3_ENDPOINT');

    // Dynamic import — @aws-sdk/client-s3 is optional; only required when AWS env vars are set
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3') as any;

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(customEndpoint ? { endpoint: customEndpoint, forcePathStyle: true } : {}),
    });

    const key = `uploads/${params.filename}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.mimeType,
      ContentDisposition: params.mimeType.startsWith('image/') ? 'inline' : 'attachment',
    }));

    const cdnBase = this.config.get<string>('AWS_CDN_URL') || `https://${bucket}.s3.${region}.amazonaws.com`;
    const url = `${cdnBase}/${key}`;
    this.logger.log(`Stored to S3: ${url}`);
    return { key, url, provider: 's3' };
  }

  private storeToDisk(params: { buffer: Buffer; filename: string; mimeType: string }): StoredFile {
    const dir = this.getUploadsDir();
    const filePath = `${dir}/${params.filename}`;
    writeFileSync(filePath, params.buffer);
    const urlPath = `/uploads/${params.filename}`;
    const url = `${this.apiBaseUrl()}${urlPath}`;
    return { key: params.filename, url, provider: 'local' };
  }

  async createUploadRecord(params: {
    userId: string;
    kind: UploadKind;
    key: string;
    url: string;
    mimeType?: string | null;
    originalName?: string | null;
    sizeBytes?: number | null;
  }) {
    const upload = await this.prisma.upload.create({
      data: {
        userId: params.userId,
        kind: params.kind,
        key: params.key,
        url: params.url,
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


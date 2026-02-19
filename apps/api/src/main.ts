import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma.exception-filter';
import { ZodExceptionFilter } from './common/filters/zod.exception-filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  
  // Serve uploaded files (local dev storage)
  app.useStaticAssets(resolve(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Parse CORS origins from environment or use defaults (never leave empty so preflight gets Allow-Origin)
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    'http://192.168.1.2:3000',
    'http://192.168.1.2:3002',
  ];
  const corsOriginEnv = process.env.CORS_ORIGIN?.trim();
  const parsed = corsOriginEnv ? corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean) : [];
  const origins = parsed.length > 0 ? parsed : defaultOrigins;

  console.log('[CORS] Allowed origins:', origins);

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  });
  
  app.useGlobalFilters(new HttpExceptionFilter(), new ZodExceptionFilter(), new PrismaExceptionFilter());
  app.setGlobalPrefix('api');
  
  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`CoFounderBay API running at http://localhost:${port}/api`);
  console.log(`[ENV] DATABASE_URL=${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`[ENV] JWT_ACCESS_SECRET=${process.env.JWT_ACCESS_SECRET ? 'SET' : 'NOT SET'}`);
}
bootstrap();

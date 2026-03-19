// Sentry must be initialised before NestFactory to instrument the full request lifecycle.
// We use a guarded dynamic require so the app still boots if the package is not yet installed.
if (process.env.SENTRY_DSN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const Sentry: any = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeSend(event: any) {
        if (event.request?.cookies) delete event.request.cookies;
        if (event.request?.headers?.authorization) delete event.request.headers.authorization;
        return event;
      },
    });
  } catch {
    console.warn('[Sentry] @sentry/node not installed — skipping Sentry init. Run `npm install` to enable.');
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { requestIdMiddleware } from './common/filters/http-exception.filter';
import appConfig from './common/config/app.config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  
  // Get configuration
  const config = app.get(appConfig.KEY);
  
  // Serve uploaded files (local dev storage)
  app.useStaticAssets(resolve(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Security & parsing middleware
  app.use(cookieParser());
  app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // Apply global middleware
  app.use(requestIdMiddleware);
  // Note: PerformanceMiddleware is applied via NestJS module, not here

  // CORS configuration
  console.log('[CORS] Allowed origins:', config.cors.origin);
  app.enableCors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-ID', 'X-CSRF-Token'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  });

  // Global pipes and interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error if non-whitelisted values are provided
      transform: true, // Transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types
      },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Redirect bare root GET / → frontend (prevents confusing JSON 404 when devs open :3001)
  const frontendOrigin = (config.cors.origin as string[])?.[0] ?? 'http://localhost:3000';
  app.use((req: any, res: any, next: any) => {
    if (req.path === '/' && req.method === 'GET') {
      res.redirect(302, frontendOrigin);
      return;
    }
    next();
  });

  // API prefix
  app.setGlobalPrefix(config.apiPrefix);
  
  // Health check endpoint
  app.getHttpServer().on('listening', () => {
    console.log(`🚀 CoFounderBay API running at http://localhost:${config.port}/${config.apiPrefix}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Database: ${config.database.url ? 'CONNECTED' : 'NOT CONFIGURED'}`);
    console.log(`🔐 JWT: ${config.jwt.accessTokenSecret ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
    console.log(`📧 Email: ${config.email.provider} (${config.email.from})`);
    console.log(`🔍 Search: ${config.search.host}:${config.search.port}`);
    console.log(`💾 Redis: ${config.redis.host}:${config.redis.port}`);
    console.log(`📁 Storage: ${config.storage.provider}`);
    console.log(`📈 Monitoring: ${config.monitoring.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🚀 Features: ${JSON.stringify(config.features)}`);
  });

  await app.listen(config.port).catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n❌ Port ${config.port} is already in use.\n` +
        `   Another API process is likely running.\n` +
        `   Kill it first:  taskkill /F /PID $(netstat -ano | findstr :${config.port})\n` +
        `   Or set a different port:  PORT=3002 npm run start:dev\n`,
      );
      process.exit(1);
    }
    throw err;
  });
}
bootstrap();

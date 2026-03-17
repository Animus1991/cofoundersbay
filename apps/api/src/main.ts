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

  await app.listen(config.port);
}
bootstrap();

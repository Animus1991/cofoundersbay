import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve, join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { SearchModule } from './search/search.module';
import { MessagingModule } from './messaging/messaging.module';
import { UploadsModule } from './uploads/uploads.module';
import { MailerModule } from './mailer/mailer.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BillingModule } from './billing/billing.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { MentoringModule } from './mentoring/mentoring.module';
import { ModerationModule } from './moderation/moderation.module';

// Find the monorepo root .env file
function findEnvFiles(): string[] {
  const paths: string[] = [];
  // Current working directory
  paths.push(resolve(process.cwd(), '.env'));
  // One level up (for running from apps/api)
  paths.push(resolve(process.cwd(), '..', '.env'));
  // Two levels up (for running from apps/api/src)
  paths.push(resolve(process.cwd(), '..', '..', '.env'));
  // Absolute path based on __dirname (most reliable)
  paths.push(resolve(__dirname, '..', '..', '..', '..', '.env'));
  return paths;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: findEnvFiles(),
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    SearchModule,
    MessagingModule,
    UploadsModule,
    MailerModule,
    NotificationsModule,
    BillingModule,
    HealthModule,
    EventsModule,
    MentoringModule,
    ModerationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

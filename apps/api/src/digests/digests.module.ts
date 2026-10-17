import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailDigestService } from './email-digest.service';
import { DigestsController } from './digests.controller';
import { MailerModule } from '../mailer/mailer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [ConfigModule, MailerModule, PrismaModule, MatchingModule],
  providers: [EmailDigestService],
  controllers: [DigestsController],
  exports: [EmailDigestService],
})
export class DigestsModule {}

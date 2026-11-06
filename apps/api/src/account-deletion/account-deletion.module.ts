import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule, MailerModule],
  controllers: [AccountDeletionController],
  providers: [AccountDeletionService],
})
export class AccountDeletionModule {}

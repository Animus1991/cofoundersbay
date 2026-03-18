import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';

@Module({
  imports: [PrismaModule, MailerModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditService],
  exports: [AdminService, AdminAuditService],
})
export class AdminModule {}

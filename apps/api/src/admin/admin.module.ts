import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, HealthController],
  providers: [AdminService, AdminAuditService],
  exports: [AdminService, AdminAuditService],
})
export class AdminModule {}

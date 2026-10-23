import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { ProgramService } from './program.service';
import { ProgramController } from './program.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrganizationInvitationsService } from './organization-invitations.service';
import { OrganizationInvitationsController } from './organization-invitations.controller';

@Module({
  imports: [PrismaModule, ConfigModule, MailerModule, NotificationsModule],
  controllers: [OrganizationController, ProgramController, OrganizationInvitationsController],
  providers: [OrganizationService, ProgramService, OrganizationInvitationsService],
  exports: [OrganizationService, ProgramService],
})
export class OrganizationModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ProfileViewersController } from './profile-viewers.controller';
import { ProfileViewersService } from './profile-viewers.service';

@Module({
  imports: [PrismaModule, AuthModule, AnalyticsModule],
  controllers: [ProfileViewersController],
  providers: [ProfileViewersService],
})
export class ProfileViewersModule {}

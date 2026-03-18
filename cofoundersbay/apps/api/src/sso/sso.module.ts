import { Module } from '@nestjs/common';
import { SSOService } from './sso.service';
import { SSOController } from './sso.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SSOController],
  providers: [SSOService],
  exports: [SSOService],
})
export class SSOModule {}

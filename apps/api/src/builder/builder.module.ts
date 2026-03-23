import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { BuilderAIService } from './builder-ai.service';
import { BuilderOrgService } from './builder-org.service';
import { BuilderGateway } from './builder.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [BuilderController],
  providers: [BuilderService, BuilderAIService, BuilderOrgService, BuilderGateway],
  exports: [BuilderService, BuilderAIService, BuilderOrgService, BuilderGateway],
})
export class BuilderModule {}

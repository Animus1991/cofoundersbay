import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from '../search/search.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule, SearchModule],
  controllers: [HealthController],
})
export class HealthModule {}


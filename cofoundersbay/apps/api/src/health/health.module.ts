import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from '../search/search.module';
import { HealthController } from './health.controller';
import { ProductionHealthController } from './production-health.controller';

@Module({
  imports: [ConfigModule, SearchModule],
  controllers: [HealthController, ProductionHealthController],
})
export class HealthModule {}


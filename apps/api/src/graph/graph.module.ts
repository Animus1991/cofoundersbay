import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';

@Module({
  imports: [PrismaModule, DashboardModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}

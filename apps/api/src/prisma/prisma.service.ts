import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const DB_CONNECT_RETRIES = 5;
const DB_CONNECT_DELAY_MS = 2_000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    for (let attempt = 1; attempt <= DB_CONNECT_RETRIES; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Database connected on attempt ${attempt}.`);
        }
        return;
      } catch (err) {
        const isLast = attempt === DB_CONNECT_RETRIES;
        this.logger.warn(
          `Database connection attempt ${attempt}/${DB_CONNECT_RETRIES} failed: ${err instanceof Error ? err.message : String(err)}` +
          (isLast ? ' — giving up.' : ` — retrying in ${DB_CONNECT_DELAY_MS / 1000}s...`),
        );
        if (isLast) throw err;
        await new Promise((r) => setTimeout(r, DB_CONNECT_DELAY_MS));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

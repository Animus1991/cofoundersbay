import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import { MailerService, type SendEmailParams } from './mailer.service';

@Injectable()
export class EmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailQueueService.name);
  private queue: Queue<SendEmailParams, void, 'sendEmail'> | null = null;
  private worker: Worker<SendEmailParams, void, 'sendEmail'> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) return;

    this.queue = new Queue<SendEmailParams, void, 'sendEmail'>('email', {
      connection: {
        url: redisUrl,
        maxRetriesPerRequest: null,
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    this.worker = new Worker<SendEmailParams, void, 'sendEmail'>(
      'email',
      async (job) => {
        if (!this.mailer.isEnabled()) return;
        await this.mailer.sendEmail(job.data);
      },
      {
        connection: {
          url: redisUrl,
          maxRetriesPerRequest: null,
        },
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Email job failed (${job?.id ?? 'unknown'}): ${err.message}`, err.stack);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  async enqueueSendEmail(params: SendEmailParams): Promise<void> {
    if (!this.mailer.isEnabled()) return;

    if (!this.queue) {
      await this.mailer.sendEmail(params);
      return;
    }

    await this.queue.add('sendEmail', params);
  }
}


import { BadRequestException, Injectable } from '@nestjs/common';
import type { AssistantFeedbackReason } from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';

/** The chat's message ids: short, and nothing that could carry text. */
const ANSWER_ID = /^[A-Za-z0-9_.:-]{1,128}$/;

/**
 * A member's 👍 or 👎 on one assistant answer (docs §54.7 #5, §111).
 *
 * One row per member and answer, so pressing the other thumb changes the
 * verdict and clearing it removes the row. A reason belongs to a 👎 only. The
 * question and the answer are never stored; the transparency report counts
 * these rows per half year.
 */
@Injectable()
export class AnswerFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  private answerId(answerId: string): string {
    if (!ANSWER_ID.test(answerId)) throw new BadRequestException('answerId is not valid');
    return answerId;
  }

  async set(userId: string, answerId: string, input: { helpful: boolean; reason?: AssistantFeedbackReason; source?: string }) {
    const id = this.answerId(answerId);
    const fields = { helpful: input.helpful, reason: input.helpful ? null : (input.reason ?? null), source: input.source ?? null };
    const row = await this.prisma.assistantAnswerFeedback.upsert({
      where: { userId_answerId: { userId, answerId: id } },
      create: { userId, answerId: id, ...fields },
      update: fields,
    });
    return { answerId: row.answerId, helpful: row.helpful, reason: row.reason };
  }

  async clear(userId: string, answerId: string) {
    await this.prisma.assistantAnswerFeedback.deleteMany({ where: { userId, answerId: this.answerId(answerId) } });
    return { ok: true };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import {
  COMPAT_QUESTIONS,
  answeredCount,
  cleanCompatAnswers,
  compareCompatAnswers,
  mergeCompatAnswers,
  readCompatAnswers,
  type CompatAnswers,
} from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The compatibility questions (`packages/shared/src/compatibility`).
 *
 * Answers live in the schema-only `UserPreference.workStyle` as
 * `{ compat: {...} }` (`prisma db push`), the column the schema already named
 * for work style. `riskTolerance` and `remotePreference`, which nothing wrote,
 * follow the matching answers so other readers of the row see the same thing.
 * Another member only ever receives the comparison, never the answers.
 */
@Injectable()
export class CompatibilityService {
  constructor(private readonly prisma: PrismaService) {}

  private async answersOf(userId: string): Promise<{ answers: CompatAnswers; listed: boolean }> {
    const row = await this.prisma.userPreference.findUnique({
      where: { userId },
      select: { workStyle: true, showInMatching: true },
    });
    const style = (row?.workStyle ?? null) as { compat?: unknown } | null;
    return { answers: cleanCompatAnswers(style?.compat), listed: row?.showInMatching !== false };
  }

  async mine(userId: string) {
    const { answers } = await this.answersOf(userId);
    return { answers, answered: answeredCount(answers), total: COMPAT_QUESTIONS.length };
  }

  async save(userId: string, body: unknown) {
    const raw = (body && typeof body === 'object' && 'answers' in (body as object) ? (body as { answers: unknown }).answers : body) ?? {};
    const read = readCompatAnswers(raw);
    if (!read.ok) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: read.reason.en, details: { reason: 'compat_invalid', field: read.field, messageEl: read.reason.el } },
      });
    }
    const row = await this.prisma.userPreference.findUnique({ where: { userId }, select: { workStyle: true } });
    const style = (row?.workStyle && typeof row.workStyle === 'object' && !Array.isArray(row.workStyle) ? row.workStyle : {}) as Record<string, unknown>;
    const answers = mergeCompatAnswers(cleanCompatAnswers(style.compat), read.value);
    const mirrored = {
      riskTolerance: answers.risk ?? null,
      remotePreference: answers.place === 'same_city' ? 'onsite' : answers.place ?? null,
    };
    const workStyle = { ...style, compat: answers };
    await this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, workStyle, ...mirrored },
      update: { workStyle, ...mirrored },
    });
    return { answers, answered: answeredCount(answers), total: COMPAT_QUESTIONS.length };
  }

  /** The comparison with another member: agreement per shared question, never their answers. */
  async withUser(userId: string, otherId: string) {
    if (userId === otherId) {
      throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Compare with someone else.', details: { reason: 'compat_self', messageEl: 'Συγκρίνετε με κάποιον άλλον.' } } });
    }
    const [mine, theirs] = await Promise.all([this.answersOf(userId), this.answersOf(otherId)]);
    if (!theirs.listed) return { available: false as const, answeredByYou: answeredCount(mine.answers) };
    return {
      available: true as const,
      answeredByYou: answeredCount(mine.answers),
      answeredByThem: answeredCount(theirs.answers),
      ...compareCompatAnswers(mine.answers, theirs.answers),
    };
  }
}

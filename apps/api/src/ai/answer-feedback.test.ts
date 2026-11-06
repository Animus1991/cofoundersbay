import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import { AnswerFeedbackService } from './answer-feedback.service';
import { SetAnswerFeedbackDto } from './dto/answer-feedback.dto';

/** 👍 or 👎 on an answer: one row per member and answer, and no text of any kind (docs §111). */

function setup() {
  const assistantAnswerFeedback = {
    upsert: vi.fn(async ({ create }: { create: Record<string, unknown> }) => create),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  };
  return { service: new AnswerFeedbackService({ assistantAnswerFeedback } as never), assistantAnswerFeedback };
}

describe('feedback on an assistant answer', () => {
  it('keeps one verdict per member and answer, so the other thumb changes it', async () => {
    const { service, assistantAnswerFeedback } = setup();
    await service.set('me', 'msg-1', { helpful: false, reason: 'unclear', source: 'builtin' });
    expect(assistantAnswerFeedback.upsert).toHaveBeenCalledWith({
      where: { userId_answerId: { userId: 'me', answerId: 'msg-1' } },
      create: { userId: 'me', answerId: 'msg-1', helpful: false, reason: 'unclear', source: 'builtin' },
      update: { helpful: false, reason: 'unclear', source: 'builtin' },
    });
  });

  it('drops a reason on a 👍, where it means nothing', async () => {
    const { service, assistantAnswerFeedback } = setup();
    await service.set('me', 'msg-1', { helpful: true, reason: 'wrong' });
    expect(assistantAnswerFeedback.upsert.mock.calls[0][0].update).toEqual({ helpful: true, reason: null, source: null });
  });

  it('clears only the member’s own verdict', async () => {
    const { service, assistantAnswerFeedback } = setup();
    await expect(service.clear('me', 'msg-1')).resolves.toEqual({ ok: true });
    expect(assistantAnswerFeedback.deleteMany).toHaveBeenCalledWith({ where: { userId: 'me', answerId: 'msg-1' } });
  });

  it('refuses an answer id that could carry text', async () => {
    const { service, assistantAnswerFeedback } = setup();
    await expect(service.set('me', 'what the member asked about salaries', { helpful: true })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.clear('me', 'x'.repeat(129))).rejects.toBeInstanceOf(BadRequestException);
    expect(assistantAnswerFeedback.upsert).not.toHaveBeenCalled();
  });

  it('takes a reason from the fixed list and an assistant name, nothing freer', () => {
    const errors = (body: Record<string, unknown>) => validateSync(plainToInstance(SetAnswerFeedbackDto, body)).length;
    expect(errors({ helpful: false, reason: 'not_what_i_asked', source: 'gemini-flash/1.5' })).toBe(0);
    expect(errors({ helpful: false, reason: 'it was rude to me' })).toBeGreaterThan(0);
    expect(errors({ helpful: true, source: 'a sentence with spaces' })).toBeGreaterThan(0);
    expect(errors({ helpful: 'yes' })).toBeGreaterThan(0);
  });
});

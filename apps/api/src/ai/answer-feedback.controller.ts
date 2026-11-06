import { Body, Controller, Delete, Param, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnswerFeedbackService } from './answer-feedback.service';
import { SetAnswerFeedbackDto } from './dto/answer-feedback.dto';

/** A 👍 or 👎 on one answer: the caller's last word on it (docs §111). */
@Controller('ai/answers')
@UseGuards(JwtAuthGuard)
export class AnswerFeedbackController {
  constructor(private readonly answerFeedback: AnswerFeedbackService) {}

  @Put(':answerId/feedback')
  set(@CurrentUser() user: { id: string }, @Param('answerId') answerId: string, @Body() dto: SetAnswerFeedbackDto) {
    return this.answerFeedback.set(user.id, answerId, dto);
  }

  @Delete(':answerId/feedback')
  clear(@CurrentUser() user: { id: string }, @Param('answerId') answerId: string) {
    return this.answerFeedback.clear(user.id, answerId);
  }
}

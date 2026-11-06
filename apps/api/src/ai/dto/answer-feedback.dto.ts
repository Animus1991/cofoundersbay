import { ASSISTANT_FEEDBACK_REASONS, type AssistantFeedbackReason } from '@cofounderbay/shared';
import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * `PUT /ai/answers/:answerId/feedback`. A reason comes from the fixed list and
 * `source` names the assistant, so nothing the member or the model wrote can
 * travel in here.
 */
export class SetAnswerFeedbackDto {
  @IsBoolean()
  helpful!: boolean;

  @IsOptional()
  @IsIn([...ASSISTANT_FEEDBACK_REASONS])
  reason?: AssistantFeedbackReason;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  @Matches(/^[A-Za-z0-9_.:/-]+$/)
  source?: string;
}

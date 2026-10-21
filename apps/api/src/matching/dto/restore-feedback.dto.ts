import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

/** The feedback values a match outcome can hold (`MatchFeedbackType`). */
export const MATCH_FEEDBACK_VALUES = ['accepted', 'declined', 'ignored', 'not_relevant', 'not_now', 'better_fit_wanted'] as const;

/** What a member's outcome for one person was before a feedback changed it. */
export class MatchOutcomeSnapshotDto {
  @IsIn(MATCH_FEEDBACK_VALUES as unknown as string[])
  feedback!: (typeof MATCH_FEEDBACK_VALUES)[number];

  @IsBoolean()
  connectionStarted!: boolean;

  @IsBoolean()
  conversationStarted!: boolean;
}

/**
 * `POST /recommendations/feedback/restore`: puts back exactly what one
 * `POST /recommendations/feedback` changed, from what that call answered
 * (`previous`, `signalId`). "Pass" on /matches and the assistant's
 * `unpass_match` use it for their Undo.
 */
export class RestoreMatchFeedbackDto {
  @IsString()
  @MaxLength(64)
  targetUserId!: string;

  /** The outcome before the feedback; absent or null when there was none. */
  @IsOptional()
  @ValidateNested()
  @Type(() => MatchOutcomeSnapshotDto)
  previous?: MatchOutcomeSnapshotDto | null;

  /** The behavioural signal the feedback wrote. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  signalId?: string;
}

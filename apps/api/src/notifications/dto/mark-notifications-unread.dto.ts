import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/** The most ids one undo can name: more than any inbox's unread pile in practice. */
export const MARK_UNREAD_MAX_IDS = 5000;

/** `POST /notifications/mark-unread`: the ids that a "mark all read" answered with. */
export class MarkNotificationsUnreadDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MARK_UNREAD_MAX_IDS)
  @IsString({ each: true })
  ids!: string[];
}

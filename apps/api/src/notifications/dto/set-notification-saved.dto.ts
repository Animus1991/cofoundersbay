import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

/** `PATCH /notifications/:id/saved`: keep the notification for later, or stop keeping it. */
export class SetNotificationSavedDto {
  // The raw value: the global pipe's implicit conversion turns any string, "false"
  // included, into true before this check sees it.
  @Transform(({ obj }) => (obj as { saved?: unknown }).saved)
  @IsBoolean()
  saved!: boolean;
}

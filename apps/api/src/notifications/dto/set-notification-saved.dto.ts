import { IsBoolean } from 'class-validator';

/** `PATCH /notifications/:id/saved`: keep the notification for later, or stop keeping it. */
export class SetNotificationSavedDto {
  @IsBoolean()
  saved!: boolean;
}

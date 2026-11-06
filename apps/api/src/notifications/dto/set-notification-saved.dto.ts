import { IsStrictBoolean } from '../../common/strict-boolean';

/** `PATCH /notifications/:id/saved`: keep the notification for later, or stop keeping it. */
export class SetNotificationSavedDto {
  @IsStrictBoolean()
  saved!: boolean;
}

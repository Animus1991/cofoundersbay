import { IsIn, IsOptional } from 'class-validator';
import { IsStrictBoolean } from '../../common/strict-boolean';

export const DIGEST_TYPES = ['daily', 'weekly', 'monthly'] as const;

export class SendTestDigestDto {
  @IsOptional()
  @IsIn(DIGEST_TYPES)
  type?: typeof DIGEST_TYPES[number];
}

export class UpdateDigestPreferencesDto {
  @IsOptional() @IsStrictBoolean() daily?: boolean;
  @IsOptional() @IsStrictBoolean() weekly?: boolean;
  @IsOptional() @IsStrictBoolean() monthly?: boolean;
  @IsOptional() @IsStrictBoolean() connections?: boolean;
  @IsOptional() @IsStrictBoolean() messages?: boolean;
  @IsOptional() @IsStrictBoolean() opportunities?: boolean;
  @IsOptional() @IsStrictBoolean() events?: boolean;
  @IsOptional() @IsStrictBoolean() updates?: boolean;
}

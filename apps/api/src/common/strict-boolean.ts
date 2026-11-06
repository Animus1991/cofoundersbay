import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

/**
 * `@IsBoolean()` for a request body. The global pipe's `enableImplicitConversion`
 * turns any string into `true` before validation, so `{ saved: 'false' }` passed
 * as true (docs §111). This hands the validator the raw value instead.
 * A boolean read from a query string, where `'true'` is legitimate, needs its
 * own parsing rather than this.
 */
export const IsStrictBoolean = () =>
  applyDecorators(
    Transform(({ obj, key }) => (obj as Record<string, unknown>)[key]),
    IsBoolean(),
  );

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { IsOptional } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { IsStrictBoolean } from './strict-boolean';

class Sample {
  @IsStrictBoolean()
  required!: boolean;

  @IsOptional()
  @IsStrictBoolean()
  optional?: boolean;
}

// The same options as main.ts: the conversion is what made strings pass.
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});
const run = (body: unknown) => pipe.transform(body, { type: 'body', metatype: Sample });

describe('a boolean in a request body', () => {
  it('keeps true and false', async () => {
    await expect(run({ required: true })).resolves.toMatchObject({ required: true });
    await expect(run({ required: false, optional: false })).resolves.toMatchObject({ required: false, optional: false });
  });

  it.each(['yes', 'false', 'true', 1, 0, null])('refuses %s', async (value) => {
    await expect(run({ required: value })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('leaves an optional one out', async () => {
    const dto = (await run({ required: true })) as Sample;
    expect(dto.optional).toBeUndefined();
  });
});

function dtoFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return dtoFiles(path);
    return name.endsWith('.dto.ts') ? [path] : [];
  });
}

describe('every DTO', () => {
  it('uses the strict form, so no field falls back to the string-accepting one', () => {
    const offenders = dtoFiles('src').filter((file) => readFileSync(file, 'utf8').includes('@IsBoolean('));
    expect(offenders).toEqual([]);
  });
});

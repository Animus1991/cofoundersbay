import { StreamableFile } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ResponseInterceptor } from './response.interceptor';

const context = { switchToHttp: () => ({ getRequest: () => ({ id: 'r1' }) }) };
const run = (value: unknown) => lastValueFrom(new ResponseInterceptor().intercept(context as never, { handle: () => of(value) }));

describe('the response envelope', () => {
  it('wraps a plain answer', async () => {
    await expect(run({ ok: true })).resolves.toMatchObject({ success: true, data: { ok: true }, requestId: 'r1' });
  });

  it('leaves a file alone, or a download would arrive as JSON', async () => {
    const file = new StreamableFile(Buffer.from('bytes'));
    await expect(run(file)).resolves.toBe(file);
  });
});

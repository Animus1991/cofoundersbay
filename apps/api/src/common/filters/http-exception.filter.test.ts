import { describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { HttpExceptionFilter } from './http-exception.filter';

/**
 * A request that fails a zod schema is the caller's mistake (docs §111). The
 * filter written for it was never registered, so all nineteen modules that
 * call `schema.parse()` answered 500 for bad input. Found by the isolated
 * backend run; a unit test of a controller sees the ZodError, not the response.
 */
function run(exception: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const req = { url: '/x', method: 'POST', get: () => 'test', ip: '127.0.0.1', connection: {} };
  const host = { switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }) };
  new HttpExceptionFilter().catch(exception, host as never);
  return res;
}

function zodError(): ZodError {
  const parsed = z.object({ status: z.enum(['pending', 'resolved']) }).safeParse({ status: 'archived' });
  if (parsed.success) throw new Error('expected a failure');
  return parsed.error;
}

describe('the global exception filter', () => {
  it('answers 400 for a schema failure, naming the field', () => {
    const res = run(zodError());
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('status');
  });

  it('still answers 500 for what is not the caller’s mistake', () => {
    expect(run(new Error('database down')).status).toHaveBeenCalledWith(500);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { OptionalJwtAuthGuard } from './jwt-optional.guard';

function contextFor(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }) };
}

function guardWith(verify: ReturnType<typeof vi.fn>, validateUser: ReturnType<typeof vi.fn>) {
  return new OptionalJwtAuthGuard({ verify } as never, { validateUser } as never);
}

describe('OptionalJwtAuthGuard', () => {
  it('reads the access cookie before the Authorization header', async () => {
    const verify = vi.fn().mockReturnValue({ sub: 'user-1', type: 'access' });
    const validateUser = vi.fn().mockResolvedValue({ id: 'user-1' });
    const request: Record<string, unknown> = {
      cookies: { cfb_access: 'cookie-token' },
      headers: { authorization: 'Bearer header-token' },
    };

    await expect(guardWith(verify, validateUser).canActivate(contextFor(request) as never)).resolves.toBe(true);

    expect(verify).toHaveBeenCalledWith('cookie-token');
    expect(request.user).toEqual({ id: 'user-1' });
  });

  it('still accepts a bearer token when no cookie is set', async () => {
    const verify = vi.fn().mockReturnValue({ sub: 'user-2', type: 'access' });
    const validateUser = vi.fn().mockResolvedValue({ id: 'user-2' });
    const request: Record<string, unknown> = {
      cookies: {},
      headers: { authorization: 'Bearer header-token' },
    };

    await expect(guardWith(verify, validateUser).canActivate(contextFor(request) as never)).resolves.toBe(true);

    expect(verify).toHaveBeenCalledWith('header-token');
    expect(request.user).toEqual({ id: 'user-2' });
  });

  it('stays anonymous when neither cookie nor header carries a token', async () => {
    const verify = vi.fn();
    const request: Record<string, unknown> = { cookies: {}, headers: {} };

    await expect(guardWith(verify, vi.fn()).canActivate(contextFor(request) as never)).resolves.toBe(true);

    expect(verify).not.toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api';
import { isRateLimited } from './rate-limit-message';

describe('a limit reached on a sign-in form', () => {
  it('is told apart by the status', () => {
    expect(isRateLimited(new ApiError(429, 'ThrottlerException: Too Many Requests'))).toBe(true);
  });

  it('is not confused with a wrong password or a network failure', () => {
    expect(isRateLimited(new ApiError(401, 'Invalid credentials'))).toBe(false);
    expect(isRateLimited(new Error('Failed to fetch'))).toBe(false);
    expect(isRateLimited(undefined)).toBe(false);
  });
});

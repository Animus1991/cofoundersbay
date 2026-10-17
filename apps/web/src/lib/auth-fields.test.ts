import { describe, expect, it } from 'vitest';
import { loginEmailError, loginPasswordError, registerPasswordError } from './auth-fields';

describe('auth field messages', () => {
  it('stays quiet while the email is a real address', () => {
    expect(loginEmailError('ada@startup.com')).toBeNull();
  });

  it('names an empty email and a malformed one', () => {
    expect(loginEmailError('  ')?.el).toContain('email');
    expect(loginEmailError('ada')?.en).toContain('email');
  });

  it('asks for a password only when the field is empty', () => {
    expect(loginPasswordError('')).not.toBeNull();
    expect(loginPasswordError('secret')).toBeNull();
  });

  it('keeps the eight-character rule on the register password', () => {
    expect(registerPasswordError('short')?.en).toContain('8');
    expect(registerPasswordError('long-enough')).toBeNull();
  });
});

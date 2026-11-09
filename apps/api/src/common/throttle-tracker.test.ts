import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { throttleTracker, trustProxySetting } from './throttle-tracker';

const SECRET = 'a-test-secret-of-at-least-thirty-two-chars';
const sign = (payload: object, secret = SECRET, expiresIn = '15m') => new JwtService({ secret }).sign(payload, { expiresIn });
const request = (token: string | null, ip = '10.0.0.9') => ({
  ip,
  cookies: {},
  headers: token ? { authorization: `Bearer ${token}` } : {},
});
const track = throttleTracker(SECRET);

describe('who a request counts against', () => {
  it('counts two members behind one proxy separately', () => {
    const a = track(request(sign({ sub: 'user-a', type: 'access' })));
    const b = track(request(sign({ sub: 'user-b', type: 'access' })));
    expect(a).toBe('user:user-a');
    expect(b).toBe('user:user-b');
  });

  it('counts someone signed out by address', () => {
    expect(track(request(null, '203.0.113.7'))).toBe('ip:203.0.113.7');
  });

  it('does not let a forged token buy a fresh allowance', () => {
    const forged = sign({ sub: 'made-up', type: 'access' }, 'some-other-secret-of-thirty-two-chars-x');
    expect(track(request(forged))).toBe('ip:10.0.0.9');
    expect(track(request('not-a-token'))).toBe('ip:10.0.0.9');
  });

  it('does not accept an expired token or a refresh token', () => {
    expect(track(request(sign({ sub: 'user-a', type: 'access' }, SECRET, '-1s')))).toBe('ip:10.0.0.9');
    expect(track(request(sign({ sub: 'user-a', type: 'refresh' })))).toBe('ip:10.0.0.9');
  });
});

describe('which proxies are believed', () => {
  it('trusts only private networks by default', () => {
    expect(trustProxySetting(undefined)).toBe('loopback, linklocal, uniquelocal');
    expect(trustProxySetting('  ')).toBe('loopback, linklocal, uniquelocal');
  });

  it('takes a number of hops or a list of addresses', () => {
    expect(trustProxySetting('1')).toBe(1);
    expect(trustProxySetting('173.245.48.0/20')).toBe('173.245.48.0/20');
  });
});

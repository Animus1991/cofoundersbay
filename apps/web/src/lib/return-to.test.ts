import { describe, expect, it } from 'vitest';
import { publicOrigin, safeInternalPath } from './return-to';

describe('safeInternalPath', () => {
  it('keeps a path inside the app', () => {
    expect(safeInternalPath('/dashboard/founder')).toBe('/dashboard/founder');
    expect(safeInternalPath('/commitments/abc?from=join')).toBe('/commitments/abc?from=join');
    expect(safeInternalPath('  /profile  ')).toBe('/profile');
  });

  it('rejects a redirect that the URL parser turns into another host', () => {
    expect(safeInternalPath('//evil.com')).toBeNull();
    expect(safeInternalPath('/\\evil.com')).toBeNull();
    expect(safeInternalPath('/%5Cevil.com')).toBeNull();
    expect(safeInternalPath('/%5cevil.com')).toBeNull();
    expect(safeInternalPath('/login')).toBeNull();
    expect(safeInternalPath('/register?redirect=/')).toBeNull();
    expect(safeInternalPath('https://evil.com')).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
  });
});

describe('publicOrigin', () => {
  it('builds the redirect origin from Host, never from a forwarded host', () => {
    expect(publicOrigin({
      host: '127.0.0.1:3000',
      forwardedProto: 'http',
      nextProtocol: 'http:',
      nextHost: '127.0.0.1:3000',
    })).toBe('http://127.0.0.1:3000');
    expect(publicOrigin({
      host: 'jason.trycloudflare.com',
      forwardedProto: 'https',
      nextProtocol: 'http:',
      nextHost: '127.0.0.1:3000',
    })).toBe('https://jason.trycloudflare.com');
  });

  it('drops a malformed Host and keeps the URL Next parsed', () => {
    expect(publicOrigin({
      host: 'evil.com/login',
      forwardedProto: null,
      nextProtocol: 'http:',
      nextHost: '127.0.0.1:3000',
    })).toBe('http://127.0.0.1:3000');
  });
});

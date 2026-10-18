import { describe, expect, it } from 'vitest';
import { isWebAddress } from './learning-links';

describe('isWebAddress', () => {
  it('keeps an ordinary http or https address', () => {
    expect(isWebAddress('https://library.example/guide')).toBe(true);
    expect(isWebAddress('http://library.example/guide?page=2#top')).toBe(true);
    expect(isWebAddress('  https://library.example/x  ')).toBe(true);
  });

  it('refuses every address that could run script or leave the web', () => {
    // The reason this exists: window.open("javascript:...") runs with the site's origin.
    expect(isWebAddress("javascript:localStorage.getItem('x')")).toBe(false);
    expect(isWebAddress('JaVaScRiPt:alert(1)')).toBe(false);
    expect(isWebAddress('data:text/html,<script>1</script>')).toBe(false);
    expect(isWebAddress('vbscript:msgbox(1)')).toBe(false);
    expect(isWebAddress('file:///etc/passwd')).toBe(false);
    expect(isWebAddress('ftp://library.example/x')).toBe(false);
    expect(isWebAddress('blob:https://library.example/1')).toBe(false);
  });

  it('refuses what is not an address, or hides something in one', () => {
    expect(isWebAddress('')).toBe(false);
    expect(isWebAddress('   ')).toBe(false);
    expect(isWebAddress('library.example/guide')).toBe(false); // no scheme: the server wants one written
    expect(isWebAddress('/learning')).toBe(false);
    expect(isWebAddress('#')).toBe(false);
    expect(isWebAddress('https://user:secret@library.example/x')).toBe(false);
    expect(isWebAddress('https://library.example/a b')).toBe(false);
    expect(isWebAddress('https://localhost/x')).toBe(false);
    expect(isWebAddress(`https://library.example/${'a'.repeat(2100)}`)).toBe(false);
  });

  it('refuses a value that is not text', () => {
    expect(isWebAddress(undefined)).toBe(false);
    expect(isWebAddress(null)).toBe(false);
    expect(isWebAddress(42)).toBe(false);
    expect(isWebAddress({ href: 'https://library.example' })).toBe(false);
    expect(isWebAddress(['https://library.example'])).toBe(false);
  });
});

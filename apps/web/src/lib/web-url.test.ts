import { describe, expect, it } from 'vitest';
import { linkTarget, safeWebUrl } from './web-url';

describe('safeWebUrl', () => {
  it('keeps an ordinary https link and adds the scheme when it is missing', () => {
    expect(safeWebUrl('https://video.example/me')).toBe('https://video.example/me');
    expect(safeWebUrl('video.example/intro')).toBe('https://video.example/intro');
  });

  it('drops script, data and password addresses', () => {
    expect(safeWebUrl('javascript:alert(1)')).toBeNull();
    expect(safeWebUrl('data:text/html,hi')).toBeNull();
    expect(safeWebUrl('https://user:secret@video.example/me')).toBeNull();
    expect(safeWebUrl('not a link')).toBeNull();
    expect(safeWebUrl('')).toBeNull();
  });
});

describe('linkTarget', () => {
  it('takes a path of this platform as a page of this platform', () => {
    expect(linkTarget('/investors')).toEqual({ kind: 'internal', path: '/investors' });
    expect(linkTarget('  /mentoring?tab=sessions  ')).toEqual({ kind: 'internal', path: '/mentoring?tab=sessions' });
  });

  it('takes an ordinary web address as the web, with the scheme added when it is missing', () => {
    expect(linkTarget('https://library.example/guide')).toEqual({ kind: 'external', href: 'https://library.example/guide' });
    expect(linkTarget('library.example/guide')).toEqual({ kind: 'external', href: 'https://library.example/guide' });
  });

  it('leads nowhere for anything that could run or redirect somewhere unintended', () => {
    // The exploit this exists for: window.open("javascript:...") runs with this site's origin.
    expect(linkTarget("javascript:localStorage.getItem('x')")).toBeNull();
    expect(linkTarget('JaVaScRiPt:alert(1)')).toBeNull();
    expect(linkTarget('data:text/html,<script>1</script>')).toBeNull();
    expect(linkTarget('vbscript:msgbox(1)')).toBeNull();
    // Another site dressed as a path.
    expect(linkTarget('//evil.example/x')).toBeNull();
    expect(linkTarget('/\\evil.example/x')).toBeNull();
    expect(linkTarget('/ok path')).toBeNull();
    // Placeholders and empties.
    expect(linkTarget('#')).toBeNull();
    expect(linkTarget('')).toBeNull();
    expect(linkTarget('   ')).toBeNull();
    expect(linkTarget(null)).toBeNull();
    expect(linkTarget(undefined)).toBeNull();
  });
});

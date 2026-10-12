import { describe, expect, it } from 'vitest';
import { safeWebUrl } from './web-url';

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

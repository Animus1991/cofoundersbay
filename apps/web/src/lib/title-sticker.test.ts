import { describe, expect, it } from 'vitest';
import { deriveTitleSticker } from './title-sticker';

/** The route-derived title sticker (docs §135 A1): the route's glyph first, then the owning nav entry's icon. */
describe('deriveTitleSticker', () => {
  it('returns the route glyph with its kind tint where one exists', () => {
    const sticker = deriveTitleSticker('/messages');
    expect(sticker).toBeTruthy();
    expect(sticker?.glyph ?? sticker?.icon).toBeTruthy();
    expect(sticker?.tint).toBeTruthy();
  });

  it('derives one for member sections from the nav entry, tinted by the registry section', () => {
    const sticker = deriveTitleSticker('/dashboard/founder');
    expect(sticker).toBeTruthy();
  });

  it('returns undefined where neither a glyph nor a nav entry owns the path', () => {
    expect(deriveTitleSticker('/no-such-page-xyz')).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { dealEventTitleEl } from './deal-events';

describe('dealEventTitleEl', () => {
  it('says the server-written events in Greek', () => {
    expect(dealEventTitleEl('Added to the board')).toBe('Προστέθηκε στον πίνακα');
    expect(dealEventTitleEl('Moved to negotiating')).toBe('Πέρασε στο στάδιο «Διαπραγμάτευση»');
    // The API writes the stage with its underscore replaced by a space.
    expect(dealEventTitleEl('Moved to due diligence')).toBe('Πέρασε στο στάδιο «Δέουσα επιμέλεια»');
    expect(dealEventTitleEl('Moved to passed')).toBe('Απορρίφθηκε');
  });

  it('leaves founder-written titles and unknown stages as written', () => {
    expect(dealEventTitleEl('Sent an updated deck')).toBeUndefined();
    expect(dealEventTitleEl('Moved to Lisbon')).toBeUndefined();
    expect(dealEventTitleEl(null)).toBeUndefined();
  });
});

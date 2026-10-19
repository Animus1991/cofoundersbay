import { describe, expect, it } from 'vitest';
import { translate } from './translate';
import { placeElStrict } from './places';

/**
 * What the 2026-10-20 english_leak sweep found in English on Greek pages,
 * through the same `translate` the DOM pass calls (docs §60.4).
 */
describe('Greek for what the leak sweep found', () => {
  it.each([
    ['Heraklion, Greece', 'Ηράκλειο, Ελλάδα'],
    ['Patras', 'Πάτρα'],
    ['Remote', 'Εξ αποστάσεως'],
    ['Boston', 'Βοστώνη'],
  ])('a place on its own: %s', (en, el) => {
    expect(translate('el', en)).toBe(el);
  });

  it('leaves a place it only half knows, and a lone two-letter code, as written', () => {
    expect(placeElStrict('Stegi, Athens')).toBeNull();
    expect(placeElStrict('IT')).toBeNull();
    expect(translate('el', 'IT')).toBe('IT');
  });

  it.each([
    ['Select Maria Georgiou', 'Επιλογή: Maria Georgiou'],
    ['Actions for Alex Demo', 'Ενέργειες για: Alex Demo'],
    ['4 out of 5', '4 από 5'],
    ['API heap 71% in use', 'Μνήμη API σε χρήση: 71%'],
  ])('an accessible name with a value: %s', (en, el) => {
    expect(translate('el', en)).toBe(el);
  });

  it('translates the label inside a meter’s name', () => {
    expect(translate('el', 'Founders: 69% of users')).toMatch(/^Ιδρυτ.*: 69% των χρηστών$/);
  });

  it.each([
    ['Logistics', 'Εφοδιαστική'],
    ['Pricing', 'Τιμολόγηση'],
    ['Search users', 'Αναζήτηση χρηστών'],
  ])('a term: %s', (en, el) => {
    expect(translate('el', en)).toBe(el);
  });
});

import { describe, expect, it } from 'vitest';
import { durationEl, priceEl } from './units';

describe('Greek for short English durations', () => {
  it.each([
    ['45 min read', '45 λεπτά ανάγνωσης'],
    ['30 min', '30 λεπτά'],
    ['< 24h', '< 24 ώρ.'],
    ['12 hours', '12 ώρ.'],
    ['138 d', '138 ημ.'],
    ['40 h/week', '40 ώρ./εβδ.'],
    ['2 weeks', '2 εβδ.'],
  ])('%s → %s', (en, el) => {
    expect(durationEl(en)).toBe(el);
  });

  it('leaves anything else to show as given', () => {
    expect(durationEl('Contact')).toBeUndefined();
    expect(durationEl('€95 / hour')).toBeUndefined();
    expect(durationEl('')).toBeUndefined();
  });
});

describe('Greek for the unit on a typed price', () => {
  it.each([
    ['€1,200 fixed', '€1,200 σταθερή τιμή'],
    ['€95 / hour', '€95 / ώρα'],
    ['€400 per day', '€400 / ημέρα'],
    ['$2,000/month', '$2,000 / μήνα'],
  ])('%s → %s', (en, el) => {
    expect(priceEl(en)).toBe(el);
  });

  it('leaves words and bare amounts as written', () => {
    expect(priceEl('Contact us')).toBeUndefined();
    expect(priceEl('€500')).toBeUndefined();
    expect(priceEl('—')).toBeUndefined();
  });
});

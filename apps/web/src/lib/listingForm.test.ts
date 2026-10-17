import { describe, expect, it } from 'vitest';
import { centsToDollars, dollarsToCents, pickOptions, readFlag, readNumber, snapToStep } from './listing-form';

describe('listing form readers', () => {
  it('matches draft words to the form options, ignoring case, spacing and unknown words', () => {
    expect(pickOptions('fintech, saas ; Quantum knitting', ['SaaS', 'Fintech', 'Edtech'])).toEqual(['SaaS', 'Fintech']);
    expect(pickOptions('go to market, early revenue', ['Go-to-Market', 'Early Revenue'])).toEqual(['Go-to-Market', 'Early Revenue']);
    expect(pickOptions('in person, video', ['video', 'in_person', 'async'])).toEqual(['video', 'in_person']);
    expect(pickOptions(undefined, ['SaaS'])).toEqual([]);
  });

  it('snaps a number to the nearest select step', () => {
    expect(snapToStep(4, [1, 2, 3, 5, 8])).toBe(3);
    expect(snapToStep(6, [1, 2, 3, 5, 8])).toBe(5);
    expect(snapToStep(50, [15, 30, 45, 60])).toBe(45);
    expect(snapToStep(Number.NaN, [1])).toBeNull();
  });

  it('reads numbers, flags and money the way a person or a model writes them', () => {
    expect(readNumber('$1,200')).toBe(1200);
    expect(readNumber('')).toBeNull();
    expect(readFlag('ναι')).toBe(true);
    expect(readFlag('no')).toBe(false);
    expect(readFlag('maybe')).toBeNull();
    expect(dollarsToCents('120.5')).toBe(12050);
    expect(dollarsToCents('')).toBeNull();
    expect(centsToDollars(12050)).toBe('120.5');
    expect(centsToDollars(null)).toBe('');
  });
});

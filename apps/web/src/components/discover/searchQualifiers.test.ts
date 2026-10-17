import { describe, expect, it } from 'vitest';
import { readNaturalSearch, SEARCH_QUALIFIER_EXAMPLES } from '@cofounderbay/shared';

/**
 * Qualifiers on top of plain-language search (GitHub comparison §55): an
 * explicit `key:value` a reader can type again and share, in either
 * language, that reaches the same filters as the words would - and names a
 * skill filter on purpose, where a bare word stays text.
 */
describe('search qualifiers', () => {
  it('reads key:value in English into the same filters as the words', () => {
    const read = readNaturalSearch('role:mentor location:Athens AI');
    expect(read.roles).toEqual(['mentor']);
    expect(read.location).toBe('Athens');
    expect(read.rest).toBe('AI');
    expect(read.understood.map((f) => f.kind)).toEqual(['role', 'location']);
  });

  it('reads Greek keys and declined Greek values', () => {
    const read = readNaturalSearch('ρόλος:μέντορας τόπος:Αθήνα κλάδος:fintech');
    expect(read.roles).toEqual(['mentor']);
    expect(read.location).toBe('Athens');
    expect(read.industries).toEqual(['Fintech']);
    expect(read.rest).toBe('');
  });

  it('names a skill filter only when asked to, a bare word stays text', () => {
    expect(readNaturalSearch('skill:TypeScript').skills).toEqual(['TypeScript']);
    expect(readNaturalSearch('skill:TypeScript').rest).toBe('');
    expect(readNaturalSearch('TypeScript').skills).toEqual([]);
    expect(readNaturalSearch('TypeScript').rest).toBe('TypeScript');
    expect(readNaturalSearch('δεξιότητα:AI').understood[0]).toMatchObject({ kind: 'skill', value: 'AI', el: 'Δεξιότητα: AI' });
  });

  it('quotes a value with spaces and keeps an unknown place as typed', () => {
    const read = readNaturalSearch('location:"New York" founder');
    expect(read.location).toBe('New York');
    expect(read.roles).toEqual(['founder']);
    expect(read.rest).toBe('');
  });

  it('drops a known key whose value has no filter and searches the value as text', () => {
    const read = readNaturalSearch('role:designer');
    expect(read.roles).toEqual([]);
    expect(read.rest).toBe('designer');
  });

  it('leaves an unknown key alone, as text', () => {
    expect(readNaturalSearch('https://example.com').rest).toContain('https');
    expect(readNaturalSearch('foo:bar').understood).toEqual([]);
  });

  it('every suggested example parses into a filter in both languages', () => {
    for (const { en, el } of SEARCH_QUALIFIER_EXAMPLES) {
      expect(readNaturalSearch(en).understood.length, en).toBe(1);
      expect(readNaturalSearch(el).understood.length, el).toBe(1);
      expect(readNaturalSearch(en).understood[0].kind).toBe(readNaturalSearch(el).understood[0].kind);
    }
  });
});

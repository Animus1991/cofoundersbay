import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRIVACY_EL } from './privacy-el';
import { TERMS_EL } from './terms-el';

/**
 * The Greek legal drafts keep the English text's shape (docs §111).
 *
 * A translation that drifts is worse than none: it promises what the English
 * does not. No test can judge the wording, a lawyer does that; this holds the
 * parts a machine can count, so a section added or a bullet changed in English
 * fails until the Greek follows.
 */
const APP = join(__dirname, '..', '..', 'app');

function englishSections(file: string): Record<string, { title: string; content: string }> {
  const source = readFileSync(join(APP, file), 'utf8').replace(/\r\n/g, '\n');
  const out: Record<string, { title: string; content: string }> = {};
  const re = /id: '([^']+)',\n\s+title: '((?:[^'\\]|\\.)+)',\n\s+icon: \w+,\n\s+content: `([\s\S]*?)`,/g;
  for (const m of source.matchAll(re)) out[m[1]] = { title: m[2], content: m[3] };
  return out;
}

const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;
const BULLET = /^• /gm;
const HEADING = /^\*\*.+\*\*/gm;
const PARAGRAPH_BREAK = /\n\n/g;
const EMAIL = /[\w.]+@cofounderbay\.com/g;
const NUMBER = /\b\d+\b/g;

describe.each([
  ['privacy/page.tsx', PRIVACY_EL],
  ['terms/page.tsx', TERMS_EL],
])('the Greek draft of %s', (file, greek) => {
  const english = englishSections(file);

  it('has every section and no others, under the same number', () => {
    expect(Object.keys(english).length).toBeGreaterThan(10);
    expect(Object.keys(greek).sort()).toEqual(Object.keys(english).sort());
    for (const [id, section] of Object.entries(english)) {
      expect(greek[id].title.split('.')[0]).toBe(section.title.split('.')[0]);
    }
  });

  it('keeps the same lists, headings and paragraphs', () => {
    for (const [id, section] of Object.entries(english)) {
      const el = greek[id].content;
      expect([id, count(el, BULLET)]).toEqual([id, count(section.content, BULLET)]);
      expect([id, count(el, HEADING)]).toEqual([id, count(section.content, HEADING)]);
      expect([id, count(el, PARAGRAPH_BREAK)]).toEqual([id, count(section.content, PARAGRAPH_BREAK)]);
    }
  });

  it('keeps every address and every figure', () => {
    for (const [id, section] of Object.entries(english)) {
      const el = greek[id].content;
      expect([id, el.match(EMAIL) ?? []]).toEqual([id, section.content.match(EMAIL) ?? []]);
      for (const figure of section.content.match(NUMBER) ?? []) expect([id, figure, el.includes(figure)]).toEqual([id, figure, true]);
    }
  });

  it('is Greek, not English left behind', () => {
    for (const [id, section] of Object.entries(greek)) {
      const greekLetters = count(section.content, /[Ͱ-Ͽ]/g);
      const latinLetters = count(section.content, /[A-Za-z]/g);
      expect([id, greekLetters > latinLetters]).toEqual([id, true]);
    }
  });
});

describe('the pages', () => {
  it.each(['privacy/page.tsx', 'terms/page.tsx'])('%s says what the reader is looking at', (file) => {
    const source = readFileSync(join(APP, file), 'utf8');
    expect(source).toContain('<LegalDraftNotice');
    expect(source).toContain('useLegalText(');
  });
});

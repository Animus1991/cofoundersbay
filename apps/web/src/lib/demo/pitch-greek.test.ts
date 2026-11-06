import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_DECK_EL, demoDeckText } from './pitch-greek';

const previewDemo = vi.hoisted(() => ({ on: true }));
vi.mock('@/lib/preview-demo', () => ({ isPreviewDemo: () => previewDemo.on }));

/** Every string a sample slide carries, read from the fixtures themselves. */
function fixtureTexts(): string[] {
  const source = readFileSync('src/lib/preview-api.ts', 'utf8');
  const found = new Set<string>();
  for (const start of source.matchAll(/slides: \[/g)) {
    let depth = 1;
    let i = (start.index ?? 0) + start[0].length;
    const from = i;
    while (depth > 0 && i < source.length) {
      if (source[i] === '[') depth += 1;
      if (source[i] === ']') depth -= 1;
      i += 1;
    }
    for (const field of source.slice(from, i).matchAll(/\b(?:content|notes):\s*'((?:[^'\\]|\\.)*)'/g)) {
      if (field[1]) found.add(field[1].replace(/\\n/g, '\n').replace(/\\'/g, "'"));
    }
  }
  return [...found];
}

afterEach(() => {
  previewDemo.on = true;
  window.localStorage.clear();
});

describe('the demo deck in Greek', () => {
  it('knows every sample slide, so a new one cannot stay English unnoticed', () => {
    const texts = fixtureTexts();
    expect(texts.length).toBeGreaterThan(20);
    expect(texts.filter((text) => !DEMO_DECK_EL[text])).toEqual([]);
  });

  it('keeps each slide’s line breaks, which carry its layout', () => {
    for (const [en, el] of Object.entries(DEMO_DECK_EL)) expect(el.split('\n').length).toBe(en.split('\n').length);
  });

  it('gives a Greek reader the Greek', () => {
    window.localStorage.setItem('cfb_locale', 'el');
    expect(demoDeckText('Same competitors as Market Analysis.')).toBe('Ίδιοι ανταγωνιστές με την Ανάλυση αγοράς.');
  });

  it('leaves what the visitor typed alone', () => {
    window.localStorage.setItem('cfb_locale', 'el');
    expect(demoDeckText('My own slide')).toBe('My own slide');
  });

  it('leaves an English reader, and a real account, alone', () => {
    window.localStorage.setItem('cfb_locale', 'en');
    expect(demoDeckText('Same competitors as Market Analysis.')).toBe('Same competitors as Market Analysis.');
    window.localStorage.setItem('cfb_locale', 'el');
    previewDemo.on = false;
    expect(demoDeckText('Same competitors as Market Analysis.')).toBe('Same competitors as Market Analysis.');
  });
});

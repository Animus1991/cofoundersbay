import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decimalEl, decimalEn } from './format';

/**
 * Greek writes a decimal with a comma. `toFixed` prints a point, so a Greek
 * string built with it read «4.8», «2.3 ώρες», «12.5% σε χρήση» (§166). The
 * Greek side goes through `decimalEl` (or the reader's locale) instead.
 */
describe('Greek decimals', () => {
  it('writes a comma', () => {
    expect(decimalEl(4.8)).toBe('4,8');
    expect(decimalEl(0.25, 2)).toBe('0,25');
  });

  it('rounds the English side the same way (§167)', () => {
    // toFixed(1) prints "1.4" for 1.45 (a binary 1.4499…); Intl rounds it up.
    expect(decimalEn(1.45)).toBe('1.5');
    expect(decimalEl(1.45)).toBe('1,5');
  });

  it('has no toFixed inside the Greek side of a bilingual string', () => {
    const SRC = join(__dirname, '..', '..');
    const files = (dir: string, out: string[] = []): string[] => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) files(path, out);
        else if (/\.tsx?$/.test(name) && !name.includes('.test.')) out.push(path);
      }
      return out;
    };
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/\bel(?:=\{|:\s*)`((?:[^`\\]|\\.)*)`/g)) {
        // toFixed(0) prints a whole number, with no point to get wrong.
        if (/\.toFixed\([1-9]\)/.test(m[1])) offenders.push(`${relative(SRC, file).replace(/\\/g, '/')}: ${m[1].slice(0, 70)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

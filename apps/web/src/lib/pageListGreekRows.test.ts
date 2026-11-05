import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A page list whose rows are built from an English copy object (`.en`,
 * `labelEn`, `detailEn`) has the Greek right beside it, so it also passes
 * `rowsEl`: the assistant answers a Greek reader about "this page" from those
 * rows, and without them quoted English in a Greek answer («Skills you asked
 * for…» on /scout). Rows of names and figures alone need no Greek.
 */
const ROOTS = ['src/app', 'src/components'];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.tsx') && !path.includes('.test.') ? [path] : [];
  });
}

describe('page lists in the reader’s language', () => {
  it('pass rowsEl wherever the English rows come from a copy object', () => {
    const offenders: string[] = [];
    for (const path of ROOTS.flatMap((r) => files(join(process.cwd(), r)))) {
      const source = readFileSync(path, 'utf8');
      // Each list object inside usePageList([...]): from `id:` to the next `id:` or the call's end.
      for (const call of source.matchAll(/usePageList\(\[([\s\S]*?)\]\);/g)) {
        for (const list of call[1].split(/\n\s*\{\s*(?=\n?\s*id:|id:)/)) {
          const rows = list.match(/\brows:([^\n]*)/);
          if (!rows || !/\.en\b|\.labelEn\b|\.detailEn\b|\.en\)/.test(rows[1])) continue;
          if (/\browsEl:/.test(list)) continue;
          const id = list.match(/id:\s*'([^']+)'/)?.[1] ?? '?';
          offenders.push(`${path.slice(process.cwd().length + 1)}: ${id}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('pass rowsEl wherever the rows write English words of their own (docs §54.7-7, §111)', () => {
    // "3 members", "remote", "(unread)": words written into the row, which a
    // Greek answer would quote in English. Rows of names, figures and dates
    // alone are left as they are.
    const strip = (text: string) => {
      let out = '';
      let depth = 0;
      for (let i = 0; i < text.length; i += 1) {
        if (depth === 0 && text.startsWith('${', i)) { depth = 1; i += 1; out += ' '; continue; }
        if (depth > 0) {
          if (text[i] === '{') depth += 1;
          else if (text[i] === '}') depth -= 1;
          continue;
        }
        out += text[i];
      }
      return out;
    };
    const offenders: string[] = [];
    for (const path of ROOTS.flatMap((r) => files(join(process.cwd(), r)))) {
      const source = readFileSync(path, 'utf8');
      for (const call of source.matchAll(/usePageList\(\[([\s\S]*?)\]\);/g)) {
        for (const list of call[1].split(/\n\s*\{\s*(?=\n?\s*id:|id:)/)) {
          if (/\browsEl:/.test(list)) continue;
          const rows = list.match(/\brows:([\s\S]*?)(?:\n\s*(?:total|sample|labelEn|labelEl|id):|\n\s*\},?\s*$)/);
          if (!rows) continue;
          const literals = [...rows[1].matchAll(/`([^`]*)`/g)].map((m) => strip(m[1]));
          const words = literals.flatMap((text) => text.match(/[A-Za-z][A-Za-z-]{2,}/g) ?? []).filter((w) => w !== 'UTC');
          if (words.length) offenders.push(`${path.slice(process.cwd().length + 1)}: ${list.match(/id:\s*'([^']+)'/)?.[1] ?? '?'} (${[...new Set(words)].join(', ')})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Greek copy about another person stays gender-neutral: no slashed forms
 * («Ο/Η», «τον/την», «του/της», «Επαληθευμένος/η»). Use «προς» + name, a
 * colon, a reciprocal verb or «το μέλος» instead (docs §54, the Greek rules).
 *
 * Adopted from the AI Studio prototype's own guard (2026-10-20). The one
 * allowed family is the "Open to" feature's name, «Ανοιχτός/ή σε», which the
 * owner chose and the docs record; every other slashed form fails here.
 */
const SRC = join(__dirname, '..', '..');
const GENDERED = /Ο\/Η|ο\/η |τον\/την|του\/της|ος\/-?η(?![\p{L}])|ός\/ή(?![\p{L}])/u;
const ALLOWED = /[Αα]νοιχτός\/ή/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.includes('.test.')) out.push(path);
  }
  return out;
}

describe('Greek copy stays gender-neutral', () => {
  it('has no slashed gendered forms outside the "Open to" name', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        const trimmed = line.trim();
        // Comments may quote the forms they replaced.
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
        if (GENDERED.test(line.replace(new RegExp(ALLOWED.source, 'g'), ''))) {
          offenders.push(`${relative(SRC, file).replace(/\\/g, '/')}:${i + 1} ${trimmed.slice(0, 100)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});

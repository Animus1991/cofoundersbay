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

  /*
   * A label that is only an adjective names whoever it sits beside in one
   * gender: «Διαθέσιμος» called Alexandra and Ioanna masculine on the cards of
   * Services and Mentors (§159, §162). A person's state is said through a
   * noun of its own instead: «Ελεύθερες ώρες», «Δέχεται νέους πελάτες»,
   * «Επαληθευμένο προφίλ». The domains screen keeps «Επαληθευμένος»: there it
   * agrees with «τομέας».
   */
  it('has no person status that is a bare gendered adjective', () => {
    const BARE = /(["'`])(?:Μη )?(?:[Δδ]ιαθέσιμ|Επαληθευμέν)(?:ος|η)\1/u;
    const NOUN_AGREES = new Set(['app/admin/domains/page.tsx']);
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const rel = relative(SRC, file).replace(/\\/g, '/');
      if (NOUN_AGREES.has(rel)) continue;
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (BARE.test(line)) offenders.push(`${rel}:${i + 1} ${line.trim().slice(0, 100)}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A placeholder or a select option is in the reader's language only.
 *
 * Since 2026-10-14 one language is on screen by default, but 202 placeholders
 * and 25 options were written with bilingualInline(en, el), which always
 * joins both ("Name, skill… · Όνομα, δεξιότητα…", "Most relevant · Πιο
 * σχετικά"), half cut off in a narrow field. In client components they take
 * `useBilingualString()` now (sayOne). This fails if bilingualInline comes
 * back as a visible placeholder or option text in a 'use client' file;
 * aria-labels and titles keep both languages on purpose (bilingualAria).
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.tsx') && !path.includes('.test.') ? [path] : [];
  });
}

describe('one language in placeholders and options', () => {
  it('uses the reader’s language, not both joined', () => {
    const offenders: string[] = [];
    for (const path of ['src/app', 'src/components'].flatMap((r) => files(join(process.cwd(), r)))) {
      const source = readFileSync(path, 'utf8');
      if (!/^\s*['"]use client['"]/.test(source)) continue;
      const rel = path.slice(process.cwd().length + 1);
      for (const m of source.matchAll(/placeholder=\{bilingualInline\(/g)) offenders.push(`${rel}: placeholder at ${m.index}`);
      for (const m of source.matchAll(/<(option|SelectItem)\b[^>]*>\s*\{bilingualInline\(/g)) offenders.push(`${rel}: ${m[1]} at ${m.index}`);
    }
    expect(offenders).toEqual([]);
  });
});

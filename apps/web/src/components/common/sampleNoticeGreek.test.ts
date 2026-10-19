import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/lib/i18n/catalog';
import elExtra from '@/lib/i18n/messages/el.json';

/**
 * The "Sample data" note says, in a sentence, why a page shows samples. It
 * passes its `surface` and `detail` through the catalog, so a sentence the
 * catalog lacks reaches a Greek reader in English: 2026-10-20 found 20 of
 * them, from "There is no live Feed module yet" to the API-keys note.
 *
 * This reads every `<SampleDataNotice … />` with literal props and fails for
 * a string with no Greek. A notice that builds its text at run time (the
 * reputation page passes its own translated strings) is out of reach here.
 */

const SRC = join(__dirname, '..', '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (name.endsWith('.tsx') && !name.includes('.test.')) out.push(path);
  }
  return out;
}

const greek = (source: string) => CATALOG.el[source] ?? (elExtra as Record<string, string>)[source];

function literalProps(): Array<{ file: string; prop: string; text: string }> {
  const found: Array<{ file: string; prop: string; text: string }> = [];
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const notice of text.match(/<SampleDataNotice\b[\s\S]*?\/>/g) ?? []) {
      for (const prop of ['surface', 'detail']) {
        const m = notice.match(new RegExp(`${prop}=(?:"([^"]*)"|\\{\\s*(['"\`])([\\s\\S]*?)\\2\\s*\\})`));
        if (!m) continue;
        found.push({ file: relative(SRC, file).replace(/\\/g, '/'), prop, text: m[1] ?? m[3] });
      }
    }
  }
  return found;
}

describe('sample-data notes in Greek', () => {
  const props = literalProps();

  it('finds the notes', () => {
    expect(props.length).toBeGreaterThan(20);
  });

  it('has Greek for every literal surface and detail', () => {
    const missing = props.filter((p) => !greek(p.text)).map((p) => `${p.file} ${p.prop}: ${p.text.slice(0, 80)}`);
    expect(missing).toEqual([]);
  });
});

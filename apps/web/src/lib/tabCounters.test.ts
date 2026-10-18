import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A count on a tab is a Counter (components/ui/counter.tsx), as GitHub draws
 * "Issues 1": 31 tabs wrote "Pending (3)" in brackets and eight places drew
 * eight badge sizes for the same thing. This fails if a bracketed count or a
 * Badge-as-count comes back inside a TabsTrigger, a heading or a section
 * card's title.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.tsx') && !path.includes('.test.') ? [path] : [];
  });
}

const BRACKETED = /\(\$\{[^}]+\}\)|\(\{[^}]+\}\)/;

describe('tab counts', () => {
  it('use Counter, not brackets or a Badge', () => {
    const offenders: string[] = [];
    for (const path of ['src/app', 'src/components'].flatMap((r) => files(join(process.cwd(), r)))) {
      const source = readFileSync(path, 'utf8');
      for (const m of source.matchAll(/<TabsTrigger\b[^>]*>([\s\S]*?)<\/TabsTrigger>/g)) {
        const body = m[1];
        if (BRACKETED.test(body) || /<Badge[^>]*>\s*\{[^{}]+\}\s*<\/Badge>/.test(body)) {
          offenders.push(`${path.slice(process.cwd().length + 1)}: ${body.replace(/\s+/g, ' ').trim().slice(0, 80)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('use Counter in headings and section titles too, not "(n)" in the words', () => {
    const offenders: string[] = [];
    for (const path of ['src/app', 'src/components'].flatMap((r) => files(join(process.cwd(), r)))) {
      const source = readFileSync(path, 'utf8');
      for (const m of source.matchAll(/<(CardTitle|h2|h3|h4)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
        if (BRACKETED.test(m[2])) offenders.push(`${path.slice(process.cwd().length + 1)}: ${m[2].replace(/\s+/g, ' ').trim().slice(0, 80)}`);
      }
      for (const m of source.matchAll(/title=\{`[^`]*\(\$\{[^}]+\}\)`\}/g)) {
        offenders.push(`${path.slice(process.cwd().length + 1)}: ${m[0].slice(0, 80)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

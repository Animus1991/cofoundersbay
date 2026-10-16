import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A brand-tinted box has one background and one edge.
 *
 * GitHub's Primer gives each colour role exactly one "subtle" background and
 * one "muted" border, so every tinted box of that role looks the same on every
 * page. Our boxes had drifted into fourteen alpha pairs for the same thing
 * (`bg-primary/[0.03] border-primary/15`, `/5 + /15`, `/5 + /20`,
 * `/[0.04] + /15` ...), 63 boxes in 50 files; the 39 faint ones now use
 * `bg-primary-subtle border-primary-muted` (tailwind.config.ts). This fails if a
 * faint raw pair comes back on a box. Pills (`rounded-full`) and selected
 * states (a 10%+ background) are different things and are not covered.
 */
const ROOTS = ['src/app', 'src/components'];
const FAINT_BG = new Set(['[0.03]', '[0.04]', '[0.05]', '[0.06]', '5']);
const FAINT_EDGE = new Set(['15', '20', '25']);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.tsx') && !path.includes('.test.') ? [path] : [];
  });
}

describe('brand-tinted boxes', () => {
  it('use bg-primary-subtle and border-primary-muted, not a raw faint pair', () => {
    const offenders: string[] = [];
    for (const path of ROOTS.flatMap((r) => files(join(process.cwd(), r)))) {
      const source = readFileSync(path, 'utf8');
      for (const m of source.matchAll(/(["'`])((?:(?!\1)[^\n]){0,400}?)\1/g)) {
        const cls = m[2];
        const bg = cls.match(/(?<![:\w/-])bg-primary\/(\[[0-9.]+\]|\d+)(?![\w/])/);
        const edge = cls.match(/(?<![:\w/-])border-primary\/(\[[0-9.]+\]|\d+)(?![\w/])/);
        if (!bg || !edge || !FAINT_BG.has(bg[1]) || !FAINT_EDGE.has(edge[1])) continue;
        if (/(?<![\w-])rounded-full(?![\w-])/.test(cls)) continue;
        offenders.push(`${path.slice(process.cwd().length + 1)}: ${bg[0]} ${edge[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

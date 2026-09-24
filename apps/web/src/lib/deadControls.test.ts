import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * No menu item that does nothing.
 *
 * A static sweep found 104 `<DropdownMenuItem>`s with no handler: they looked
 * exactly like the working items beside them, closed the menu when chosen,
 * and did nothing - "Resend Last" on a webhook, "Ban User" in the admin
 * directory, "Move to Next Stage" on a deal. Each is now one of:
 *
 * - wired: `onSelect` / `onClick` performs the action;
 * - a link: `asChild` around a `<Link>` or `<a>`;
 * - honestly unavailable: `disabled`, or `<UnavailableMenuItem>` (which is
 *   disabled and says why on a second line).
 *
 * This fails on a fourth kind - an item with none of those - wherever it is
 * written. A props spread counts as wired, because the handler arrives from
 * the caller and cannot be seen here.
 */

const SRC = 'src';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.tsx') && !entry.includes('.test.')) out.push(full);
  }
  return out;
}

const ATTRS = String.raw`(?:[^>{}]|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*`;
const ITEM = new RegExp(String.raw`<(DropdownMenuItem|ContextMenuItem|MenubarItem)\b(${ATTRS})>`, 'g');
const ACTS = /onClick|onSelect|asChild|disabled|\.\.\./;

describe('dead controls', () => {
  const files = walk(SRC)
    .map((path) => path.replace(/\\/g, '/'))
    // The primitives define the item; their call sites are what is checked.
    .filter((path) => !path.includes('/components/ui/'))
    .map((path) => ({ path, source: readFileSync(path, 'utf8') }));

  it('reads the menus it is meant to check', () => {
    const total = files.reduce((n, f) => n + Array.from(f.source.matchAll(ITEM)).length, 0);
    expect(total).toBeGreaterThan(200);
  });

  it('gives every menu item an action, a link, or a stated reason it has none', () => {
    const offenders: string[] = [];
    for (const { path, source } of files) {
      for (const m of source.matchAll(ITEM)) {
        if (ACTS.test(m[2])) continue;
        const line = source.slice(0, m.index ?? 0).split('\n').length;
        offenders.push(`${path}:${line} <${m[1]}> does nothing when chosen`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

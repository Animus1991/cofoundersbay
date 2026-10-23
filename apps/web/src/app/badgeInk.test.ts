import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A status badge is ink: globals.css takes its fill away (`.badge` →
 * `background-color: transparent`). A badge that asks for white or
 * primary-foreground letters therefore paints white on a white card - the
 * "2 new" count on /saved-searches and "Most popular" on /pricing read as
 * nothing (docs §87). The one place it is right is a badge inside a filled
 * control, whose fill is the button's, listed here with the reason.
 */
const ALLOWED: Record<string, string> = {
  'src/app/help/page.tsx': 'the topic count inside the selected (primary-filled) topic button',
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path.replace(/\\/g, '/')] : [];
  });
}

const PALE_INK = /<Badge\b[^>]*?\b(?:text-primary-foreground|text-white|text-background)\b/;

describe('a badge is ink, so its letters are never the fill colour', () => {
  const all = [...files('src/app'), ...files('src/components')];

  it('asks no badge for white or primary-foreground letters outside the reasoned list', () => {
    const offenders = all.filter((file) => PALE_INK.test(readFileSync(file, 'utf8')) && !ALLOWED[file]);
    expect(offenders).toEqual([]);
  });

  it('keeps the list honest: every allowed file still draws one', () => {
    const stale = Object.keys(ALLOWED).filter((file) => !PALE_INK.test(readFileSync(file, 'utf8')));
    expect(stale).toEqual([]);
  });
});

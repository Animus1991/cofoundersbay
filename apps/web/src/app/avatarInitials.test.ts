import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * An avatar without a picture shows initials (`initialsOf`), never a name's
 * first character: "Dr. Sarah Kim" read "D", and two people called Maria were
 * the same "M" in one list. §57 moved seven fallbacks over; six more had
 * crept back, and a sweep found forty in 28 files (2026-10-21). This keeps the
 * next one out. `initialsOf(name).charAt(0)` is a deliberate single letter
 * (the collaborator marks of a board's history) and is allowed.
 */

const SRC = join(__dirname, '..');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : files(path);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path] : [];
  });
}

describe('avatar fallbacks', () => {
  it('show initials, not the first character of a name', () => {
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      const text = readFileSync(file, 'utf8');
      const re = /<AvatarFallback\b[^>]*>\s*\{([^}]*)\}\s*<\/AvatarFallback>/g;
      for (const match of text.matchAll(re)) {
        if (/\[0\]|\.charAt\(0\)/.test(match[1]) && !match[1].includes('initialsOf(')) offenders.push(`${relative(SRC, file)}: {${match[1].trim()}}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

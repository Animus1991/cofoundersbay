import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A radio group built from buttons answers to the arrow keys
 * (`lib/radio-keys`). Eight groups answered only to Tab and Space
 * (2026-10-21); this keeps a new one from doing the same.
 */

const SRC = join(__dirname, '..');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : files(path);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path] : [];
  });
}

describe('radio groups built from buttons', () => {
  it('handle the arrow keys', () => {
    const missing: string[] = [];
    for (const file of files(SRC)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/<div\b[^>]*role="radiogroup"[^>]*>/g)) {
        if (!/onKeyDown=/.test(match[0])) missing.push(`${relative(SRC, file)}: ${match[0].slice(0, 90)}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });
});

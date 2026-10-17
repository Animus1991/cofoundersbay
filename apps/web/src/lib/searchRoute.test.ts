import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** The old versioned path. Built so this file does not contain it whole. */
const OLD_SEARCH = ['/api/v1', 'search'].join('/');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith('.ts') || name.endsWith('.tsx')) out.push(path);
  }
  return out;
}

function srcRoot(): string {
  const candidates = [join(process.cwd(), 'src'), join(process.cwd(), 'apps/web/src')];
  return candidates.find((path) => existsSync(path)) ?? candidates[0]!;
}

describe('search route', () => {
  it('is /api/search, with no leftover call to the versioned path', () => {
    const root = srcRoot();
    const hits = walk(root).filter((file) => readFileSync(file, 'utf8').includes(OLD_SEARCH));
    expect(hits).toEqual([]);
  });
});

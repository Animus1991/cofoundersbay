/**
 * What the pages let the assistant and the reader do, on the day the first-screen
 * work began (docs §115). That work moves actions off cards and into menus, and a
 * moved action is easy to lose by accident, so every control id and every
 * capability is recorded here and `apps/web/src/lib/controlsBaseline.test.ts`
 * fails when one goes missing. Removing one on purpose means editing the file,
 * in the same commit, for a reason someone can read.
 *
 *   node scripts/controls-baseline.mjs --write      # record what is there now
 *   node scripts/controls-baseline.mjs              # list what is missing
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { census } from './ai-coverage.mjs';

const FILE = join(dirname(fileURLToPath(import.meta.url)), 'controls-baseline.json');

export const loadBaseline = () => JSON.parse(readFileSync(FILE, 'utf8'));

export function currentControls(rows = census()) {
  return Object.fromEntries(rows.filter((row) => row.controls.length > 0).map((row) => [row.route, [...row.controls].sort()]));
}

/** `route: id` for each control the baseline has and the code no longer does. */
export function missingControls(baseline, current) {
  return Object.entries(baseline).flatMap(([route, ids]) => {
    const now = new Set(current[route] ?? []);
    return ids.filter((id) => !now.has(id)).map((id) => `${route}: ${id}`);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const current = currentControls();
  if (process.argv.includes('--write')) {
    const { listActionIds } = await import('../packages/shared/dist/actions/declarations.js');
    writeFileSync(FILE, `${JSON.stringify({ controls: current, capabilities: [...listActionIds()].sort() }, null, 1)}\n`);
    console.log(`recorded ${Object.values(current).flat().length} controls on ${Object.keys(current).length} pages`);
  } else {
    const missing = missingControls(loadBaseline().controls, current);
    console.log(missing.length ? missing.join('\n') : 'nothing missing');
  }
}

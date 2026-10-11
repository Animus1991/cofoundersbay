/**
 * Names what the card and clarity probes measured.
 *
 *   node scripts/census-report.mjs card-type <probe.json>
 *   node scripts/census-report.mjs clarity <probe.json>
 *
 * A report, not a gate: it always exits 0. Every card with more than five
 * text styles is printed. Routes in scripts/census-exceptions.json are tagged
 * as the known exceptions (the thread workspace, project pills, and the
 * clarity leftovers). Anything else is printed under "unnamed" so a new one
 * is visible in the log.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const exceptions = JSON.parse(readFileSync(join(here, 'census-exceptions.json'), 'utf8'));

export function matchException(route, list) {
  return (list ?? []).find((row) => route === row.route || route.startsWith(row.route)) ?? null;
}

export function nameCardCensus(rows, list = exceptions.cardType) {
  const known = [];
  const unnamed = [];
  for (const row of rows ?? []) {
    const hit = matchException(row.route ?? '', list);
    for (const card of row.detail ?? []) {
      if (!(card.styles > 5)) continue;
      const item = { route: row.route, card: card.card, styles: card.styles, reason: hit?.reason ?? null };
      (hit ? known : unnamed).push(item);
    }
  }
  return { known, unnamed };
}

export function nameClarityCensus(rows, list = exceptions.clarity) {
  const known = [];
  const unnamed = [];
  for (const row of rows ?? []) {
    const noisy = ['shadows', 'tints', 'frames', 'offAxis', 'centered', 'glyphs', 'dupes', 'echoes']
      .filter((key) => Array.isArray(row[key]) && row[key].length > 0);
    if (!noisy.length && row.landmark !== false) continue;
    const hit = matchException(row.route ?? '', list);
    const item = { route: row.route, noisy, reason: hit?.reason ?? null };
    (hit ? known : unnamed).push(item);
  }
  return { known, unnamed };
}

function printList(title, items) {
  console.log(`\n${title} (${items.length})`);
  for (const item of items) {
    const why = item.reason ? ` — ${item.reason}` : '';
    const what = item.card ? `${item.styles} styles · ${item.card}` : (item.noisy ?? []).join(', ');
    console.log(`  ${item.route} · ${what}${why}`);
  }
}

const kind = process.argv[2];
const file = process.argv[3];
if (kind && file) {
  const rows = JSON.parse(readFileSync(file, 'utf8'));
  const report = kind === 'clarity' ? nameClarityCensus(rows) : nameCardCensus(rows);
  console.log(`${kind}: ${report.known.length} known, ${report.unnamed.length} unnamed`);
  printList('known', report.known);
  printList('unnamed', report.unnamed);
  if (kind !== 'clarity') {
    console.log('\nAlso named, not tied to one route:');
    for (const note of exceptions.cardTypeNotes ?? []) console.log(`  ${note}`);
  }
}

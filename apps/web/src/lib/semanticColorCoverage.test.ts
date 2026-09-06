import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards the semantic-colour contract for surfaces that follow the theme.
 *
 * The research/canvas panels sit on `bg-card` / `bg-secondary` / `bg-muted`,
 * all of which change with the theme — but they had been painted with fixed
 * Tailwind palette shades (`text-emerald-400`, `bg-amber-400/5`, …) chosen as if
 * the background were permanently dark. Measured against the real light-theme
 * surfaces, every one of those failed WCAG AA: contrast ran 1.45–2.72 where 4.5
 * is required. The semantic tokens land at 4.32–9.07 because they carry a
 * separate value per theme.
 *
 * This test fails if a raw palette shade reappears in those files, so the class
 * of defect cannot be reintroduced by a later edit.
 */

const GUARDED_DIRS = ['src/components/research'];

/**
 * Identity palettes are a different problem and the status tones are the wrong
 * tool for them. A tag category or a copilot mode is coded by hue so the user can
 * tell one from another at a glance; there are more of those than the six
 * semantic tones, so mapping them onto the tones makes distinct things look
 * identical — `strategy` and `pitch` both became "accent", `product` collided
 * with `research`. A line opts out by carrying this marker, which keeps every
 * exception visible in review instead of silently absent from the sweep.
 */
const OPT_OUT = 'categorical-palette';

/** Files whose whole colour vocabulary is categorical and already theme-aware. */
const OPT_OUT_FILES = ['NodeTagsEditor.tsx'];

const RAW_PALETTE =
  /\b(?:hover:|focus:|group-hover:|dark:)?(?:text|bg|border|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g;

/** Neutral ramps are still legitimate for hairlines/overlays; only hues are guarded. */
const ALLOWED = /-(?:slate|gray|zinc|neutral|stone)-/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

describe('semantic colour coverage', () => {
  it('keeps hue-bearing palette shades out of theme-aware panels', () => {
    const offenders: string[] = [];

    for (const dir of GUARDED_DIRS) {
      for (const file of walk(dir)) {
        if (OPT_OUT_FILES.some((n) => file.endsWith(n))) continue;
        // Scan line by line so a single opted-out line does not exempt the file.
        for (const line of readFileSync(file, 'utf8').split('\n')) {
          if (line.includes(OPT_OUT)) continue;
          for (const match of line.match(RAW_PALETTE) ?? []) {
            if (ALLOWED.test(match)) continue;
            offenders.push(`${file.replace(/\\/g, '/')}: ${match}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('actually finds the files it claims to guard', () => {
    // A typo'd path would make the assertion above vacuously pass.
    const files = GUARDED_DIRS.flatMap((d) => walk(d));
    expect(files.length).toBeGreaterThan(5);
    expect(files.some((f) => f.includes('BoardSummaryPanel'))).toBe(true);
  });
});

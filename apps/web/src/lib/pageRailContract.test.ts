import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards the page rail's contract.
 *
 * The rail exists so a page can lead with what it is for, with its supporting
 * controls one gesture away. That only holds if every section is findable and
 * labelled: a collapsed rail is a column of icons, so a section with no Greek
 * label is unreadable to half the product's users, and two sections sharing an
 * id silently collapse into one because the panel is keyed by id.
 *
 * These are cheap invariants that a later edit cannot quietly break, which is
 * the point - the rail is going onto 45 pages, and reviewing each one by eye
 * is exactly the kind of check that stops happening after the third wave.
 */

const APP_DIR = 'src/app';
const GLYPH_SOURCE = 'src/components/icons/CfbGlyph.tsx';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry === 'page.tsx') out.push(full);
  }
  return out;
}

/**
 * The sections a page declares.
 *
 * Read from the source rather than by rendering: a page needs a session, a
 * query client and a router to render, and none of that is what is being
 * checked here. The shape is regular because `PageRailSection` makes it so.
 */
type ParsedSection = { id: string; glyph: string; labelEn: string; labelEl: string };

function parseRailSections(source: string): ParsedSection[] {
  const start = source.indexOf('const rail: PageRailSection[]');
  if (start === -1) return [];
  const slice = source.slice(start);
  const sections: ParsedSection[] = [];
  const idRe = /id:\s*'([^']+)',\s*\n\s*glyph:\s*'([^']+)',\s*\n\s*labelEn:\s*'([^']*)',\s*\n\s*labelEl:\s*'([^']*)'/g;
  let match: RegExpExecArray | null;
  while ((match = idRe.exec(slice)) !== null) {
    sections.push({ id: match[1], glyph: match[2], labelEn: match[3], labelEl: match[4] });
  }
  return sections;
}

const pages = walk(APP_DIR)
  .map((path) => ({ path: path.replace(/\\/g, '/'), source: readFileSync(path, 'utf8') }))
  .filter((page) => page.source.includes('const rail: PageRailSection[]'));

const knownGlyphs = (() => {
  const source = readFileSync(GLYPH_SOURCE, 'utf8');
  const block = source.slice(
    source.indexOf('CFB_GLYPH_NAMES'),
    source.indexOf('export type CfbGlyphName'),
  );
  return new Set(Array.from(block.matchAll(/'([a-z0-9-]+)'/g)).map((m) => m[1]));
})();

describe('page rail contract', () => {
  it('finds the pages that declare a rail', () => {
    // A failing count here means the parser drifted from the shape pages use,
    // and every assertion below would pass vacuously.
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(parseRailSections(page.source).length, page.path).toBeGreaterThan(0);
    }
  });

  it('gives every section a unique id', () => {
    const offenders: string[] = [];
    for (const page of pages) {
      const ids = parseRailSections(page.source).map((s) => s.id);
      const seen = new Set<string>();
      for (const id of ids) {
        // The open panel is looked up by id; a duplicate makes one section
        // unreachable and the other appear twice in the strip.
        if (seen.has(id)) offenders.push(`${page.path}: duplicate section id "${id}"`);
        seen.add(id);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('labels every section in both languages', () => {
    const offenders: string[] = [];
    for (const page of pages) {
      for (const section of parseRailSections(page.source)) {
        if (!section.labelEn.trim()) offenders.push(`${page.path}: "${section.id}" has no English label`);
        if (!section.labelEl.trim()) offenders.push(`${page.path}: "${section.id}" has no Greek label`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('names a glyph the icon set actually has', () => {
    const offenders: string[] = [];
    for (const page of pages) {
      for (const section of parseRailSections(page.source)) {
        // An unknown name falls back to a generic icon, so the strip becomes a
        // column of identical shapes - which is the one thing it cannot be.
        if (!knownGlyphs.has(section.glyph)) {
          offenders.push(`${page.path}: "${section.id}" uses unknown glyph "${section.glyph}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the rail off pages that have nothing to put in it', () => {
    const offenders: string[] = [];
    for (const page of pages) {
      // One section is a panel, not a rail: it costs a 52px strip and a click
      // to reach what a single inline control would have shown for free.
      if (parseRailSections(page.source).length < 2) {
        offenders.push(`${page.path}: a rail needs at least two sections`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

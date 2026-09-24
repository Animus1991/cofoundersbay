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

/**
 * The rail block and the rest of the page, as two strings.
 *
 * The rail is a `const rail: PageRailSection[] = [ ... ];` literal; its end is
 * the first `];` at the declaration's indentation. Everything else - header
 * actions, toolbar, the column - is "the page". A control is identified by
 * the label it shows: a catalogue key (`researchEn('fit_nodes')`), a literal
 * bilingual prop (`en="Refresh"`), or a StatCard label (`label="Total Users"`).
 * Icons and handlers are deliberately not compared: two controls with the same
 * label are the same control to the reader, whatever they are wired to.
 */
function splitRail(source: string): { rail: string; page: string } {
  const start = source.indexOf('const rail: PageRailSection[]');
  if (start === -1) return { rail: '', page: source };
  const lineStart = source.lastIndexOf(String.fromCharCode(10), start) + 1;
  const indent = source.slice(lineStart, start);
  const endMarker = String.fromCharCode(10) + indent + '];';
  const end = source.indexOf(endMarker, start);
  const rail = source.slice(start, end === -1 ? undefined : end + endMarker.length);
  return { rail, page: source.slice(0, start) + source.slice(end === -1 ? source.length : end + endMarker.length) };
}

function controlLabels(source: string): Set<string> {
  const out = new Set<string>();
  for (const m of source.matchAll(/[a-zA-Z]+En\('([a-z0-9_]+)'\)/g)) out.add(`key:${m[1]}`);
  for (const m of source.matchAll(/[\s{(]en=\{?["'`]([^"'`{}]{2,60})["'`]/g)) out.add(`en:${m[1].trim()}`);
  for (const m of source.matchAll(/[\s{(]label=["']([^"']{2,60})["']/g)) out.add(`en:${m[1].trim()}`);
  return out;
}

/**
 * Labels a page may legitimately show in both places: headings that name a
 * group rather than a control, and state words that are text, not buttons.
 * Keep this list short and explain each entry; it is the escape hatch, not
 * the rule.
 */
const SHARED_TEXT_ALLOWLIST = new Set<string>([
  // Exceptions earn their place: each is text, not a second control.
  'key:enter_url', // the prompt() question behind Add Node -> link
  'key:share_link', // a toast message naming what just happened
  // The canvas right-click menu places these at the clicked point; the rail's
  // Insert section places them at the viewport centre. Same label, different
  // behaviour - a spatial command surface, not a duplicate.
  'key:add_sticky',
  'key:create_group',
  // /projects: the rail's Filters section owns the standing clear control; the
  // column's EmptyState shows the same words only when a filtered list came
  // back empty - recovery copy inside an empty state, not a second toolbar.
  'key:clear_filters',
]);

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

  it('puts each control in the column or the rail, never both', () => {
    // A control that appears in both is not "one gesture away" - it is
    // furniture. Worse, it teaches the reader the rail is a copy, and they
    // stop looking there. The rule that lets the column be calm is that
    // moving a control to the rail *moves* it.
    const offenders: string[] = [];
    for (const page of pages) {
      const { rail, page: rest } = splitRail(page.source);
      const inRail = controlLabels(rail);
      const inPage = controlLabels(rest);
      for (const label of inRail) {
        if (inPage.has(label) && !SHARED_TEXT_ALLOWLIST.has(label)) {
          offenders.push(`${page.path}: "${label.slice(label.indexOf(':') + 1)}" is in the rail and in the page`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('binds each piece of state to a control in the column or the rail, never both', () => {
    // The label check above misses the common way a control gets duplicated:
    // a rail "Status" section of pressed buttons beside a column <Select> with
    // "All Status" / "Active" items. Different words, same control, because
    // both drive `statusFilter`. So compare state as well as words.
    //
    // A rail control *shows* its state (`aria-pressed={statusFilter === o}`,
    // `aria-checked`, `checked`, `value`). The column duplicates it when it
    // binds a control to the same state: `value={statusFilter}` or
    // `onValueChange={setStatusFilter}`. A rail button that only *calls* a
    // setter as a side effect (coaching jumps to the tab its filter affects)
    // shows nothing, so it is not counted.
    const offenders: string[] = [];
    for (const page of pages) {
      const { rail, page: rest } = splitRail(page.source);
      const setters = new Map(
        Array.from(page.source.matchAll(/const \[(\w+), (set\w+)\] = useState/g)).map((m) => [m[1], m[2]]),
      );
      const shown = new Set<string>();
      for (const m of rail.matchAll(/(?:aria-pressed|aria-checked|checked|pressed|value)=\{([^}]*)\}/g)) {
        for (const id of m[1].match(/\b\w+\b/g) ?? []) if (setters.has(id)) shown.add(id);
      }
      const bound = new Set<string>();
      for (const m of rest.matchAll(/\b(?:value|checked|pressed)=\{(\w+)\}/g)) if (setters.has(m[1])) bound.add(m[1]);
      for (const m of rest.matchAll(/on(?:ValueChange|CheckedChange|PressedChange|Change)=\{(set\w+)\}/g)) {
        for (const [state, setter] of setters) if (setter === m[1]) bound.add(state);
      }
      for (const state of shown) {
        if (bound.has(state)) offenders.push(`${page.path}: "${state}" has a control in the rail and in the page`);
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

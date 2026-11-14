import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

describe('phone touch floor', () => {
  it('lifts undersized controls only below the tablet breakpoint', () => {
    const start = css.indexOf('Call sites pin h-7');
    expect(start).toBeGreaterThan(0);
    const before = css.slice(0, start);
    const mediaStart = before.lastIndexOf('@media');
    const media = before.slice(mediaStart, start);
    expect(media).toContain('max-width: 639.98px');
    expect(media).not.toContain('min-width');
    const rule = css.slice(start, css.indexOf('.tap-target-y', start));
    // The phone ladder, 5% shorter since 2026-10-21 (--button-y, docs §64).
    expect(rule).toContain('min-height: calc(30.458px * var(--button-y))');
    expect(rule).toContain('.h-7');
    expect(rule).toContain('.h-8');
    expect(rule).toContain('.h-9');
    expect(rule).toContain('.h-10');
    expect(rule).toContain('.h-11');
    expect(rule).toContain('.w-7');
    expect(rule).toContain('.w-11');
    const phone = css.slice(mediaStart, css.indexOf('Reading measure', start));
    const tapStart = phone.indexOf('.tap-target-y {');
    const tapRule = phone.slice(tapStart, phone.indexOf('}', tapStart));
    expect(tapRule).toContain('min-height: calc(30.458px * var(--button-y))');
    expect(tapRule).not.toContain('44px');
    expect(phone).toContain(":is(button, a).min-h-14");
    // Choice lists stand as tall as the buttons (owner, 2026-10-24, docs
    // §101): native selects were 44px and select triggers 33px beside
    // 28.9px buttons. A text field keeps its own floor.
    const choice = phone.slice(phone.indexOf("html:root select:not([multiple]):not([size])"));
    expect(choice).toMatch(/^html:root select:not\(\[multiple\]\):not\(\[size\]\),\s*html:root button\[role='combobox'\] \{\s*height: calc\(30\.458px \* var\(--button-y\)\);\s*min-height: calc\(30\.458px \* var\(--button-y\)\);/);
    expect(phone).not.toMatch(/\bselect \{\s*min-height:\s*44px/);
  });

  it('gives every card-title link and person name the hit-area band', () => {
    const start = css.indexOf("#main-content .card-title a:not([class*='after:'])");
    expect(start).toBeGreaterThan(0);
    const block = css.slice(start, css.indexOf('/* ── Phones: one language', start));
    expect(block).toMatch(/#main-content a\.person-name:not\(\[class\*='after:'\]\) \{\s*position: relative;\s*\}/);
    expect(block).toMatch(/::after \{\s*content: '';\s*position: absolute;\s*top: -4px;\s*bottom: -4px;\s*left: 0;\s*right: 0;\s*\}/);
    // The stretched row link keeps its own ::after.
    expect(block).not.toMatch(/\.card-title a[^:]*\{/);
  });
});

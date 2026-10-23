import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Buttons are 5% shorter (owner, 2026-10-21, docs §64): one factor,
 * --button-y, multiplies every button height on the ladder. The sidebar,
 * the phone drawer and the tab bar set it back to 1. Buttons under 28px
 * (the xs size, 24px icon marks) are not on the ladder and keep their
 * height, so no label gets crowded. Type never reads the factor.
 */

const CSS = readFileSync('src/app/globals.css', 'utf8');
const BUTTON = readFileSync('src/components/ui/button.tsx', 'utf8');

describe('button height', () => {
  it('is 5% shorter through one factor', () => {
    expect(CSS).toMatch(/--button-y:\s*0\.95;/);
  });

  it('keeps the navigation at full height', () => {
    expect(CSS).toMatch(/\[data-sidenav\],\s*\[data-mobile-tabs\]\s*\{\s*--button-y:\s*1;\s*\}/);
  });

  it('scales the Button sizes, but not the small xs mark', () => {
    for (const size of ['sm', 'md', 'lg', 'xl']) {
      const line = BUTTON.split('\n').find((l) => l.trim().startsWith(`${size}:`));
      expect(line, size).toContain('min-h-[calc(30.458px*var(--button-y))]');
      expect(line, size).toContain('sm:min-h-[calc(32.997px*var(--button-y))]');
    }
    const icon = BUTTON.split('\n').find((l) => l.trim().startsWith('icon:'))!;
    expect(icon).toContain('h-[calc(30.458px*var(--button-y))]');
    const xs = BUTTON.split('\n').find((l) => l.trim().startsWith('xs:'))!;
    expect(xs).not.toContain('--button-y');
  });

  it('scales the ladder in the stylesheet, on a phone and from 640px', () => {
    expect(CSS).toContain('min-height: calc(28.939px * var(--button-y));');
    expect(CSS).toContain('min-height: calc(32.997px * var(--button-y));');
    expect(CSS).toContain('min-height: calc(2.75rem * var(--chrome-y) * var(--button-y));');
    // Row links and a one-line min-h-14/16 button share the phone floor.
    // A 44px × --button-y bar was the disproportionate height.
    expect(CSS).toContain('min-height: calc(30.458px * var(--button-y));');
    expect(CSS).not.toContain('min-height: calc(44px * var(--button-y));');
    expect(CSS).toContain(':is(button, a).min-h-14');
  });

  it('gives a row of controls one height from 640px, and keeps the phone floors', () => {
    // docs §69: fields, native selects, select triggers, search bars, the
    // header's Ask field and tap-targets are --control-h from 640px.
    const start = CSS.indexOf('One height for a row of controls');
    expect(start).toBeGreaterThan(0);
    const block = CSS.slice(start, CSS.indexOf('\n}\n', start));
    expect(block).toContain('@media (min-width: 640px)');
    expect(block).toContain('--control-h: calc(32.997px * var(--button-y));');
    for (const selector of [
      'html:root input.input-clean',
      'html:root select:not([multiple]):not([size])',
      "html:root button[role='combobox']",
      'html:root form[data-ask-ai]',
      "html:root .tap-target:not([class*='min-h-'])",
      "html:root button.absolute.tap-target[class~='top-1/2']",
    ]) {
      expect(block, selector).toContain(selector);
    }
    // On a phone a bare tap-target is the button floor, not a 44px box.
    expect(CSS).toMatch(
      /\.tap-target\s*\{\s*min-width:\s*calc\(30\.458px \* var\(--button-y\)\);\s*min-height:\s*calc\(30\.458px \* var\(--button-y\)\);\s*\}/,
    );
  });

  it('never touches type', () => {
    const readers = [...CSS.matchAll(/([\w-]+)\s*:[^;{}]*var\(--button-y\)/g)].map((m) => m[1]);
    expect(readers.length).toBeGreaterThan(10);
    for (const property of readers) {
      // --control-h (one height for a row of controls, §69) carries the same
      // factor; its own readers are held to the same rule below.
      expect(property).toMatch(/^(min-)?(height|width)$|^padding-(top|bottom)$|^top$|^--control-h$/);
    }
    const controlReaders = [...CSS.matchAll(/([\w-]+)\s*:[^;{}]*var\(--control-h\)/g)].map((m) => m[1]);
    expect(controlReaders.length).toBeGreaterThan(3);
    for (const property of controlReaders) {
      expect(property).toMatch(/^(min-)?(height|width)$/);
    }
  });
});

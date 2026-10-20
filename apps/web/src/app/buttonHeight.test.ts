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
    expect(CSS).toContain('min-height: calc(44px * var(--button-y));');
  });

  it('never touches type', () => {
    const readers = [...CSS.matchAll(/([\w-]+)\s*:[^;{}]*var\(--button-y\)/g)].map((m) => m[1]);
    expect(readers.length).toBeGreaterThan(10);
    for (const property of readers) {
      expect(property).toMatch(/^(min-)?(height|width)$|^padding-(top|bottom)$|^top$/);
    }
  });
});

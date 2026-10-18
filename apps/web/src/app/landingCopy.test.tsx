import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('landing copy', () => {
  it('wraps the public home in one-language copy and the landing type ladder', () => {
    const source = readFileSync('src/app/LandingHome.tsx', 'utf8');
    expect(source).toContain('PrimaryOnlyCopy');
    expect(source).toContain('landing-section');
    expect(source).not.toContain('landing-display-secondary');
    expect(source).not.toContain('stacked');
  });

  it('keeps landing display, section and lead on one ladder instead of poster vs ceiling', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    const from = css.indexOf('#main-content h1.landing-display');
    const block = css.slice(from, css.indexOf('/* ── One left axis', from));
    expect(block).toContain('h2.landing-section');
    expect(block).not.toMatch(/font-size:\s*48px/);
    expect(block).not.toMatch(/font-size:\s*60px/);
    expect(block).not.toMatch(/font-size:\s*36px/);
    expect(block).toMatch(/font-style:\s*normal/);
    expect(block).toMatch(/h1\.landing-display[\s\S]*?font-size:\s*15px/);
    expect(block).toContain('font-size: 18px');
    expect(block).toContain('font-size: 14px');
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The calm-reading pass lives in globals.css: status words are ink, both
 * languages share a size, a second filled button in an action row steps
 * back, and a line that is read stops at 75 characters.
 */

const CSS = readFileSync('src/app/globals.css', 'utf8');

describe('calm reading', () => {
  it('gives both languages the size of the line they sit in', () => {
    expect(CSS).toMatch(/\.bilingual-secondary \{\s*font-size: 1em;/);
    expect(CSS).not.toMatch(/font-size:\s*max\([^)]*0\.85em/);
  });

  it('drops the tinted frame around a status word and keeps a control chip', () => {
    expect(CSS).toMatch(/\.badge:not\(\[data-chip\]\):not\(button\):not\(a\):not\(\[role='button'\]\)/);
    expect(CSS).toMatch(/background-color: transparent !important;/);
  });

  it('keeps one filled action in a row and one language when that was asked', () => {
    expect(CSS).toMatch(/#main-content \[data-actions\]/);
    expect(CSS).toMatch(/html\[data-language-display='primary-only'\] \.bilingual-secondary/);
  });

  it('measures reading text at 75 characters, including a card body', () => {
    expect(CSS).toMatch(/main p\.card-body, main \.card-body p\) \{\s*max-width: 75ch;/);
  });

  it('frames a directory tag with a trace of ink, not a pastel well', () => {
    const rule = CSS.slice(CSS.indexOf('.quiet-tag'));
    expect(rule.startsWith('.quiet-tag')).toBe(true);
    expect(rule.slice(0, 520)).toMatch(/border: 1px solid hsl\(var\(--foreground\) \/ 0\.16\)/);
    expect(rule.slice(0, 520)).toMatch(/background-color: hsl\(var\(--foreground\) \/ 0\.04\)/);
    expect(rule.slice(0, 520)).not.toMatch(/--primary|--status/);
  });

  it('gives every investor card the same caption order', () => {
    const src = readFileSync('src/app/investors/page.tsx', 'utf8');
    const body = src.slice(src.indexOf('function InvestorCard'));
    const captions = ['Sectors', 'Stages', 'Cheque', 'Place', 'So far'];
    const order = captions.map((word) => body.indexOf(`en="${word}"`));
    expect(order.every((at) => at > 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(src.match(/quiet-tag/g)?.length).toBe(1);
    expect(body).not.toMatch(/<Badge[\s/>]/);
    expect(body.match(/Sample investor: there is no profile or inbox behind it/g)?.length).toBe(1);
  });

  it('keeps a search bar focus as a hairline, not the brand frame', () => {
    const rule = CSS.slice(CSS.indexOf('input[data-search-field]:focus'));
    expect(rule.startsWith('input[data-search-field]:focus')).toBe(true);
    expect(rule.slice(0, 280)).toMatch(/outline: 1px solid hsl\(var\(--foreground\) \/ 0\.28\) !important;/);
    expect(rule.slice(0, 280)).toMatch(/outline-offset: 0 !important;/);
    expect(rule.slice(0, 280)).not.toMatch(/var\(--ring\)/);
  });
});

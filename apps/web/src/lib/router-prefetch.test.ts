import { describe, expect, it } from 'vitest';
import { isPrefetchRequest } from './router-prefetch';

const headers = (entries: Record<string, string>) => new Headers(entries);

describe('isPrefetchRequest', () => {
  it('recognises the router prefetch of a Link in view', () => {
    expect(isPrefetchRequest(headers({ rsc: '1', 'next-router-prefetch': '1', 'next-router-segment-prefetch': '/_tree' }))).toBe(true);
  });

  it('recognises a segment prefetch on its own', () => {
    expect(isPrefetchRequest(headers({ rsc: '1', 'next-router-segment-prefetch': '/_tree' }))).toBe(true);
  });

  it('recognises the browser speculative loads', () => {
    expect(isPrefetchRequest(headers({ 'sec-purpose': 'prefetch;prerender' }))).toBe(true);
    expect(isPrefetchRequest(headers({ purpose: 'prefetch' }))).toBe(true);
  });

  it('treats a click (a navigation request) as a visit', () => {
    expect(isPrefetchRequest(headers({ rsc: '1', 'next-url': '/' }))).toBe(false);
    expect(isPrefetchRequest(headers({ accept: 'text/html' }))).toBe(false);
  });
});

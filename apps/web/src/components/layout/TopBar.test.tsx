import { describe, expect, it } from 'vitest';
import { CREATE_LINKS } from './TopBar';
import { PAGE_REGISTRY } from '@/lib/page-registry';

describe('Desktop top bar create menu (docs §131.1)', () => {
  it('lists only routes the registry already knows', () => {
    const known = new Set(PAGE_REGISTRY.map((page) => page.path));
    expect(CREATE_LINKS.length).toBeGreaterThanOrEqual(3);
    for (const link of CREATE_LINKS) {
      expect(known.has(link.href), link.href).toBe(true);
    }
  });
});

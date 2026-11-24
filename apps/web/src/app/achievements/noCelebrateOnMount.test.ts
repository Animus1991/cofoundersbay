import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('achievements (docs §132.6)', () => {
  it('never celebrates on mount — the page carries no confetti or celebrate handler to gate', () => {
    const src = readFileSync(join(__dirname, 'page.tsx'), 'utf8');
    // The handoff asks celebration only on a real unlock; the page ships
    // none, so this guard keeps it that way.
    expect(src).not.toMatch(/confetti|celebrat/i);
  });
});

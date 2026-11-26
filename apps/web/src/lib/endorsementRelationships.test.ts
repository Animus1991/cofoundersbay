import { describe, expect, it } from 'vitest';
import { ENDORSEMENT_RELATIONSHIPS, relationshipEl } from './endorsement-relationships';

describe('endorsement relationships in Greek (§162)', () => {
  it('says a stored relationship in Greek, whichever way it was written', () => {
    expect(relationshipEl('Peer founder')).toBe('Ιδρυτές και οι δύο');
    expect(relationshipEl('trial project')).toBe('Δοκιμαστικό έργο');
    expect(relationshipEl('Co-founder')).toBe('Συνιδρύσαμε');
    expect(relationshipEl('Mentor')).toBe('Ήμουν μέντορας');
    // A member's own words stay as written.
    expect(relationshipEl('Υπάλληλός μου')).toBe('Υπάλληλός μου');
  });

  it('names no giver in the masculine', () => {
    const greek = ENDORSEMENT_RELATIONSHIPS.map((r) => r.el);
    expect(greek).not.toContain('Συνιδρυτής');
    expect(greek).not.toContain('Πελάτης');
    expect(greek).not.toContain('Επενδυτής');
  });
});

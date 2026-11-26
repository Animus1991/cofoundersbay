import { describe, expect, it } from 'vitest';
import { ENDORSEMENT_RELATIONSHIPS, relationshipEl } from './endorsement-relationships';

describe('endorsement relationships in Greek (§162)', () => {
  it('names the relationship itself on the card, whichever way it was written', () => {
    expect(relationshipEl('Peer founder')).toBe('Ιδρυτές και οι δύο');
    expect(relationshipEl('trial project')).toBe('Δοκιμαστικό έργο');
    expect(relationshipEl('Co-founder')).toBe('Συνίδρυση');
    // Either direction of mentoring, and the demo's "Mentor", is one relationship.
    expect(relationshipEl('Mentor')).toBe('Καθοδήγηση');
    expect(relationshipEl('I mentored them')).toBe('Καθοδήγηση');
    // A member's own words stay as written.
    expect(relationshipEl('Υπάλληλός μου')).toBe('Υπάλληλός μου');
  });

  it('names no giver in the masculine, on the chips or the card', () => {
    const greek = ENDORSEMENT_RELATIONSHIPS.flatMap((r) => [r.el, r.kindEl]);
    for (const word of ['Συνιδρυτής', 'Πελάτης', 'Επενδυτής']) expect(greek).not.toContain(word);
  });
});

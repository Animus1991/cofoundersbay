import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RoleBadge } from '@/components/common/RoleBadge';
import { RoleName } from '@/components/common/RoleName';
import { headlineNamesRole } from './role-family';

describe('the role badge is said once (owner, §162.3 / §166)', () => {
  it('knows when a headline already names the role, in either language', () => {
    expect(headlineNamesRole('founder', 'Founder & CEO at Harbor')).toBe(true);
    expect(headlineNamesRole('cofounder', 'Technical cofounder · Full-stack')).toBe(true);
    expect(headlineNamesRole('mentor', 'Startup mentor · Former product lead · 3x founder')).toBe(true);
    expect(headlineNamesRole('angel_investor', 'Angel investor · Seed')).toBe(true);
    // Greek, either gender, with or without accents.
    expect(headlineNamesRole('founder', 'Ιδρύτρια και CEO στο Harbor')).toBe(true);
    expect(headlineNamesRole('investor', 'Επενδύτρια σε fintech')).toBe(true);
    expect(headlineNamesRole('mentor', 'Μέντορας για ομάδες προϊόντος')).toBe(true);
  });

  it('keeps the badge when the headline says something else', () => {
    expect(headlineNamesRole('founder', 'Product designer in Athens')).toBe(false);
    // A mentor who once founded: the headline does not say "mentor".
    expect(headlineNamesRole('mentor', 'Former founder, now helping teams ship')).toBe(false);
    expect(headlineNamesRole('investor', null)).toBe(false);
    expect(headlineNamesRole(null, 'Founder')).toBe(false);
  });

  it('draws no badge and no role word beside a headline that names the role', () => {
    const hidden = render(<RoleBadge role="founder" headline="Founder & CEO at Harbor" />);
    expect(hidden.container.textContent).toBe('');
    hidden.unmount();
    const shown = render(<RoleBadge role="founder" headline="Product designer in Athens" />);
    expect(shown.container.textContent).toContain('Founder');
    shown.unmount();
    expect(render(<RoleName role="mentor" headline="Startup mentor" />).container.textContent).toBe('');
  });
});

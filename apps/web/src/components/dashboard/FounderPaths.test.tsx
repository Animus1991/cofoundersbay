import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FOUNDER_PATHS, FounderPaths } from './FounderPaths';

describe('FounderPaths', () => {
  it('opens the three existing tools and does not promise funding', () => {
    render(<FounderPaths />);
    for (const path of FOUNDER_PATHS) {
      expect(screen.getByRole('link', { name: new RegExp(path.titleEn) }).getAttribute('href')).toBe(path.href);
    }
    expect(screen.getByText(/Nothing here promises funding/)).toBeTruthy();
    expect(document.querySelectorAll('[data-card]')).toHaveLength(3);
  });
});

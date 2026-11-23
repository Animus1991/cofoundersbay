import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CfbCast, CfbFigure } from './CfbCast';

afterEach(cleanup);

describe('CfbCast figures', () => {
  it.each(['founder', 'mentor', 'investor', 'builder'] as const)('%s marks exactly one accent element', (id) => {
    const { container } = render(<CfbFigure id={id} />);
    const svg = container.querySelector(`svg[data-cfb-figure="${id}"]`);
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelectorAll('[data-accent]').length).toBe(1);
  });

  it('the cast renders all four figures on one soft ground', () => {
    const { container } = render(<CfbCast />);
    expect(container.querySelectorAll('svg[data-cfb-figure]').length).toBe(4);
    expect(container.querySelector('[data-cfb-figure="founder"]')).not.toBeNull();
    expect(container.querySelector('[data-cfb-figure="builder"]')).not.toBeNull();
  });
});

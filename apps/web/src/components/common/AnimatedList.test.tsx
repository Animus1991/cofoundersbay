import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AnimatedList } from './AnimatedList';

afterEach(cleanup);

describe('AnimatedList', () => {
  it('staggers the entrance without pinning children at opacity 0', () => {
    render(
      <AnimatedList animation="fade-in-up" staggerDelay={50}>
        <div data-testid="a" />
        <div data-testid="b" />
      </AnimatedList>,
    );
    for (const [testId, delay] of [['a', '0ms'], ['b', '50ms']] as const) {
      const child = screen.getByTestId(testId);
      expect(child.className).toContain('animate-fade-in-up');
      expect(child.className).not.toContain('opacity-0');
      expect(child.style.animationDelay).toBe(delay);
    }
  });
});

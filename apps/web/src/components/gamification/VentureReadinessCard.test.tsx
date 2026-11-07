import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { VentureReadinessCard } from './VentureReadinessCard';

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useQuery: vi.fn(),
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a> }));

const loaded = {
  overall: 61,
  dimensions: [{ key: 'idea', label: 'Idea', labelEl: 'Ιδέα', score: 70, weight: 1, summary: 'Clear' }],
};

// A hook of its own, as the real useQuery has: with none, React reads the second
// render as a first one and the crash cannot show.
function queryReturns(result: { data: unknown; isLoading: boolean }) {
  vi.mocked(useQuery).mockImplementation((() => {
    useState(0);
    return result;
  }) as never);
}

afterEach(cleanup);

// docs §113: the first real account would have crashed here. The card loads on a
// real account and arrives ready in the demo, so only the former changed hooks.
describe('the readiness card on a real account', () => {
  it('survives going from loading to loaded', () => {
    queryReturns({ data: undefined, isLoading: true });
    const { rerender } = render(<VentureReadinessCard />);
    queryReturns({ data: loaded, isLoading: false });
    expect(() => rerender(<VentureReadinessCard />)).not.toThrow();
    expect(screen.getAllByText(/61/).length).toBeGreaterThan(0);
  });
});

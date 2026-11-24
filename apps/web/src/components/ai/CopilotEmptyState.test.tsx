import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { CopilotEmptyState } from './CopilotEmptyState';
import { copilotStartersFor } from '@/lib/copilot-starters';

vi.mock('next/navigation', () => ({ usePathname: () => '/ai' }));

afterEach(cleanup);
const wrap = (ui: React.ReactElement) => render(<LanguagePreferenceProvider>{ui}</LanguagePreferenceProvider>);

describe('the empty conversation’s starters (docs §132.7)', () => {
  it('a page-aware starter chip asks through the existing prompt handler', () => {
    const onAsk = vi.fn();
    wrap(<CopilotEmptyState surface="page" onAsk={onAsk} onOpenCapabilities={vi.fn()} />);
    const first = copilotStartersFor('page', { pathname: '/ai', role: undefined }).reads[0];
    expect(first).toBeTruthy();
    const chip = screen.getAllByRole('button').find((b) => b.getAttribute('aria-label')?.startsWith(first.en));
    expect(chip).toBeTruthy();
    fireEvent.click(chip as HTMLElement);
    expect(onAsk).toHaveBeenCalledWith(first.en);
  });

  it('greets the reader by name next to the cast figure', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1', displayName: 'Maria Pap' }));
    const { container } = wrap(<CopilotEmptyState surface="page" onAsk={vi.fn()} onOpenCapabilities={vi.fn()} />);
    expect(container.querySelector('svg[data-cfb-figure]')).not.toBeNull();
    expect(screen.getByText(/Hello, Maria|Γεια σας, Maria/)).toBeTruthy();
    localStorage.removeItem('user');
  });
});

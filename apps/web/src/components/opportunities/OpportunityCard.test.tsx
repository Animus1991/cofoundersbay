import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';
import type { OpportunityItem } from '@/lib/api';
import { OpportunityCard } from './OpportunityCard';

/**
 * One button (docs §115): the way to act on the listing is the button;
 * everything else it could always do is in the card's menu.
 */

const { askSpy } = vi.hoisted(() => ({ askSpy: vi.fn() }));
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask: askSpy }) }));

const opportunity: OpportunityItem = {
  id: 'opp-1',
  title: 'Growth lead for Harbor',
  description: 'Own the first clinics.',
  type: 'job',
  company: 'Harbor',
  location: 'Athens',
  isRemote: false,
  url: null,
  tags: ['Growth'],
  deadline: null,
  isActive: true,
  createdBy: { id: 'u-1', displayName: 'Nikos Andreou', avatarUrl: null },
  createdAt: '2026-11-01T10:00:00Z',
};

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );

const moreMenu = () => screen.getByRole('button', { name: /^More actions/ });

function openMoreMenu() {
  const trigger = moreMenu();
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return screen.findByRole('menu');
}

// Same jsdom shims UserMenu.test.tsx needs: Radix's DropdownMenu positions its
// content with Popper and drives the trigger through the Pointer Capture API.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

afterEach(() => {
  cleanup();
  askSpy.mockReset();
});

describe('OpportunityCard, one button', () => {
  it('with its own link: Apply now is the button; the proposal and the draft are in the menu', async () => {
    wrap(<OpportunityCard opportunity={{ ...opportunity, url: 'https://jobs.example.com/apply' }} onPropose={vi.fn()} />);
    const apply = screen.getByRole('link', { name: /Apply now/ });
    expect(apply.getAttribute('href')).toBe('https://jobs.example.com/apply');
    expect(screen.queryByRole('button', { name: /Send a proposal|Draft an approach/ })).toBeNull();
    const menu = await openMoreMenu();
    expect(within(menu).getByRole('menuitem', { name: /Send a proposal/ })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: /Draft an approach/ })).toBeTruthy();
  });

  it('without a link: Send a proposal is the button; the draft is in the menu', async () => {
    wrap(<OpportunityCard opportunity={opportunity} onPropose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Send a proposal/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Draft an approach/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Apply now/ })).toBeNull();
    const menu = await openMoreMenu();
    expect(within(menu).getByRole('menuitem', { name: /Draft an approach/ })).toBeTruthy();
    expect(within(menu).queryByRole('menuitem', { name: /Send a proposal/ })).toBeNull();
  });

  it('after the proposal went: the badge says so and "Send a proposal" is nowhere', () => {
    wrap(<OpportunityCard opportunity={opportunity} onPropose={vi.fn()} proposalSent />);
    expect(screen.getByText(/Proposal sent/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Send a proposal/ })).toBeNull();
    expect(screen.queryByText(/Send a proposal/)).toBeNull();
    // The draft is the one way left to act on it.
    expect(screen.getByRole('button', { name: /Draft an approach/ })).toBeTruthy();
  });
});

describe('OpportunityCard, its facts (docs §160)', () => {
  it('says remote once when the place is "Remote", and has no kind pill on its own page', () => {
    const { container } = wrap(<OpportunityCard opportunity={{ ...opportunity, isRemote: true, location: 'Remote' }} />);
    expect((container.textContent?.match(/Remote/g) ?? []).length).toBe(1);
    expect(screen.queryByText(/^Opportunity$/)).toBeNull();
  });

  it('shows each tag in its own frame', () => {
    wrap(<OpportunityCard opportunity={{ ...opportunity, tags: ['cofounder', 'logistics', 'saas'] }} />);
    for (const tag of ['cofounder', 'logistics', 'saas']) {
      expect(screen.getByText(tag).className).toContain('quiet-tag');
    }
  });
});


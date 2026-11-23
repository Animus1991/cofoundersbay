import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import { InvestorCard, type Investor } from './InvestorCard';

const investor: Investor = {
  id: 'i-1',
  userId: 'u-1',
  displayName: 'Anna Example',
  industries: [],
  stages: [],
  geographies: [],
  sample: false,
};

/** Radix menus go through Popper and pointer capture, which jsdom lacks (see UserMenu.test). */
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

afterEach(() => cleanup());

describe('InvestorCard, one button at every width (docs §125)', () => {
  it('keeps Message directly as the one action; the introduction and the profile are in the menu', async () => {
    render(<InvestorCard investor={investor} saved={false} onToggleSave={vi.fn()} />);
    const link = screen.getByRole('link', { name: /Message Anna Example directly/ });
    expect(link.getAttribute('href')).toBe('/messages?to=u-1');
    expect(link.textContent).toContain('Message directly');
    expect(screen.queryByRole('button', { name: /Ask for an introduction|Profile/ })).toBeNull();
    const trigger = screen.getByRole('button', { name: /^More actions/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /Ask for an introduction/ })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: /Profile/ }).getAttribute('href')).toBe('/profiles/u-1');
  });
});

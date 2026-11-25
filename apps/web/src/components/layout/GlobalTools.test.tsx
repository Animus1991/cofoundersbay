import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatingGlobalTools, GlobalTools } from './GlobalTools';

vi.mock('./UserMenu', () => ({ UserMenu: ({ nameFrom }: { nameFrom?: string }) => <span data-name-from={nameFrom}>account</span> }));
vi.mock('./NotificationsBell', () => ({ NotificationsBell: () => <span>bell</span> }));
vi.mock('@/components/common/LanguageSwitcher', () => ({ LanguageSwitcher: () => <span>language</span> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));

/**
 * The floating copy of Create, language, notifications and account (docs §146,
 * §147, §151): icons only, and only while the reader scrolls back up once the
 * page's own copy is off screen. Shown for as long as that copy was away, it
 * sat on the pitch deck's Export and Save.
 */
let intersecting = false;
class FakeObserver {
  constructor(private readonly callback: (entries: { isIntersecting: boolean }[]) => void) {}
  observe() { this.callback([{ isIntersecting: intersecting }]); }
  disconnect() {}
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
  fireEvent.scroll(window);
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  scrollTo(0);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the floating global tools', () => {
  it('stay hidden while the page’s copy is on screen', () => {
    intersecting = true;
    const { container } = render(<><GlobalTools inline /><FloatingGlobalTools /></>);
    scrollTo(400);
    scrollTo(200);
    expect(container.querySelector('[data-floating-tools]')!.getAttribute('data-floating-tools')).toBe('hidden');
  });

  it('appear only when the reader scrolls back up, once the page’s copy is away', () => {
    intersecting = false;
    const { container } = render(<><GlobalTools inline /><FloatingGlobalTools /></>);
    const state = () => container.querySelector('[data-floating-tools]')!.getAttribute('data-floating-tools');
    act(() => scrollTo(900));
    expect(state()).toBe('hidden');
    act(() => scrollTo(600));
    expect(state()).toBe('shown');
    act(() => scrollTo(1200));
    expect(state()).toBe('hidden');
  });

  it('are icons only: no Create word, no account name', () => {
    intersecting = false;
    const { container } = render(<><GlobalTools inline /><FloatingGlobalTools /></>);
    const floating = container.querySelector('[data-floating-tools]')!;
    expect(floating.querySelector('[data-name-from]')!.getAttribute('data-name-from')).toBe('never');
    expect(floating.querySelector('[data-global-create] span')!.className).toBe('hidden');
  });
});

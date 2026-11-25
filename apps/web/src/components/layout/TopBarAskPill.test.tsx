import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TopBar } from './TopBar';

const nav = { pathname: '/matches' };
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@/contexts/PopupChatContext', () => ({ usePopupChatOptional: () => null }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
vi.mock('./SearchBar', () => ({ SearchBar: () => null }));
vi.mock('./UserMenu', () => ({ UserMenu: () => <span>account</span> }));
vi.mock('./MobileNav', () => ({ MobileNav: () => null }));
vi.mock('./NotificationsBell', () => ({ NotificationsBell: () => <span>bell</span> }));
vi.mock('@/components/theme/ThemeSwitcher', () => ({ ThemeSwitcher: () => null }));
vi.mock('@/components/common/LanguageSwitcher', () => ({ LanguageSwitcher: () => <span>language</span> }));
vi.mock('@/components/common/OfflineIndicator', () => ({ DemoExitInTopBar: () => null }));

/**
 * The desktop top bar (docs §145, §146). Its "Ask or search…" pill opened
 * the same assistant every page's own field asks, so it is gone everywhere.
 * Create, language, notifications and account live in each page's first
 * block now; the bar remains only where a page has none (/messages, /ai,
 * the canvas), and there it holds those four.
 */
afterEach(cleanup);

describe('the desktop top bar', () => {
  it('is not drawn by default: the page holds the tools', () => {
    render(<TopBar />);
    expect(document.querySelector('[data-desktop-topbar]')).toBeNull();
    expect(screen.queryByRole('button', { name: /Ask or search/ })).toBeNull();
  });

  it('holds Create, language, notifications and account where asked for, with no ask pill', () => {
    render(<TopBar desktopBar />);
    const bar = document.querySelector('[data-desktop-topbar]')!;
    expect(bar).toBeTruthy();
    expect(bar.querySelector('[data-global-create]')).toBeTruthy();
    expect(bar.textContent).toContain('language');
    expect(bar.textContent).toContain('bell');
    expect(bar.textContent).toContain('account');
    expect(screen.queryByRole('button', { name: /Ask or search/ })).toBeNull();
  });
});

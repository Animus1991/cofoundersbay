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
 * One way to ask on /home (docs §145): the top bar's pill opens the same
 * assistant the hero's field asks, so there it goes. Every other page keeps
 * it, and the create menu, language, bell and account stay on every page.
 */
afterEach(cleanup);

describe('the top bar ask pill', () => {
  it('is on an ordinary page', () => {
    nav.pathname = '/matches';
    render(<TopBar />);
    expect(screen.getByRole('button', { name: /Ask or search/ })).toBeTruthy();
  });

  it('is not on /home, where the hero field asks; the account controls stay', () => {
    nav.pathname = '/home';
    render(<TopBar />);
    expect(screen.queryByRole('button', { name: /Ask or search/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Create/ })).toBeTruthy();
    expect(screen.getAllByText('bell').length).toBeGreaterThan(0);
    expect(screen.getAllByText('account').length).toBeGreaterThan(0);
  });
});

import type { AnchorHTMLAttributes } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileNav } from './MobileNav';
import { MobileBottomNav } from './MobileBottomNav';
import { SidebarProvider } from './SidebarContext';
import { getSectionsForMode, getUnifiedSections, type SidebarMode } from './nav-modes';
import { getNavLabelEl, getNavSectionEl } from '@/lib/i18n/strings-nav';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';

const state = vi.hoisted(() => ({ pathname: '/dashboard/founder', role: 'founder' as string | undefined, messages: 3, intros: 2, notifications: 4, prefetch: vi.fn() }));

vi.mock('next/navigation', () => ({ usePathname: () => state.pathname, useRouter: () => ({ prefetch: state.prefetch }) }));
vi.mock('next/link', () => ({
  default: ({ href, prefetch, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a {...props} href={href} onClick={(event) => { onClick?.(event); event.preventDefault(); }} />
  ),
}));
vi.mock('@/hooks/useStoredUser', () => ({ useStoredUser: () => state.role ? { displayName: 'Alex Demo', role: state.role, email: 'alex@example.com' } : null }));
vi.mock('@/hooks/useUnreadCounts', () => ({ useUnreadCounts: () => ({ messages: state.messages, intros: state.intros, notifications: state.notifications }) }));

function Navigation() {
  return <LanguagePreferenceProvider><SidebarProvider><MobileNav /><MobileBottomNav /></SidebarProvider></LanguagePreferenceProvider>;
}

function openDrawer() {
  const trigger = screen.getByRole('button', { name: /Open navigation/ });
  trigger.focus();
  fireEvent.click(trigger);
  return screen.getByRole('dialog');
}

beforeEach(() => {
  localStorage.clear();
  state.pathname = '/dashboard/founder';
  state.role = 'founder';
});
afterEach(cleanup);

describe('Mobile navigation destinations', () => {
  // The three modes became one list (docs §64). Every destination of every
  // former mode must still be there, translated: opening each closed section
  // by its name reaches all of them.
  it.each(['founder', 'mentor', 'investor', 'service_provider', 'org', 'admin', 'tenant_admin'])('preserves every existing destination and translation for %s in the single list', (role) => {
    localStorage.setItem('cfb:language-display', 'bilingual');
    state.role = role;
    render(<Navigation />);
    const drawer = openDrawer();
    const navigation = within(drawer).getByRole('navigation');
    for (const header of within(navigation).getAllByRole('button')) {
      if (header.getAttribute('aria-expanded') === 'false') fireEvent.click(header);
    }
    for (const header of within(navigation).getAllByRole('button')) {
      expect(header.getAttribute('aria-expanded')).toBe('true');
    }
    // A destination listed in two former modes (the assistant: Work's "AI
    // Assistant", Explore's "Ask AI") appears once, under its first name.
    const checked = new Set<string>();
    for (const mode of ['work', 'explore', 'account'] as SidebarMode[]) {
      for (const section of getSectionsForMode(mode, role)) {
        expect(navigation.textContent).toContain(getNavSectionEl(section.section) ?? section.section);
        for (const link of section.links) {
          if (checked.has(link.href)) continue;
          checked.add(link.href);
          const anchor = Array.from(navigation.querySelectorAll('a')).find((element) => element.getAttribute('href') === link.href);
          expect(anchor, link.href).toBeDefined();
          expect(anchor!.textContent).toContain(link.label);
          const greek = getNavLabelEl(link.href);
          if (greek) expect(anchor!.textContent).toContain(greek);
        }
      }
    }
    // Each destination once.
    const hrefs = Array.from(navigation.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('opens the role\'s work and the current page\'s section, and keeps the rest as section names', () => {
    state.pathname = '/events';
    render(<Navigation />);
    const navigation = within(openDrawer()).getByRole('navigation');
    const sections = getUnifiedSections('founder');
    const headers = within(navigation).getAllByRole('button');
    expect(headers).toHaveLength(sections.length);
    const open = sections.filter((section, i) => headers[i].getAttribute('aria-expanded') === 'true').map((s) => s.id);
    expect(open).toContain('work:Dashboard');
    expect(open).toContain('explore:Community');
    expect(open).not.toContain('account:Settings');
    expect(navigation.querySelector('a[href="/events"]')?.getAttribute('aria-current')).toBe('page');
  });

  it('remembers a section the reader opened or closed', () => {
    const first = render(<Navigation />);
    let navigation = within(openDrawer()).getByRole('navigation');
    fireEvent.click(within(navigation).getByRole('button', { name: /^Network/ }));
    fireEvent.click(within(navigation).getByRole('button', { name: /^Build/ }));
    expect(navigation.querySelector('a[href="/connections"]')).not.toBeNull();
    expect(navigation.querySelector('a[href="/builder"]')).toBeNull();
    first.unmount();
    render(<Navigation />);
    navigation = within(openDrawer()).getByRole('navigation');
    expect(navigation.querySelector('a[href="/connections"]')).not.toBeNull();
    expect(navigation.querySelector('a[href="/builder"]')).toBeNull();
  });

  it('marks only the most specific destination as current', () => {
    state.pathname = '/builder/pitch-deck';
    render(<Navigation />);
    const navigation = within(openDrawer()).getByRole('navigation');
    const current = navigation.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('href')).toBe('/builder/pitch-deck');
  });

  it('does not mark similarly prefixed routes as current', () => {
    state.pathname = '/builder-extra';
    render(<Navigation />);
    expect(within(openDrawer()).getByRole('navigation').querySelector('[aria-current="page"]')).toBeNull();
  });

  it('closes when the already-current destination is selected', async () => {
    render(<Navigation />);
    const navigation = within(openDrawer()).getByRole('navigation');
    fireEvent.click(navigation.querySelector('a[href="/dashboard/founder"]')!);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does not close for modifier-click navigation', () => {
    render(<Navigation />);
    const navigation = within(openDrawer()).getByRole('navigation');
    fireEvent.click(navigation.querySelector('a[href="/dashboard/founder"]')!, { ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('retains both sign-in and sign-up as single interactive links for guests', () => {
    state.role = undefined;
    render(<Navigation />);
    const drawer = openDrawer();
    for (const href of ['/login', '/register']) {
      const link = drawer.querySelector(`a[href="${href}"]`)!;
      expect(link).not.toBeNull();
      expect(link.querySelector('button')).toBeNull();
      expect(link.querySelector('[lang="en"]')).not.toBeNull();
    }
  });
});

describe('Mobile drawer keyboard and language', () => {
  it('opens from More and returns focus there after Escape', async () => {
    render(<Navigation />);
    const more = screen.getByRole('button', { name: /More destinations/ });
    more.focus();
    fireEvent.click(more);
    const drawer = screen.getByRole('dialog');
    expect(more.getAttribute('aria-controls')).toBe(drawer.id);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(drawer, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(more));
  });

  it('closes on pathname changes', async () => {
    const view = render(<Navigation />);
    openDrawer();
    state.pathname = '/discover';
    view.rerender(<Navigation />);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows one language on all five bottom destinations until the reader asks for both', () => {
    render(<Navigation />);
    const bar = screen.getByRole('navigation', { name: /Primary mobile navigation/ });
    const actions = [...within(bar).getAllByRole('link'), within(bar).getByRole('button')];
    expect(actions).toHaveLength(5);
    actions.forEach((action) => {
      expect(action.querySelector('[lang="en"]')).not.toBeNull();
      expect(action.querySelector('[lang="el"]')).toBeNull();
    });
  });

  it('shows both languages on the bottom bar when that display is stored', () => {
    localStorage.setItem('cfb:language-display', 'bilingual');
    render(<Navigation />);
    const bar = screen.getByRole('navigation', { name: /Primary mobile navigation/ });
    const actions = [...within(bar).getAllByRole('link'), within(bar).getByRole('button')];
    expect(actions).toHaveLength(5);
    actions.forEach((action) => {
      expect(action.querySelector('[lang="en"]')).not.toBeNull();
      expect(action.querySelector('[lang="el"]')).not.toBeNull();
    });
  });

  it('honors Greek-first preference while preserving English labels', () => {
    localStorage.setItem('cfb:primary-language', 'el');
    localStorage.setItem('cfb:language-display', 'bilingual');
    render(<Navigation />);
    const bar = screen.getByRole('navigation', { name: /Primary mobile navigation/ });
    const profile = bar.querySelector('a[href="/profile"]')!;
    expect(profile.querySelector('[lang]')?.getAttribute('lang')).toBe('el');
    expect(profile.textContent).toContain('Profile');
  });

  it('shows a closed section\'s unread count on its name, and on the link once open', () => {
    render(<Navigation />);
    const navigation = within(openDrawer()).getByRole('navigation');
    const activity = within(navigation).getByRole('button', { name: /^Activity/ });
    expect(activity.getAttribute('aria-expanded')).toBe('false');
    expect(activity.textContent).toContain('4');
    fireEvent.click(activity);
    expect(navigation.querySelector('a[href="/notifications"]')?.textContent).toContain('4');
  });

  it.each(['/login', '/register', '/auth/oauth-callback', '/onboarding'])('hides the bottom bar on %s', (pathname) => {
    state.pathname = pathname;
    render(<Navigation />);
    expect(screen.queryByRole('navigation', { name: /Primary mobile navigation/ })).toBeNull();
  });
});

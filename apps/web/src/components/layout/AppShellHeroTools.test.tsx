import { useContext } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { HeroActionsSlot } from './PageHeaderSlot';

/**
 * Hero mode (docs §133.5): with the title sr-only the header's tools would
 * float alone in an empty band, so they portal into the hero card's corner
 * slot instead — same buttons, same handlers.
 */

let pathname = '/home';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('./SideNav', () => ({ SideNav: () => <nav aria-label="Primary" /> }));
vi.mock('./TopBar', () => ({ TopBar: () => <header /> }));
// Create, language, notifications and account (docs §146): their own providers are not this test's subject.
vi.mock('./GlobalTools', () => ({ GLOBAL_TOOLS_PLACEMENT: 'page', GlobalTools: ({ inline }: { inline?: boolean }) => <div data-global-tools={inline ? 'inline' : 'floating'} />, FloatingGlobalTools: () => null }));
vi.mock('./MobileBottomNav', () => ({ MobileBottomNav: () => <nav aria-label="Sections" /> }));
vi.mock('./CommandPaletteHost', () => ({ CommandPaletteHost: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('./PageRail', () => ({ PageRail: () => null }));
vi.mock('@/components/ai/AIComposer', () => ({ AIComposer: () => null }));
vi.mock('./PinPageButton', () => ({
  PinPageButton: () => <button type="button" data-testid="pin-current-page" aria-label="Pin" />,
  isPinnablePath: () => true,
}));

function HeroCard() {
  const setSlot = useContext(HeroActionsSlot);
  return (
    <section data-testid="hero-card">
      <div ref={setSlot} data-testid="hero-actions" />
    </section>
  );
}

afterEach(cleanup);

describe('header tools in hero mode (docs §133.5)', () => {
  it('portals the tools into the hero card’s corner when the title is sr-only', () => {
    const { container } = render(
      <AppShell title="Home" titleEl="Αρχική" titleSrOnly askAi={false}>
        <HeroCard />
      </AppShell>,
    );
    const hero = screen.getByTestId('hero-card');
    expect(within(hero).getByTestId('pin-current-page')).toBeTruthy();
    expect(within(screen.getByTestId('hero-actions')).getByTestId('pin-current-page')).toBeTruthy();
    // The header keeps no actions band: the title is sr-only and the tools moved.
    expect(container.querySelector('header [data-page-actions]')).toBeNull();
    expect(container.querySelector('header [data-page-header]')!.className).toContain('sr-only');
    // Create, language, notifications and account join them there (docs §146), once.
    expect(screen.getByTestId('hero-actions').querySelectorAll('[data-global-tools="inline"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-global-tools="inline"]')).toHaveLength(1);
  });

  it('keeps the tools in the header on an ordinary page', () => {
    pathname = '/jobs';
    const { container } = render(
      <AppShell title="Jobs" titleEl="Θέσεις">
        <HeroCard />
      </AppShell>,
    );
    expect(container.querySelector('header [data-page-actions]')).toBeTruthy();
    expect(screen.queryByTestId('pin-current-page')).toBeTruthy();
    expect(within(screen.getByTestId('hero-card')).queryByTestId('pin-current-page')).toBeNull();
    // The four global tools stand at the right of the page header (docs §146).
    expect(container.querySelectorAll('header [data-global-tools="inline"]')).toHaveLength(1);
    pathname = '/home';
  });
});

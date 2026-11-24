import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { PageContextualHelp } from '@/components/common/PageContextualHelp';
import { getPageMeta } from '@/lib/page-registry';

/**
 * With the "?" affordance on the page, the registry description leaves the
 * header after the first visit and lives as the help sheet's first
 * paragraph — the sentence is one tap away, not on every visit.
 */

let pathname = '/jobs';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
// The chrome the landmark rule needs is real; the row machinery is a stand-in.
vi.mock('./SideNav', () => ({ SideNav: () => <nav aria-label="Primary" /> }));
vi.mock('./TopBar', () => ({ TopBar: () => <header /> }));
vi.mock('./MobileBottomNav', () => ({ MobileBottomNav: () => <nav aria-label="Sections" /> }));
vi.mock('./CommandPaletteHost', () => ({ CommandPaletteHost: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('./PageRail', () => ({ PageRail: () => null }));
vi.mock('@/components/ai/AIComposer', () => ({ AIComposer: () => null }));
vi.mock('./PinPageButton', () => ({ PinPageButton: () => null, isPinnablePath: () => true }));

const flag = () => localStorage.getItem('cfb:seen-desc:/jobs');

afterEach(() => {
  cleanup();
  localStorage.clear();
  pathname = '/jobs';
});

describe('the page lead folds into the help sheet', () => {
  it('prints under the title on the first visit, then writes the flag', async () => {
    render(<AppShell showHelp><p>body</p></AppShell>);
    const text = await screen.findByText('Equity, full-time, and contract roles posted by startups on the platform.');
    // The reveal is a macrotask after mount (StrictMode-safe), not paint-time.
    await waitFor(() => expect(text.closest('[hidden]')).toBeNull());
    await waitFor(() => expect(flag()).toBe('1'));
    // The lead stays for the rest of this visit — the flag only hides the next.
    expect(text.closest('[hidden]')).toBeNull();
  });

  it('stays in the DOM but hidden once the route was seen', async () => {
    localStorage.setItem('cfb:seen-desc:/jobs', '1');
    render(<AppShell showHelp><p>body</p></AppShell>);
    const text = await screen.findByText('Equity, full-time, and contract roles posted by startups on the platform.');
    expect(text.closest('[hidden]')).not.toBeNull();
  });

  it('prints on every visit when the page carries no help affordance', async () => {
    localStorage.setItem('cfb:seen-desc:/jobs', '1');
    render(<AppShell><p>body</p></AppShell>);
    const text = await screen.findByText('Equity, full-time, and contract roles posted by startups on the platform.');
    expect(text.closest('[hidden]')).toBeNull();
  });

  it('opens the help sheet with that description as its first paragraph', () => {
    const { container } = render(<PageContextualHelp compact defaultOpen />);
    const description = getPageMeta('/jobs')?.description;
    expect(description).toBeTruthy();
    const firstParagraph = container.querySelector('[role="note"] p');
    expect(firstParagraph?.textContent).toBe(description);
  });
});

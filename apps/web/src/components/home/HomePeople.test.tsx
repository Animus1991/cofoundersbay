import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePeople } from './HomePeople';
import type { SearchHit } from '@/lib/api';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) => <a {...props} href={href}>{children}</a>,
}));
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/hooks/useConnectionWith', () => ({
  useConnectionActions: () => ({ connectionOf: () => 'none', accept: vi.fn() }),
}));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/lib/page-controls', () => ({ usePageList: () => {} }));
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), sendConnectionRequest: vi.fn() }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/common/PersonHovercard', () => ({ PersonHovercard: ({ children }: { children?: ReactNode }) => <>{children}</> }));

const person = (id: string, name: string): SearchHit => ({
  id,
  userId: id,
  displayName: name,
  headline: 'Builds marketplaces',
  bio: null,
  avatarUrl: null,
  location: 'Athens',
  role: 'founder',
  skillNames: [],
});

afterEach(cleanup);

describe('HomePeople rail (docs §131.2, §133.2)', () => {
  it('renders fixed-width tiles in a snap-scrolling rail, never crushed', () => {
    const { container } = render(<HomePeople matches={[person('u1', 'Marcus Chen'), person('u2', 'Eleni Papadopoulou')]} viewer={null} myId="me" />);
    // The rail itself is the shared PersonTileRail inside the section.
    const rail = container.querySelector('[data-home-people] [aria-label]')!;
    expect(rail.className).toContain('overflow-x-auto');
    expect(rail.className).toContain('snap-x');
    expect(rail.getAttribute('aria-label')).toContain('People who fit');
    const tiles = container.querySelectorAll('[data-home-people] [class*="w-[200px]"]');
    expect(tiles).toHaveLength(2);
    for (const tile of tiles) {
      expect(tile.className).toContain('shrink-0');
      expect(tile.className).toContain('snap-start');
    }
  });

  it('keeps the primary action’s full label — it never truncates', () => {
    render(<HomePeople matches={[person('u1', 'Marcus Chen')]} viewer={null} myId="me" />);
    const connect = screen.getByRole('button', { name: /Connect with Marcus Chen/ });
    expect(connect.textContent).toContain('Connect');
    // The nowrap rule lives on the action slot, beside CardMoreMenu.
    expect(connect.parentElement!.className).toContain('whitespace-nowrap');
  });
});

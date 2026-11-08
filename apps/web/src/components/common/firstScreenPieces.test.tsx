import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CardMoreMenu } from './CardMoreMenu';
import { CoverImage } from './CoverImage';
import { InfoHint } from './InfoHint';
import { PhoneFold } from './PhoneFold';
import { SessionDateTile } from '@/components/mentoring/SessionDateTile';

vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
// Radix opens on pointer events jsdom does not have; the menu's own tests cover that.
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect, asChild }: { children: React.ReactNode; onSelect?: () => void; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div role="menuitem" onClick={onSelect}>{children}</div>
  ),
}));

vi.mock('@/lib/i18n/useDateFormat', () => ({ useDateFormat: () => (d: Date, o?: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' }) }));

afterEach(cleanup);

describe('the rest of what a card can do', () => {
  it('runs what the button ran, and names who it is for', () => {
    const pass = vi.fn();
    render(<CardMoreMenu name="Elena" items={[{ key: 'pass', en: 'Pass', el: 'Παράλειψη', onSelect: pass, destructive: true }, { key: 'open', en: 'Full profile', el: 'Πλήρες προφίλ', href: '/profiles/1' }]} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('Elena');
    expect(screen.getByRole('link', { name: 'Full profile' }).getAttribute('href')).toBe('/profiles/1');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Pass' }));
    expect(pass).toHaveBeenCalledTimes(1);
  });

  it('draws nothing with nothing to offer', () => {
    const { container } = render(<CardMoreMenu name="Elena" items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('an explanation that waits to be asked for', () => {
  it('stays closed until pressed, and says so to a screen reader', () => {
    render(<InfoHint title={{ en: 'What is this', el: 'Τι είναι αυτό' }}>The whole story</InfoHint>);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('The whole story').closest('[hidden]')).not.toBeNull();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('The whole story').closest('[hidden]')).toBeNull();
  });
});

describe('a picture across a card', () => {
  it('holds its room before it loads, and leaves no gap when it fails', () => {
    const { container } = render(<CoverImage src="https://example.com/a.jpg" />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.className).toContain('aspect-[3/1]');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('loading')).toBe('lazy');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
  });

  it('is nothing without a source', () => {
    const { container } = render(<CoverImage src={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('a section folded on a phone', () => {
  it('opens by itself when what it holds was filled, and keeps its fields mounted while closed', () => {
    const { rerender } = render(<PhoneFold title={{ en: 'More details', el: 'Περισσότερα στοιχεία' }}><input aria-label="Notes" /></PhoneFold>);
    const fold = document.querySelector('[data-phone-fold]') as HTMLElement;
    expect(fold.dataset.phoneFold).toBe('closed');
    expect(screen.getByLabelText('Notes')).toBeTruthy();
    rerender(<PhoneFold title={{ en: 'More details', el: 'Περισσότερα στοιχεία' }} openWhen><input aria-label="Notes" /></PhoneFold>);
    expect(fold.dataset.phoneFold).toBe('open');
    expect(screen.getByRole('button', { name: 'More details' }).getAttribute('aria-expanded')).toBe('true');
  });
});

describe('the date a session opens with', () => {
  it('carries the other person on its corner, and only when there is one', () => {
    const { container, rerender } = render(<SessionDateTile date={new Date('2026-11-12T10:00:00Z')} />);
    expect(container.querySelector('[data-session-face]')).toBeNull();
    expect(container.textContent).toContain('12');
    rerender(<SessionDateTile date={new Date('2026-11-12T10:00:00Z')} face={{ src: null, name: 'Elena Papadopoulos' }} />);
    expect(container.querySelector('[data-session-face]')?.textContent).toBe('EP');
  });
});

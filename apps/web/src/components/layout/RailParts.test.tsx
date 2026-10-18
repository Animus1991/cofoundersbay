import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RailLink, RailStats } from './RailParts';
import { CLOSE_PAGE_TOOLS_EVENT } from './PageRailContext';

describe('RailStats description list', () => {
  it('keeps each bilingual term and value in a single valid description-list group', () => {
    const { container } = render(
      <RailStats items={[{ key: 'people', label: 'People', labelEl: 'Άτομα', value: 12, icon: Users, tone: 'bg-status-accent-bg text-status-accent' }]} />,
    );
    const list = container.querySelector('dl');
    const group = list?.firstElementChild;

    expect(group?.tagName).toBe('DIV');
    expect(group?.querySelectorAll('dt')).toHaveLength(1);
    expect(group?.querySelectorAll('dd')).toHaveLength(1);
    expect(group?.querySelector('dt')?.parentElement).toBe(group);
    expect(group?.querySelector('dd')?.parentElement).toBe(group);
    expect(screen.getByText('People')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.innerHTML).not.toContain('bg-status-accent-bg');
  });
});

describe('RailLink', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('is a real link to a page, with the sentence that says what is there', () => {
    render(
      <RailLink
        href="/settings/billing"
        icon={Users}
        en="Plan & billing"
        el="Πλάνο & χρεώσεις"
        descEn="Your plan and where invoices go"
        descEl="Το πακέτο σας και πού στέλνονται τα τιμολόγια"
      />,
    );
    const link = screen.getByRole('link', { name: /Plan & billing/ });
    expect(link.getAttribute('href')).toBe('/settings/billing');
    expect(link.textContent).toContain('Your plan and where invoices go');
    // The icon is decoration beside a visible label.
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps a jump to a card on the page as a plain fragment link', () => {
    render(<RailLink href="#billing" en="Billing" el="Χρέωση" />);
    const link = screen.getByRole('link', { name: /Billing/ });
    expect(link.getAttribute('href')).toBe('#billing');
    // No description line and no icon when the destination has neither.
    expect(link.querySelector('svg')).toBeNull();
    expect(link.querySelectorAll('span.text-xs')).toHaveLength(0);
  });

  it.each(['#billing', '/settings/ai'])('asks the rail to step aside when %s is followed', (href) => {
    const heard = vi.fn();
    window.addEventListener(CLOSE_PAGE_TOOLS_EVENT, heard);
    render(<RailLink href={href} en="Somewhere" el="Κάπου" />);
    // jsdom does not navigate on a fragment or route link; the click is what is under test.
    const link = screen.getByRole('link', { name: /Somewhere/ });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    window.removeEventListener(CLOSE_PAGE_TOOLS_EVENT, heard);
    expect(heard).toHaveBeenCalledTimes(1);
  });
});

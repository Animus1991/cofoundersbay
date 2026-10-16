import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CommandPalette, paletteMode } from './CommandPalette';
import { PopupChatProvider, usePopupChat } from '@/contexts/PopupChatContext';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const searchProfiles = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  searchProfiles: (...args: unknown[]) => searchProfiles(...args),
}));

vi.mock('@/components/layout/RoleTheme', () => ({
  useTheme: () => ({ setTheme: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

function PopupProbe() {
  const popup = usePopupChat();
  return <div data-testid="popup-probe" data-open={String(popup.isOpen)} data-tab={popup.preferredTab ?? ''} />;
}

describe('command palette', () => {
  it('puts the assistant first and opens it on this page', () => {
    render(
      <PopupChatProvider>
        <PopupProbe />
        <CommandPalette open onOpenChange={() => {}} />
      </PopupChatProvider>,
    );
    const buttons = screen.getAllByRole('button');
    const assistant = buttons.findIndex((button) => /Ask the assistant/.test(button.textContent ?? ''));
    const home = buttons.findIndex((button) => /Go to Home/.test(button.textContent ?? ''));
    expect(assistant).toBeGreaterThanOrEqual(0);
    expect(home).toBeGreaterThan(assistant);
    expect(screen.getByRole('button', { name: /Go to AI Assistant/ })).toBeTruthy();

    fireEvent.click(buttons[assistant]);
    const probe = screen.getByTestId('popup-probe');
    expect(probe.getAttribute('data-open')).toBe('true');
    expect(probe.getAttribute('data-tab')).toBe('ai');
    expect(push).not.toHaveBeenCalled();
  });

  it('opens the assistant page when the panel is not mounted', () => {
    render(<CommandPalette open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Ask the assistant/ }));
    expect(push).toHaveBeenCalledWith('/ai');
  });

  it('reads the first character as GitHub does: > commands, @ people, / pages', () => {
    expect(paletteMode('>theme')).toEqual({ mode: 'commands', term: 'theme' });
    expect(paletteMode('@ marcus')).toEqual({ mode: 'people', term: 'marcus' });
    expect(paletteMode('/scout')).toEqual({ mode: 'pages', term: 'scout' });
    expect(paletteMode('scout')).toEqual({ mode: 'all', term: 'scout' });
  });

  it('lists only commands after >, without pages or the assistant', () => {
    render(<CommandPalette open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search or jump to/), { target: { value: '>home' } });
    expect(screen.getByRole('button', { name: /Go to Home/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Ask the assistant/ })).toBeNull();
  });

  it('finds people after @ and opens the profile', async () => {
    searchProfiles.mockResolvedValue({ hits: [{ id: 'p1', userId: 'user-marcus', displayName: 'Marcus Chen', headline: 'Technical cofounder' }], total: 1 });
    render(<CommandPalette open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search or jump to/), { target: { value: '@marc' } });
    const person = await waitFor(() => screen.getByRole('button', { name: /Marcus Chen/ }));
    expect(searchProfiles).toHaveBeenCalledWith({ q: 'marc', limit: 6 });
    fireEvent.click(person);
    expect(push).toHaveBeenCalledWith('/profiles/user-marcus');
  });
});

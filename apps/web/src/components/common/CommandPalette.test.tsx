import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';
import { PopupChatProvider, usePopupChat } from '@/contexts/PopupChatContext';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
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
});

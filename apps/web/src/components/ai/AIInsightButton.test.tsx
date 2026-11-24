import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AIInsightButton } from './AIInsightButton';

const { askSpy } = vi.hoisted(() => ({ askSpy: vi.fn() }));
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask: askSpy }) }));

const prompt = { en: 'Help me improve team readiness.', el: 'Βοήθησέ με να βελτιώσω την ετοιμότητα ομάδας.' };

afterEach(() => {
  cleanup();
  askSpy.mockReset();
});

describe('AIInsightButton, the one form on a card (docs §125)', () => {
  it('shows the short verb and carries the full name', () => {
    render(<AIInsightButton variant="card" prompt={prompt} label="Ask AI" labelEl="Ρωτήστε το AI" aboutEn="Team readiness" aboutEl="Ετοιμότητα ομάδας" />);
    const button = screen.getByRole('button', { name: /Ask AI\. Ρωτήστε το AI: Team readiness/ });
    expect(button.textContent).toContain('Ask');
    expect(button.getAttribute('aria-label')).toBe('Ask AI. Ρωτήστε το AI: Team readiness. Ετοιμότητα ομάδας');
    expect(button.getAttribute('title')).toBe(button.getAttribute('aria-label'));
  });

  it('asks the assistant the card’s question on click', () => {
    render(<AIInsightButton variant="card" prompt={prompt} />);
    fireEvent.click(screen.getByRole('button', { name: /Ask AI/ }));
    expect(askSpy).toHaveBeenCalledWith(prompt);
  });
});

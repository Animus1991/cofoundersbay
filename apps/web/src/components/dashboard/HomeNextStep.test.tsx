import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HomeNextStep } from './HomeNextStep';

const { askSpy } = vi.hoisted(() => ({ askSpy: vi.fn() }));
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask: askSpy }) }));

afterEach(() => {
  cleanup();
  askSpy.mockReset();
});

describe('HomeNextStep, the one anatomy of a home screen’s next move', () => {
  it('draws what comes up on the brand tint, with the glyph of the page it opens', () => {
    const { container } = render(
      <HomeNextStep kickerEn="Next session" kickerEl="Επόμενη συνεδρία" title="Sofia Alexiou" href="/mentor/sessions" actionEn="Open" actionEl="Άνοιγμα" />,
    );
    const box = container.querySelector('[data-next-step]') as HTMLElement;
    expect(box.getAttribute('data-next-step')).toBe('next');
    expect(box.className).toMatch(/bg-primary-subtle/);
    expect(box.querySelector('svg.cfb-glyph [data-accent]')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open/ }).getAttribute('href')).toBe('/mentor/sessions');
  });

  it('draws what waits on the reader on the attention tint', () => {
    const { container } = render(
      <HomeNextStep tone="waiting" kickerEn="Waiting on you" kickerEl="Σας περιμένει" title="Katerina · Seed model" href="/provider/inquiries" actionEn="Reply" actionEl="Απάντηση" />,
    );
    const box = container.querySelector('[data-next-step]') as HTMLElement;
    expect(box.getAttribute('data-next-step')).toBe('waiting');
    expect(box.className).toMatch(/bg-status-warning-bg/);
    expect(box.getAttribute('aria-label')).toBe('Waiting on you · Σας περιμένει');
  });

  it('asks about the step beside the action: its own question, or the step itself', async () => {
    const onAsk = vi.fn();
    const { unmount } = render(
      <HomeNextStep kickerEn="Next session" kickerEl="Επόμενη συνεδρία" title="Sofia Alexiou" href="/mentor/sessions" actionEn="Open" actionEl="Άνοιγμα" askEn="Ask" askEl="Ρωτήστε" onAsk={onAsk} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ask/ }));
    expect(onAsk).toHaveBeenCalledOnce();
    expect(askSpy).not.toHaveBeenCalled();
    unmount();
    // Without a question of its own, Ask puts the step to the assistant: the
    // prototype's next move always carries one (E1, 2026-10-28;
    // docs/audit/COMPARATIVE_HOME_AI_2026-10-28.md). It was hidden before.
    render(
      <HomeNextStep kickerEn="Next session" kickerEl="Επόμενη συνεδρία" title="Sofia Alexiou" reasonEn="Starts in 20 minutes" reasonEl="Ξεκινά σε 20 λεπτά" href="/mentor/sessions" actionEn="Open" actionEl="Άνοιγμα" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ask/ }));
    expect(askSpy).toHaveBeenCalledWith({
      en: 'What should I do here? Next session: Sofia Alexiou. Starts in 20 minutes',
      el: 'Τι κάνω εδώ; Επόμενη συνεδρία: Sofia Alexiou. Ξεκινά σε 20 λεπτά',
    });
  });

  it('stacks the anatomy in a narrow column: label row, full-width title, buttons row (docs §133.9)', () => {
    const { container } = render(
      <HomeNextStep stacked kickerEn="Continue" kickerEl="Συνεχίστε" title="A very long board title that used to wrap three lines" href="/research/b1" actionEn="Continue" actionEl="Συνέχεια" />,
    );
    const box = container.querySelector('[data-next-step]') as HTMLElement;
    expect(box.className).toContain('flex-col');
    // The title sits full width and clamps to two lines…
    const title = box.querySelector('[data-testid^="home-next-title-"]') as HTMLElement;
    expect(title.className).toContain('line-clamp-2');
    // …and the buttons keep their own row below it, with the same handlers.
    const buttonsRow = title.nextElementSibling as HTMLElement;
    expect(buttonsRow.className).toContain('flex');
    expect(buttonsRow.querySelector('[data-next-ask]')).toBeTruthy();
    expect(buttonsRow.querySelector('[data-next-open]')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Continue/ }).getAttribute('href')).toBe('/research/b1');
  });
});

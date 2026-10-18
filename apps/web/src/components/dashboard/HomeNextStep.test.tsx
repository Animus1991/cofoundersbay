import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HomeNextStep } from './HomeNextStep';

afterEach(cleanup);

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
});

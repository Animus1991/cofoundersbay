import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { WhatsNewPanel, whatsNewItems, type WhatsNewAudience } from './WhatsNewPanel';

/**
 * "What's new": every entry opens a page that exists, each audience sees
 * what it can use, and hiding it is remembered.
 */

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const APP = resolve(__dirname, '../../app');
const pageExists = (href: string) => {
  const path = href.split('#')[0].split('?')[0];
  return existsSync(resolve(APP, `.${path}`, 'page.tsx'));
};

describe('what is new', () => {
  it('links only to pages that exist', () => {
    for (const audience of ['founder', 'investor', 'mentor', 'org', 'provider'] as WhatsNewAudience[]) {
      for (const item of whatsNewItems(audience)) expect(pageExists(item.href), item.href).toBe(true);
    }
  });

  it('shows founders the need cards and the scout, and investors neither', () => {
    const founder = whatsNewItems('founder').map((i) => i.href);
    expect(founder).toEqual(expect.arrayContaining(['/commitments/new', '/scout', '/intros', '/transparency']));
    const investor = whatsNewItems('investor').map((i) => i.href);
    expect(investor).not.toContain('/scout');
    expect(investor).toEqual(expect.arrayContaining(['/updates', '/intros', '/settings#verification']));
  });

  it('can be hidden, and stays hidden', () => {
    render(<WhatsNewPanel audience="founder" />);
    expect(screen.getByRole('heading', { name: /What’s new/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Hide/ }));
    expect(screen.queryByRole('heading', { name: /What’s new/ })).toBeNull();
    cleanup();
    render(<WhatsNewPanel audience="founder" />);
    expect(screen.queryByRole('heading', { name: /What’s new/ })).toBeNull();
  });
});

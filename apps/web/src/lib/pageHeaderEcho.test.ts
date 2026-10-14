import { describe, expect, it } from 'vitest';
import { lineEchoesHeading, resolvePageHeader } from './page-registry';

describe('a page title is said once', () => {
  it('drops a subtitle that repeats the heading and keeps a line that adds a fact', () => {
    expect(lineEchoesHeading('Shared link', 'Something shared with you through a link.')).toBe(true);
    expect(lineEchoesHeading('Set a new password', 'Choose a new password for your account.')).toBe(true);
    expect(lineEchoesHeading('Help & Support', 'Search our knowledge base or browse topics below')).toBe(false);
    expect(lineEchoesHeading('Commitments', 'Need cards and the ladder from interest to agreed terms: a protected first conversation, separate confirmations, versioned terms.')).toBe(false);
  });

  it('keeps a fact under the title and drops a line that only repeats it', () => {
    expect(resolvePageHeader('/share/[token]').description).toMatch(/No account/);
    expect(resolvePageHeader('/reset-password').description).toMatch(/email works once/);
    expect(lineEchoesHeading('Shared link', resolvePageHeader('/share/[token]').description ?? '')).toBe(false);
    expect(lineEchoesHeading('Set a new password', resolvePageHeader('/reset-password').description ?? '')).toBe(false);
    expect(resolvePageHeader('/commitments', { description: 'Your commitments' }).description).toBeUndefined();
    expect(resolvePageHeader('/commitments').description).toMatch(/Need cards/);
  });
});

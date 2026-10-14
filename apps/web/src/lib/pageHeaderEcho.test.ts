import { describe, expect, it } from 'vitest';
import { lineEchoesHeading, resolvePageHeader } from './page-registry';

describe('a page title is said once', () => {
  it('drops a subtitle that repeats the heading and keeps a line that adds a fact', () => {
    expect(lineEchoesHeading('Shared link', 'Something shared with you through a link.')).toBe(true);
    expect(lineEchoesHeading('Set a new password', 'Choose a new password for your account.')).toBe(true);
    expect(lineEchoesHeading('Help & Support', 'Search our knowledge base or browse topics below')).toBe(false);
    expect(lineEchoesHeading('Commitments', 'Need cards and the ladder from interest to agreed terms: a protected first conversation, separate confirmations, versioned terms.')).toBe(false);
  });

  it('omits an echoing registry subtitle from the header', () => {
    expect(resolvePageHeader('/share/[token]').description).toBeUndefined();
    expect(resolvePageHeader('/reset-password').description).toBeUndefined();
    expect(resolvePageHeader('/commitments').description).toMatch(/Need cards/);
  });
});
